/**
 * Tiny synthesiser for the book's sounds: every sound is a recipe of noise bursts,
 * oscillators and envelopes, so themes get their own voice without shipping audio files.
 *
 * One shared AudioContext, created on the first user gesture (browsers require it).
 */

export interface Voice {
  ctx: AudioContext;
  /** Brown-ish noise, ~1 s — the raw material for paper, tape, wind and rain. */
  noise: AudioBuffer;
  /** Master output (already routed to the speakers). */
  out: AudioNode;
  /** Start time for this sound. */
  t: number;
}

export type Recipe = (v: Voice) => void;

let ctx: AudioContext | null = null;
let noise: AudioBuffer | null = null;
let out: GainNode | null = null;
let listening = false;

function create() {
  if (ctx) return ctx;
  const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctx) return null;
  ctx = new Ctx();
  const len = Math.floor(ctx.sampleRate * 1.2);
  noise = ctx.createBuffer(1, len, ctx.sampleRate);
  const data = noise.getChannelData(0);
  let last = 0;
  for (let i = 0; i < len; i++) {
    const white = Math.random() * 2 - 1;
    last = (last + 0.06 * white) / 1.06;
    data[i] = last * 3.2 + white * 0.18;
  }
  out = ctx.createGain();
  out.gain.value = 0.9;
  out.connect(ctx.destination);
  return ctx;
}

/** Call once from any component that makes sound; the context unlocks on the next gesture. */
export function armAudio() {
  if (listening || typeof window === 'undefined') return;
  listening = true;
  const unlock = () => void create()?.resume();
  window.addEventListener('pointerdown', unlock, { passive: true });
  window.addEventListener('pointerup', unlock, { passive: true });
  window.addEventListener('keydown', unlock);
}

export function play(recipe: Recipe | undefined) {
  if (!recipe) return;
  const c = create();
  if (!c || !noise || !out) return;
  if (c.state !== 'running') {
    // a click handler counts as a gesture: resume and play right after
    void c.resume().then(() => c.state === 'running' && recipe({ ctx: c, noise: noise!, out: out!, t: c.currentTime + 0.01 }));
    return;
  }
  recipe({ ctx: c, noise, out, t: c.currentTime + 0.005 });
}

/* ------------------------------------------------------------------ building blocks */

type Env = { a?: number; d: number; peak: number; hold?: number };

function env(v: Voice, g: GainNode, { a = 0.005, d, peak, hold = 0 }: Env, at = v.t) {
  g.gain.setValueAtTime(0.0001, at);
  g.gain.exponentialRampToValueAtTime(peak, at + a);
  if (hold) g.gain.setValueAtTime(peak, at + a + hold);
  g.gain.exponentialRampToValueAtTime(0.0001, at + a + hold + d);
  return at + a + hold + d;
}

/** Filtered noise burst. `sweep` moves the filter from f to f2 over the sound. */
export function noiseBurst(
  v: Voice,
  o: { f: number; f2?: number; q?: number; type?: BiquadFilterType; e: Env; rate?: number; at?: number },
) {
  const at = o.at ?? v.t;
  const src = v.ctx.createBufferSource();
  src.buffer = v.noise;
  src.playbackRate.value = o.rate ?? 0.9 + Math.random() * 0.2;
  const f = v.ctx.createBiquadFilter();
  f.type = o.type ?? 'bandpass';
  f.Q.value = o.q ?? 0.8;
  f.frequency.setValueAtTime(o.f, at);
  const g = v.ctx.createGain();
  const end = env(v, g, o.e, at);
  if (o.f2) f.frequency.exponentialRampToValueAtTime(o.f2, end);
  src.connect(f).connect(g).connect(v.out);
  src.start(at, Math.random() * 0.2, end - at + 0.02);
}

/** A single oscillator note with an envelope; `glide` bends the pitch to f2. */
export function tone(
  v: Voice,
  o: { f: number; f2?: number; type?: OscillatorType; e: Env; at?: number; detune?: number; lp?: number },
) {
  const at = o.at ?? v.t;
  const osc = v.ctx.createOscillator();
  osc.type = o.type ?? 'sine';
  osc.frequency.setValueAtTime(o.f, at);
  if (o.detune) osc.detune.value = o.detune;
  const g = v.ctx.createGain();
  const end = env(v, g, o.e, at);
  if (o.f2) osc.frequency.exponentialRampToValueAtTime(o.f2, end);
  let node: AudioNode = osc;
  if (o.lp) {
    const f = v.ctx.createBiquadFilter();
    f.type = 'lowpass';
    f.frequency.value = o.lp;
    node = node.connect(f);
  }
  node.connect(g).connect(v.out);
  osc.start(at);
  osc.stop(end + 0.05);
}

/** Bell / chime: a few inharmonic partials decaying at different speeds. */
export function bell(v: Voice, o: { f: number; at?: number; peak?: number; d?: number; partials?: number[] }) {
  const ps = o.partials ?? [1, 2.76, 5.4, 8.93];
  ps.forEach((p, i) =>
    tone(v, { f: o.f * p, at: o.at, e: { a: 0.002, d: (o.d ?? 1.6) / (1 + i * 0.8), peak: (o.peak ?? 0.08) / (1 + i * 1.4) } }),
  );
}

/** Plucked string (Karplus-ish via a quickly closing low-pass on a saw). */
export function pluck(v: Voice, o: { f: number; at?: number; peak?: number; d?: number }) {
  const at = o.at ?? v.t;
  const osc = v.ctx.createOscillator();
  osc.type = 'sawtooth';
  osc.frequency.value = o.f;
  const f = v.ctx.createBiquadFilter();
  f.type = 'lowpass';
  f.frequency.setValueAtTime(o.f * 8, at);
  f.frequency.exponentialRampToValueAtTime(o.f * 1.2, at + (o.d ?? 1.2) * 0.6);
  const g = v.ctx.createGain();
  const end = env(v, g, { a: 0.004, d: o.d ?? 1.2, peak: o.peak ?? 0.12 }, at);
  osc.connect(f).connect(g).connect(v.out);
  osc.start(at);
  osc.stop(end + 0.05);
}

/* ------------------------------------------------------------------ shared recipes */

/** The original paper rustle. */
export const paper: (kind: 'page' | 'board') => Recipe = (kind) => (v) =>
  noiseBurst(v, {
    f: kind === 'board' ? 900 : 2600,
    f2: kind === 'board' ? 380 : 900,
    q: 0.7,
    e: { a: 0.05, d: kind === 'board' ? 0.45 : 0.57, peak: kind === 'board' ? 0.22 : 0.16 },
  });

/** Combine recipes into one. */
export const both =
  (...rs: Recipe[]): Recipe =>
  (v) =>
    rs.forEach((r) => r(v));

/** Delay a recipe. */
export const after =
  (sec: number, r: Recipe): Recipe =>
  (v) =>
    r({ ...v, t: v.t + sec });
