/**
 * The book's music while reading: the theme's score or the author's songs (one per chapter),
 * cross-faded as the reader moves between chapters, faded out at the end, ducked under voice
 * notes, and muted from the toggle.
 *
 * Songs play through Web Audio (an <audio> element routed into a gain) so fades work on
 * iPhone, where `audio.volume` is read-only. An exported book opened from disk (file://)
 * cannot route its songs (the browser treats the file as another origin and outputs silence),
 * so there the element's own volume is faded instead.
 */
import { audio } from './engine';
import { startScore, type Score, type ScoreHandle } from './score';

export type TrackSpec = { kind: 'score'; score: Score } | { kind: 'file'; src: string; start?: number } | { kind: 'none' };

const FILE_LEVEL = 0.55;
const SCORE_LEVEL = 0.75;
const DUCKED = 0.16;

interface Track {
  spec: TrackSpec;
  /** Web Audio gain for this track (score or routed song). */
  gain?: GainNode;
  el?: HTMLAudioElement;
  /** The song is not routed: its element volume is faded by hand. */
  manual?: boolean;
  score?: ScoreHandle;
  level: number;
}

export class BookAudio {
  private tracks = new Map<string, Track>();
  private current: string;
  private started = false;
  private wanted = true;
  private ending = false;
  private ducked = false;
  private main?: GainNode;
  private duck?: GainNode;
  private listeners = new Set<() => void>();
  private voiceEl?: HTMLAudioElement;
  private voiceToken = 0;
  /** Manual-volume animation state for unrouted songs. */
  private manualTarget = new Map<HTMLAudioElement, number>();
  private raf = 0;
  playing = false;
  voicePlaying = false;

  constructor(tracks: Record<string, TrackSpec>, first: string) {
    for (const [key, spec] of Object.entries(tracks)) this.tracks.set(key, { spec, level: 0 });
    this.current = this.tracks.has(first) ? first : (Object.keys(tracks)[0] ?? '');
  }

  /** Something plays at all (any chapter has music). */
  get available() {
    return [...this.tracks.values()].some((t) => t.spec.kind !== 'none');
  }

  subscribe(fn: () => void) {
    this.listeners.add(fn);
    return () => void this.listeners.delete(fn);
  }

  private emit() {
    const playing = this.started && this.wanted && this.spec(this.current).kind !== 'none';
    if (playing !== this.playing) this.playing = playing;
    this.listeners.forEach((l) => l());
  }

  private spec(key: string): TrackSpec {
    return this.tracks.get(key)?.spec ?? { kind: 'none' };
  }

  /** Call from a user gesture (opening the gift or the book): unlocks audio and starts. */
  start() {
    if (this.started) return;
    this.started = true;
    const a = audio();
    if (a) {
      if (a.ctx.state !== 'running') void a.ctx.resume();
      this.main = a.ctx.createGain();
      this.duck = a.ctx.createGain();
      this.duck.connect(this.main).connect(a.music);
    }
    // every song is unlocked now, while there is a gesture (iPhone plays later ones only then)
    for (const [key, t] of this.tracks) {
      if (t.spec.kind !== 'file') continue;
      this.prepare(t);
      if (key !== this.current && t.el) {
        t.el
          .play()
          .then(() => t.el!.pause())
          .catch(() => undefined);
      }
    }
    this.unlockVoice();
    if (this.wanted) this.enter(this.current, 2.4);
    this.emit();
  }

  /** The reader moved to a part of the book that plays `key`. */
  setSection(key: string) {
    if (!this.tracks.has(key) || key === this.current) return;
    const prev = this.current;
    this.current = key;
    if (!this.started || !this.wanted) return this.emit();
    this.leave(prev, 1.6);
    this.enter(key, 1.6);
    this.emit();
  }

  /** At the end of the book the music fades away; turning back brings it back. */
  setEnding(on: boolean) {
    if (on === this.ending) return;
    this.ending = on;
    this.applyMain(on ? 4 : 1.5);
  }

  toggle() {
    this.wanted = !this.wanted;
    if (!this.started) {
      if (this.wanted) this.start();
      return this.emit();
    }
    if (this.wanted) this.enter(this.current, 0.9);
    else this.leave(this.current, 0.5);
    this.emit();
  }

  /* -------------------------------------------------------------- voice notes */

  /** Play a voice note over the music (ducked). Resolves when it ends or is stopped. */
  playVoice(src: string): Promise<void> {
    const el = this.voiceEl ?? (this.voiceEl = new Audio());
    const token = ++this.voiceToken;
    el.pause();
    el.src = src;
    el.currentTime = 0;
    this.setDuck(true);
    this.voicePlaying = true;
    this.emit();
    return new Promise<void>((resolve) => {
      const done = () => {
        el.removeEventListener('ended', done);
        el.removeEventListener('error', done);
        if (token === this.voiceToken) {
          this.voicePlaying = false;
          this.setDuck(false);
          this.emit();
        }
        resolve();
      };
      el.addEventListener('ended', done);
      el.addEventListener('error', done);
      el.play().catch(done);
      this.stopVoiceFn = () => {
        el.pause();
        done();
      };
    });
  }

  private stopVoiceFn?: () => void;

  stopVoice() {
    this.stopVoiceFn?.();
    this.stopVoiceFn = undefined;
  }

  private unlockVoice() {
    const el = this.voiceEl ?? (this.voiceEl = new Audio());
    el.src = SILENCE;
    el.play().catch(() => undefined);
  }

  dispose() {
    this.stopVoice();
    cancelAnimationFrame(this.raf);
    for (const t of this.tracks.values()) {
      t.score?.stop(200);
      t.score = undefined;
      if (t.el) {
        t.el.pause();
        t.el.removeAttribute('src');
        t.el.load();
      }
      t.gain?.disconnect();
    }
    this.main?.disconnect();
    this.listeners.clear();
  }

  /* -------------------------------------------------------------- internals */

  private prepare(t: Track) {
    if (t.spec.kind !== 'file' || t.el) return;
    const el = new Audio();
    el.loop = true;
    el.preload = 'auto';
    const start = t.spec.start ?? 0;
    if (start > 0) {
      const seek = () => {
        if (el.duration && start < el.duration - 1) el.currentTime = start;
      };
      el.addEventListener('loadedmetadata', seek, { once: true });
      // a looping song starts again at its chosen start, not at 0
      el.addEventListener('timeupdate', () => {
        if (el.duration && el.currentTime > el.duration - 0.35) el.currentTime = start;
      });
      el.loop = false;
      el.addEventListener('ended', () => {
        el.currentTime = start;
        void el.play().catch(() => undefined);
      });
    }
    el.src = t.spec.src;
    t.el = el;
    const a = audio();
    if (a && this.duck && canRoute(t.spec.src)) {
      try {
        const node = a.ctx.createMediaElementSource(el);
        t.gain = a.ctx.createGain();
        t.gain.gain.value = 0;
        node.connect(t.gain).connect(this.duck);
        return;
      } catch {
        /* fall through: manual volume */
      }
    }
    t.manual = true;
    el.volume = 0;
  }

  private enter(key: string, sec: number) {
    const t = this.tracks.get(key);
    if (!t) return;
    const s = t.spec;
    if (s.kind === 'none') return;
    if (s.kind === 'score') {
      const a = audio();
      if (!a || !this.duck) return;
      if (!t.score) {
        t.score = startScore(s.score, this.duck) ?? undefined;
        t.gain = t.score?.gain;
      }
      this.ramp(t, SCORE_LEVEL, sec);
      return;
    }
    this.prepare(t);
    const el = t.el!;
    void el.play().catch(() => undefined);
    this.ramp(t, FILE_LEVEL, sec);
  }

  private leave(key: string, sec: number) {
    const t = this.tracks.get(key);
    if (!t) return;
    if (t.spec.kind === 'score' && t.score) {
      t.score.stop(sec * 1000);
      t.score = undefined;
      t.gain = undefined;
      t.level = 0;
      return;
    }
    this.ramp(t, 0, sec, () => t.el?.pause());
  }

  private ramp(t: Track, level: number, sec: number, done?: () => void) {
    t.level = level;
    if (t.gain && !t.manual) {
      const a = audio()!;
      const g = t.gain.gain;
      const now = a.ctx.currentTime;
      g.cancelScheduledValues(now);
      g.setValueAtTime(g.value, now);
      g.linearRampToValueAtTime(level, now + sec);
      if (done) window.setTimeout(() => t.level === level && done(), sec * 1000 + 50);
      return;
    }
    if (t.el) this.manualTo(t.el, level, sec, done);
  }

  private setDuck(on: boolean) {
    if (on === this.ducked) return;
    this.ducked = on;
    const a = audio();
    if (a && this.duck) {
      const g = this.duck.gain;
      const now = a.ctx.currentTime;
      g.cancelScheduledValues(now);
      g.setValueAtTime(g.value, now);
      g.linearRampToValueAtTime(on ? DUCKED : 1, now + (on ? 0.4 : 1.2));
    }
    this.refreshManual(on ? 0.4 : 1.2);
  }

  private applyMain(sec: number) {
    const a = audio();
    if (a && this.main) {
      const g = this.main.gain;
      const now = a.ctx.currentTime;
      g.cancelScheduledValues(now);
      g.setValueAtTime(g.value, now);
      g.linearRampToValueAtTime(this.ending ? 0.0001 : 1, now + sec);
    }
    this.refreshManual(sec);
  }

  /** Unrouted songs: element volume = track level × duck × ending. */
  private factor() {
    return (this.ducked ? DUCKED : 1) * (this.ending ? 0 : 1);
  }

  private refreshManual(sec: number) {
    for (const t of this.tracks.values()) if (t.manual && t.el && !t.el.paused) this.manualTo(t.el, t.level, sec);
  }

  private manualTo(el: HTMLAudioElement, level: number, sec: number, done?: () => void) {
    const target = Math.max(0, Math.min(1, level * this.factor()));
    this.manualTarget.set(el, target);
    const from = el.volume;
    const t0 = performance.now();
    const step = (now: number) => {
      if (this.manualTarget.get(el) !== target) return; // superseded
      const k = Math.min(1, (now - t0) / (sec * 1000));
      el.volume = Math.max(0, Math.min(1, from + (target - from) * k));
      if (k < 1) requestAnimationFrame(step);
      else done?.();
    };
    this.raf = requestAnimationFrame(step);
  }
}

/** Songs from another origin (a book opened from disk) cannot be routed into Web Audio. */
function canRoute(src: string) {
  if (/^(blob|data):/.test(src)) return true;
  if (typeof location === 'undefined' || location.protocol === 'file:') return false;
  try {
    return new URL(src, location.href).origin === location.origin;
  } catch {
    return false;
  }
}

/** 0.05 s of silence (WAV), to unlock the voice player during a gesture. */
const SILENCE = (() => {
  const rate = 8000;
  const n = 400;
  const buf = new Uint8Array(44 + n);
  const v = new DataView(buf.buffer);
  const w = (o: number, s: string) => [...s].forEach((c, i) => v.setUint8(o + i, c.charCodeAt(0)));
  w(0, 'RIFF');
  v.setUint32(4, 36 + n, true);
  w(8, 'WAVE');
  w(12, 'fmt ');
  v.setUint32(16, 16, true);
  v.setUint16(20, 1, true);
  v.setUint16(22, 1, true);
  v.setUint32(24, rate, true);
  v.setUint32(28, rate, true);
  v.setUint16(32, 1, true);
  v.setUint16(34, 8, true);
  w(36, 'data');
  v.setUint32(40, n, true);
  buf.fill(128, 44);
  let s = '';
  buf.forEach((b) => (s += String.fromCharCode(b)));
  return 'data:audio/wav;base64,' + btoa(s);
})();
