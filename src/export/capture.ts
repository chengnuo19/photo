/**
 * Capturing the book as it really looks — for sharing where a web page cannot go (WeChat
 * chats and Moments take videos and pictures, not .html files).
 *
 * The page records *itself* through tab capture (getDisplayMedia with preferCurrentTab):
 * every theme, font, filter, desk scene and page-turn is pixel-exact, which no DOM-to-canvas
 * library manages. The browser asks the person to share "this tab" first; Chrome and Edge on
 * desktop support it.
 */

export function captureSupport(): { ok: true } | { ok: false; reason: string } {
  const md = navigator.mediaDevices as MediaDevices | undefined;
  if (!md?.getDisplayMedia) return { ok: false, reason: '这个浏览器不支持录制画面。请在电脑上用 Chrome 或 Edge 打开。' };
  if (window.matchMedia('(pointer: coarse)').matches && !window.matchMedia('(pointer: fine)').matches) {
    return { ok: false, reason: '手机浏览器不支持录制画面。请在电脑上用 Chrome 或 Edge 打开。' };
  }
  return { ok: true };
}

export class NotThisTabError extends Error {
  constructor() {
    super('请在弹出的窗口里选择「此标签页」（当前这个页面），再试一次。');
  }
}

/**
 * Ask to capture this tab. `region` (the full-window room) is used to crop to the page and,
 * where Region Capture exists, to confirm the person really picked this tab.
 */
export async function captureThisTab(region: Element, audio: boolean): Promise<MediaStream> {
  const opts = {
    video: { frameRate: { ideal: 30, max: 30 }, cursor: 'never', displaySurface: 'browser' },
    audio: audio ? { suppressLocalAudioPlayback: false } : false,
    preferCurrentTab: true,
    selfBrowserSurface: 'include',
    surfaceSwitching: 'exclude',
    systemAudio: 'exclude',
  } as DisplayMediaStreamOptions;
  const stream = await navigator.mediaDevices.getDisplayMedia(opts);
  const [track] = stream.getVideoTracks();
  const stop = () => stream.getTracks().forEach((t) => t.stop());
  try {
    const settings = track.getSettings() as MediaTrackSettings & { displaySurface?: string };
    if (settings.displaySurface && settings.displaySurface !== 'browser') throw new NotThisTabError();
    const CT = (window as unknown as { CropTarget?: { fromElement(el: Element): Promise<unknown> } }).CropTarget;
    const crop = (track as unknown as { cropTo?: (t: unknown) => Promise<void> }).cropTo;
    if (CT && crop) {
      // cropTo only succeeds when the captured surface is this very tab
      try {
        await crop.call(track, await CT.fromElement(region));
      } catch {
        throw new NotThisTabError();
      }
    } else if (settings.width && settings.height) {
      const want = window.innerWidth / window.innerHeight;
      if (Math.abs(settings.width / settings.height - want) / want > 0.12) throw new NotThisTabError();
    }
    return stream;
  } catch (err) {
    stop();
    throw err;
  }
}

/** A <video> playing the stream, so frames can be drawn to a canvas. */
export async function streamVideo(stream: MediaStream): Promise<HTMLVideoElement> {
  const v = document.createElement('video');
  v.muted = true;
  v.playsInline = true;
  v.srcObject = stream;
  await v.play();
  if (!v.videoWidth) await new Promise((r) => v.addEventListener('loadedmetadata', r, { once: true }));
  return v;
}

/** Resolve on the next frame the capture delivers (so a grab never shows the previous page). */
export function nextFrame(v: HTMLVideoElement): Promise<void> {
  const rvfc = (v as HTMLVideoElement & { requestVideoFrameCallback?: (cb: () => void) => number }).requestVideoFrameCallback;
  if (rvfc) return new Promise((r) => rvfc.call(v, () => r()));
  return new Promise((r) => setTimeout(r, 120));
}

const MIME = [
  'video/mp4;codecs=avc1.640028,mp4a.40.2',
  'video/mp4;codecs=avc1.42E01E,mp4a.40.2',
  'video/mp4',
  'video/webm;codecs=vp9,opus',
  'video/webm;codecs=vp8,opus',
  'video/webm',
];

export function pickVideoMime() {
  return MIME.find((m) => MediaRecorder.isTypeSupported(m)) ?? '';
}

export function record(stream: MediaStream) {
  const mimeType = pickVideoMime();
  // pages mostly hold still between turns: 4 Mbps stays crisp and keeps a 40 s book near 20 MB
  const rec = new MediaRecorder(stream, { mimeType, videoBitsPerSecond: 4_000_000, audioBitsPerSecond: 128_000 });
  const chunks: Blob[] = [];
  rec.ondataavailable = (e) => e.data.size && chunks.push(e.data);
  const done = new Promise<Blob>((res) => {
    rec.onstop = () => res(new Blob(chunks, { type: (rec.mimeType || mimeType).split(';')[0] || 'video/webm' }));
  });
  rec.start(1000);
  return {
    mp4: (rec.mimeType || mimeType).startsWith('video/mp4'),
    stop: () => {
      if (rec.state !== 'inactive') rec.stop();
      return done;
    },
  };
}

export interface Segment {
  bitmap: CanvasImageSource & { width: number; height: number };
  /** Closed covers are drawn narrower than open spreads. */
  kind: 'cover' | 'spread';
}

/** Copy the part of the current frame under `rect` (CSS px of this window). */
export function grab(v: HTMLVideoElement, rect: DOMRect): HTMLCanvasElement {
  const sx = v.videoWidth / window.innerWidth;
  const sy = v.videoHeight / window.innerHeight;
  const c = document.createElement('canvas');
  c.width = Math.round(rect.width * sx);
  c.height = Math.round(rect.height * sy);
  c.getContext('2d')!.drawImage(v, rect.left * sx, rect.top * sy, rect.width * sx, rect.height * sy, 0, 0, c.width, c.height);
  return c;
}

/** Stack the pages into one tall picture: covers narrower and centred, spreads full width. */
export async function composeLongImage(segments: Segment[], opts: { background: string; ink: string; footer: string }): Promise<Blob> {
  let W = 1200;
  const pad = 56;
  const gap = 64;
  const width = (s: Segment) => (s.kind === 'cover' ? W * 0.5 : W - pad * 2);
  const heightOf = (s: Segment) => (width(s) / s.bitmap.width) * s.bitmap.height;
  const footerH = 150;
  let H = pad + segments.reduce((h, s) => h + heightOf(s) + gap, 0) - gap + footerH;
  // browsers refuse canvases taller than ~32k px
  const MAX = 30000;
  if (H > MAX) {
    const k = MAX / H;
    W = Math.floor(W * k);
    H = MAX;
  }
  const scale = W / 1200;
  const c = document.createElement('canvas');
  c.width = W;
  c.height = Math.ceil(H);
  const ctx = c.getContext('2d')!;
  ctx.fillStyle = opts.background;
  ctx.fillRect(0, 0, c.width, c.height);
  ctx.imageSmoothingQuality = 'high';
  let y = pad * scale;
  for (const s of segments) {
    const w = s.kind === 'cover' ? W * 0.5 : W - pad * 2 * scale;
    const h = (w / s.bitmap.width) * s.bitmap.height;
    ctx.drawImage(s.bitmap, (W - w) / 2, y, w, h);
    y += h + gap * scale;
  }
  ctx.fillStyle = opts.ink;
  ctx.globalAlpha = 0.7;
  ctx.textAlign = 'center';
  ctx.font = `${Math.round(22 * scale)}px "LXGW WenKai", "Kaiti SC", serif`;
  ctx.fillText(opts.footer, W / 2, c.height - 70 * scale);
  ctx.globalAlpha = 1;
  return new Promise<Blob>((res, rej) => c.toBlob((b) => (b ? res(b) : rej(new Error('encode'))), 'image/jpeg', 0.9));
}

export const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function until(test: () => boolean, timeout = 8000, step = 60) {
  const t0 = performance.now();
  while (!test()) {
    if (performance.now() - t0 > timeout) return false;
    await wait(step);
  }
  return true;
}
