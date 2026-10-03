import type { BuiltBook } from '../../data/buildPages';
import type { BookDoc } from '../../data/schema';
import { paper, renderSoundtrack, type Cue } from '../../sound/engine';
import { srcToBlob } from '../../storage/assets';
import { getTheme } from '../../themes';
import { composeLongImage, pickVideoMime, type Segment } from '../capture';
import { facesFor, fontFaceCss, toDataUri } from '../fontSlices';
import type { PressHandle } from './press';
import { FilmRenderer, FORMATS, geometryFor, pagesFor, turnsOf, type FilmFormat, type Look, type Picture, type Turn } from './renderer';

/**
 * The page-turning video, made without screen capture (phones, tablets, any browser with
 * WebCodecs): each page is pictured from the DOM, the turns are drawn on a canvas, the
 * page sounds and music are mixed offline, and all of it is encoded to MP4 faster than
 * real time. Falls back to recording the canvas in real time where WebCodecs is missing.
 */

const FPS = 30;
/** Mostly still pages: 3 Mbps keeps text crisp and a 50 s book near 20 MB (a size chat apps accept as video). */
const BITRATE = 3_000_000;
/** Timing matches the screen-recorded video. */
const INTRO = 1.2;
const TURN = 0.95;
const DWELL = 2.6;
/** Second page of the same spread (portrait): a shorter look. */
const DWELL_SAME = 1.7;
const OUTRO = 2.4;
const CAPTION_IN = { delay: 0.12, fade: 0.7 };
const CAPTION_OUT = 0.26;

type Progress = (text: string, fraction?: number) => void;

export class FilmCancelled extends Error {
  constructor() {
    super('已取消');
  }
}

type Shot = { kind: 'rest'; index: number; start: number; end: number } | { kind: 'turn'; turn: Turn; start: number; end: number };

function timeline(built: BuiltBook) {
  const shots: Shot[] = [];
  let t = 0;
  shots.push({ kind: 'rest', index: 0, start: t, end: (t += INTRO) });
  const turns = turnsOf(built);
  turns.forEach((turn, k) => {
    shots.push({ kind: 'turn', turn, start: t, end: (t += TURN) });
    const sameView = built.pages[turn.to].view === built.pages[turn.from].view;
    const hold = k === turns.length - 1 ? OUTRO : sameView ? DWELL_SAME : DWELL;
    shots.push({ kind: 'rest', index: turn.to, start: t, end: (t += hold) });
  });
  return { shots, seconds: t };
}

/** Seconds the film will last (shown before it is made). */
export function filmSeconds(built: BuiltBook) {
  return Math.round(timeline(built).seconds);
}

export interface FilmResult {
  blob: Blob;
  mp4: boolean;
  audio: boolean;
}

interface Source {
  book: BookDoc;
  built: BuiltBook;
  format: FilmFormat;
  press: PressHandle;
  /** The live desk scene (pictured once as the backdrop when its shape suits the video). */
  scene: HTMLElement | null;
  sound: boolean;
  onProgress: Progress;
  signal?: AbortSignal;
}

/* ------------------------------------------------------------------ pictures */

async function fontCss(book: BookDoc, text: string) {
  const faces = facesFor(book, text);
  const css: string[] = [];
  await Promise.all(
    faces.map(async (f) => {
      try {
        const res = await fetch(f.url);
        if (res.ok) css.push(fontFaceCss(f, await toDataUri(await res.blob())));
      } catch {
        /* that slice falls back to a system font */
      }
    }),
  );
  return css.join('\n');
}

async function waitImages(el: HTMLElement) {
  const imgs = [...el.querySelectorAll('img')];
  await Promise.all(imgs.map((im) => (im.complete ? Promise.resolve() : im.decode().catch(() => undefined))));
}

type Snap = (el: HTMLElement, scale: number) => Promise<HTMLCanvasElement>;

/**
 * The paper grain, fibres and watercolour masks are inline SVGs whose filters are referenced
 * as `url(#n)` inside the data URI. modern-screenshot takes that inner `url(…)` for a file,
 * fetches it and breaks the whole background (the paper turns transparent). Spelling the
 * brackets as %28 %29 hides it from the library; the SVG decodes to the same `url(#n)`.
 */
const INNER_URL = /url\((%23|#)([\w-]+)\)/g;
const IMAGE_PROPS = ['background-image', 'mask-image', '-webkit-mask-image', 'border-image-source'];
function keepInlineSvgs(node: Node) {
  const st = (node as HTMLElement).style as CSSStyleDeclaration | undefined;
  if (!st) return;
  for (const p of IMAGE_PROPS) {
    const v = st.getPropertyValue(p);
    if (!v || !v.includes('data:image/svg')) continue;
    const fixed = v.replace(INNER_URL, 'url%28%23$2%29');
    if (fixed !== v) st.setProperty(p, fixed, st.getPropertyPriority(p));
  }
}

async function snapper(book: BookDoc, text: string): Promise<Snap> {
  const [{ domToCanvas }, cssText] = await Promise.all([import('modern-screenshot'), fontCss(book, text)]);
  return async (el, scale) => {
    await waitImages(el);
    return domToCanvas(el, { scale, backgroundColor: null, font: { cssText }, timeout: 20000, onCloneEachNode: keepInlineSvgs });
  };
}

/** Pictures of pages, made when first needed and let go once the film has moved past them. */
class Pages {
  private pics = new Map<number, HTMLCanvasElement>();
  constructor(
    private press: PressHandle,
    private snap: Snap,
    private scale: number,
  ) {}
  async need(indices: number[]) {
    for (const i of indices) {
      if (this.pics.has(i)) continue;
      const el = this.press.page(i);
      if (el) this.pics.set(i, await this.snap(el, this.scale));
    }
  }
  keepOnly(indices: number[]) {
    for (const i of [...this.pics.keys()]) if (!indices.includes(i)) this.release(i);
  }
  private release(i: number) {
    const c = this.pics.get(i);
    if (c) c.width = c.height = 0; // frees the pixels now rather than at the next GC
    this.pics.delete(i);
  }
  get = (i: number): Picture | undefined => this.pics.get(i);
}

async function lookOf(src: Source, snap: Snap): Promise<Look> {
  const root = src.press.root()!;
  const cs = getComputedStyle(root);
  const v = (name: string, fallback: string) => cs.getPropertyValue(name).trim() || fallback;
  const look: Look = {
    room: v('--room', '#f4efe6'),
    paper: v('--paper', '#fbf7ee'),
    paperDeep: v('--paper-deep', '#e9e0cf'),
    paperEdge: v('--paper-edge', '#d8ccb6'),
  };
  const scene = src.scene;
  if (scene) {
    const f = FORMATS[src.format];
    const ratio = scene.clientWidth / Math.max(1, scene.clientHeight) / (f.w / f.h);
    // a scene laid out for a very different screen shape would crop badly: plain table instead
    if (ratio > 0.7 && ratio < 1.45) {
      try {
        const scale = Math.min(2, Math.max(f.outW / scene.clientWidth, f.outH / scene.clientHeight));
        look.scene = await snap(scene, scale);
      } catch {
        /* plain table */
      }
    }
  }
  return look;
}

/* ------------------------------------------------------------------ sound */

async function soundtrack(src: Source, seconds: number, shots: Shot[]) {
  const theme = getTheme(src.book.themeId);
  const cues: Cue[] = [];
  if (src.sound) {
    for (const s of shots) {
      if (s.kind !== 'turn') continue;
      const kind = s.turn.hard ? 'board' : 'page';
      cues.push({ at: s.start + 0.02, recipe: theme.sound?.[kind] ?? paper(kind) });
    }
  }
  let music: { data: ArrayBuffer; from: number; volume: number } | undefined;
  const firstTurn = shots.find((s) => s.kind === 'turn');
  if (src.book.music?.src && firstTurn) {
    try {
      music = { data: await (await srcToBlob(src.book.music.src)).arrayBuffer(), from: firstTurn.start, volume: 0.55 };
    } catch {
      /* no music */
    }
  }
  if (!cues.length && !music) return null;
  return renderSoundtrack({ seconds, cues, music });
}

/* ------------------------------------------------------------------ the film */

function frameAt(shots: Shot[], t: number) {
  for (let i = 0; i < shots.length; i++) if (t < shots[i].end || i === shots.length - 1) return i;
  return shots.length - 1;
}

export async function makeFilm(src: Source): Promise<FilmResult> {
  const { built, format, onProgress, signal } = src;
  const check = () => {
    if (signal?.aborted) throw new FilmCancelled();
  };
  const g = geometryFor(format);
  onProgress('准备字体和页面…', 0);
  const text = `${src.press.root()?.textContent ?? ''}${src.scene?.textContent ?? ''}`;
  const snap = await snapper(src.book, text);
  check();
  const look = await lookOf(src, snap);
  check();
  const pages = new Pages(src.press, snap, g.scale);
  const captions = new Map<number, HTMLCanvasElement | null>();
  const captionPic = async (view: number) => {
    if (!captions.has(view)) {
      const el = src.press.caption(view);
      captions.set(view, el ? await snap(el, g.scale) : null);
    }
    return captions.get(view) ?? undefined;
  };

  const { shots, seconds } = timeline(built);
  onProgress('合成声音…', 0.02);
  const audio = await soundtrack(src, seconds, shots).catch(() => null);
  check();

  const canvas = document.createElement('canvas');
  const r = new FilmRenderer(canvas, built, look, format);
  const total = Math.ceil(seconds * FPS);

  /** Everything a frame needs is ready (pictures made); draws frame `f`. */
  const draw = async (f: number) => {
    const t = f / FPS;
    const i = frameAt(shots, t);
    const s = shots[i];
    const need = s.kind === 'rest' ? pagesFor(built, s.index) : pagesFor(built, s.turn);
    // the next shot's pages too, so a turn never waits on a picture mid-way
    const next = shots[i + 1];
    const soon = next ? (next.kind === 'rest' ? pagesFor(built, next.index) : pagesFor(built, next.turn)) : [];
    await pages.need([...need, ...soon]);
    pages.keepOnly([...need, ...soon]);
    if (s.kind === 'rest') {
      const view = built.pages[s.index].view;
      const pic = await captionPic(view);
      const k = (t - s.start - CAPTION_IN.delay) / CAPTION_IN.fade;
      r.rest(s.index, pages.get, pic ? { pic, alpha: Math.max(0, Math.min(1, k)) } : undefined);
    } else {
      const view = built.pages[s.turn.from].view;
      const pic = await captionPic(view);
      const out = 1 - (t - s.start) / CAPTION_OUT;
      r.turn(s.turn, (t - s.start) / (s.end - s.start), pages.get, pic ? { pic, alpha: Math.max(0, out) } : undefined);
    }
  };

  const mb = await import('mediabunny');
  const f = FORMATS[format];
  const webcodecs =
    typeof VideoEncoder !== 'undefined' && (await mb.canEncodeVideo('avc', { width: f.outW, height: f.outH, bitrate: BITRATE }).catch(() => false));
  check();

  if (webcodecs) {
    const target = new mb.BufferTarget();
    const output = new mb.Output({ format: new mb.Mp4OutputFormat({ fastStart: 'in-memory' }), target });
    const video = new mb.CanvasSource(canvas, { codec: 'avc', bitrate: BITRATE, keyFrameInterval: 2 });
    output.addVideoTrack(video, { frameRate: FPS });
    let sound: InstanceType<typeof mb.AudioBufferSource> | null = null;
    if (audio) {
      for (const codec of ['aac', 'opus'] as const) {
        if (await mb.canEncodeAudio(codec, { numberOfChannels: 2, sampleRate: audio.sampleRate, bitrate: 128_000 }).catch(() => false)) {
          sound = new mb.AudioBufferSource({ codec, bitrate: 128_000 });
          output.addAudioTrack(sound);
          break;
        }
      }
    }
    await output.start();
    try {
      if (sound && audio) {
        await sound.add(audio);
        sound.close();
      }
      for (let i = 0; i < total; i++) {
        check();
        await draw(i);
        await video.add(i / FPS, 1 / FPS);
        if (i % 15 === 0) onProgress(`正在生成视频 ${Math.round((i / total) * 100)}%`, i / total);
      }
      video.close();
      onProgress('正在保存…', 1);
      await output.finalize();
    } catch (err) {
      await output.cancel().catch(() => undefined);
      throw err;
    }
    return { blob: new Blob([target.buffer!], { type: 'video/mp4' }), mp4: true, audio: !!sound };
  }

  return realTime(canvas, total, draw, audio, onProgress, check);
}

/** Without WebCodecs: play the film on the canvas in real time and record it. */
async function realTime(canvas: HTMLCanvasElement, total: number, draw: (f: number) => Promise<void>, audio: AudioBuffer | null, onProgress: Progress, check: () => void): Promise<FilmResult> {
  if (typeof MediaRecorder === 'undefined' || !canvas.captureStream) throw new Error('这个浏览器不能生成视频，请换用 Safari、Chrome 或 Edge 的最新版本。');
  const stream = canvas.captureStream(FPS);
  let ac: AudioContext | null = null;
  if (audio) {
    ac = new AudioContext();
    const dest = ac.createMediaStreamDestination();
    const node = ac.createBufferSource();
    node.buffer = audio;
    node.connect(dest);
    dest.stream.getAudioTracks().forEach((t) => stream.addTrack(t));
    node.start(ac.currentTime + 0.05);
  }
  const mimeType = pickVideoMime();
  const rec = new MediaRecorder(stream, { mimeType, videoBitsPerSecond: BITRATE });
  const chunks: Blob[] = [];
  rec.ondataavailable = (e) => e.data.size && chunks.push(e.data);
  const done = new Promise<Blob>((res) => (rec.onstop = () => res(new Blob(chunks, { type: (rec.mimeType || mimeType).split(';')[0] || 'video/webm' }))));
  await draw(0);
  rec.start(1000);
  const t0 = performance.now();
  try {
    for (;;) {
      check();
      const f = Math.floor(((performance.now() - t0) / 1000) * FPS);
      if (f >= total) break;
      await draw(f);
      if (f % 15 === 0) onProgress(`正在录制 ${Math.round((f / total) * 100)}%（请保持这个页面在前台）`, f / total);
      await new Promise((r) => requestAnimationFrame(r));
    }
  } finally {
    if (rec.state !== 'inactive') rec.stop();
    void ac?.close();
  }
  const blob = await done;
  return { blob, mp4: blob.type === 'video/mp4', audio: !!audio };
}

/* ------------------------------------------------------------------ long picture */

/** The long picture from page pictures (no screen capture): each view drawn at rest, stacked. */
export async function makeLongImage(src: Omit<Source, 'format' | 'sound' | 'scene'>, footer: string): Promise<Blob> {
  const format: FilmFormat = src.built.layout === 'landscape' ? 'landscape' : 'portrait';
  const g = geometryFor(format);
  src.onProgress('准备字体和页面…', 0);
  const snap = await snapper(src.book, src.press.root()?.textContent ?? '');
  const look = await lookOf({ ...src, format, sound: false, scene: null }, snap);
  const pages = new Pages(src.press, snap, g.scale);
  const canvas = document.createElement('canvas');
  const r = new FilmRenderer(canvas, src.built, look, format, true);
  const rests = [0, ...turnsOf(src.built).map((t) => t.to)];
  const segments: Segment[] = [];
  const last = src.built.pages.length - 1;
  for (const [n, i] of rests.entries()) {
    if (src.signal?.aborted) throw new FilmCancelled();
    src.onProgress(`正在拍下每一页 ${n + 1}/${rests.length}…`, n / rests.length);
    await pages.need(pagesFor(src.built, i));
    pages.keepOnly(pagesFor(src.built, i));
    // the caption line under the spread, as in the screen-captured long picture
    const capEl = src.press.caption(src.built.pages[i].view);
    const cap = capEl ? await snap(capEl, g.scale) : undefined;
    r.rest(i, pages.get, cap ? { pic: cap, alpha: 1 } : undefined);
    const closed = g.landscape && (i === 0 || i === last);
    const air = g.H * 0.04;
    const x = closed ? g.left + g.W / 2 - air : g.left - air;
    const w = (closed || !g.landscape ? g.W : g.W * 2) + air * 2;
    const bottom = cap ? g.captionTop + cap.height / g.scale : g.top + g.H;
    const crop = document.createElement('canvas');
    crop.width = Math.round(w * g.scale);
    crop.height = Math.round((bottom - g.top + air * 2) * g.scale);
    crop.getContext('2d')!.drawImage(canvas, x * g.scale, (g.top - air) * g.scale, crop.width, crop.height, 0, 0, crop.width, crop.height);
    segments.push({ bitmap: crop, kind: closed || !g.landscape ? 'cover' : 'spread' });
  }
  src.onProgress('正在拼成长图…', 1);
  return composeLongImage(segments, { background: look.room, ink: getComputedStyle(src.press.root()!).getPropertyValue('--room-ink').trim() || '#6d5d48', footer });
}
