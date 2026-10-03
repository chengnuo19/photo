/**
 * Theme music, synthesised: each theme has a *score* — a loop of notes (instrument recipes at
 * times within the loop) over an ambience bed (rain, fire, cicadas…). No audio files, so it
 * costs nothing to download, and the same score renders offline into the video.
 *
 * Live, a small look-ahead scheduler queues the next few seconds of notes every 250 ms.
 */
import { audio, bell, makeNoise, noiseBurst, pluck, tone, type Recipe, type Voice } from './engine';

export interface Note {
  /** Seconds from the start of the loop. */
  at: number;
  r: Recipe;
}

export interface Bed {
  stop(at: number): void;
}

export interface Score {
  /** Length of one loop in seconds. */
  loop: number;
  /** The notes of loop number `k` (sorted by time); loops may vary. */
  bar: (k: number) => Note[];
  /** Continuous ambience under the music (started once). */
  bed?: (v: Voice) => Bed;
  /** Overall level (default 1); themes aim at about −24 dBFS (scripts/sound-check.mjs). */
  level?: number;
  /** Reverb send, 0..1 (default 0.3). */
  wet?: number;
}

export interface ScoreHandle {
  /** The score's own gain (for fades and cross-fades), already connected to the destination. */
  gain: GainNode;
  stop(fadeMs?: number): void;
}

const LOOK_AHEAD = 3.5;

/* ------------------------------------------------------------------ playing */

/** Play a score live into `dest` (the music bus). Starts silent: fade `gain` in. */
export function startScore(score: Score, dest?: AudioNode): ScoreHandle | null {
  const a = audio();
  if (!a) return null;
  const { ctx, noise } = a;
  const { gain, input, bedOut } = chain(ctx, score, dest ?? a.music);
  gain.gain.value = 0.0001;

  const t0 = ctx.currentTime + 0.15;
  const longNoise = bedNoise(ctx);
  const bed = score.bed?.({ ctx, noise: longNoise, out: bedOut, t: t0 });
  let k = 0;
  let i = 0;
  let notes = score.bar(0);
  const tick = () => {
    const now = ctx.currentTime;
    const horizon = now + LOOK_AHEAD;
    for (;;) {
      if (i >= notes.length) {
        k++;
        i = 0;
        notes = score.bar(k);
        if (t0 + k * score.loop > horizon) break;
        continue;
      }
      const t = t0 + k * score.loop + notes[i].at;
      if (t > horizon) break;
      if (t >= now) notes[i].r({ ctx, noise, out: input, t });
      i++;
    }
  };
  tick();
  const timer = window.setInterval(tick, 250);
  let stopped = false;
  return {
    gain,
    stop(fadeMs = 600) {
      if (stopped) return;
      stopped = true;
      window.clearInterval(timer);
      const end = ctx.currentTime + fadeMs / 1000;
      gain.gain.cancelScheduledValues(ctx.currentTime);
      gain.gain.setValueAtTime(Math.max(0.0001, gain.gain.value), ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, end);
      bed?.stop(end + 0.05);
      window.setTimeout(() => gain.disconnect(), fadeMs + 400);
    },
  };
}

/**
 * Schedule a score into an offline context (the video): notes from `from` to `until`
 * (context seconds), score time 0 at `from`. Returns the score's gain for automation.
 */
export function renderScore(oc: BaseAudioContext, score: Score, dest: AudioNode, from: number, until: number): GainNode {
  const { gain, input, bedOut } = chain(oc, score, dest);
  const noise = makeNoise(oc);
  const c = oc as unknown as AudioContext;
  const bed = score.bed?.({ ctx: c, noise: bedNoise(oc), out: bedOut, t: from });
  bed?.stop(until);
  for (let k = 0; from + k * score.loop < until; k++) {
    for (const n of score.bar(k)) {
      const t = from + k * score.loop + n.at;
      if (t < until) n.r({ ctx: c, noise, out: input, t });
    }
  }
  return gain;
}

/** input → (dry + reverb) → level → limiter → gain → dest; the bed skips the reverb. */
function chain(c: BaseAudioContext, score: Score, dest: AudioNode) {
  const gain = c.createGain();
  gain.connect(dest);
  const limiter = c.createDynamicsCompressor();
  limiter.threshold.value = -10;
  limiter.knee.value = 6;
  limiter.ratio.value = 8;
  limiter.attack.value = 0.004;
  limiter.release.value = 0.25;
  limiter.connect(gain);
  const level = c.createGain();
  level.gain.value = score.level ?? 1;
  level.connect(limiter);
  const input = c.createGain();
  input.connect(level);
  const wet = score.wet ?? 0.3;
  if (wet > 0) {
    const verb = c.createConvolver();
    verb.buffer = impulse(c);
    const send = c.createGain();
    send.gain.value = wet;
    input.connect(send).connect(verb).connect(level);
  }
  const bedOut = c.createGain();
  bedOut.connect(level);
  return { gain, input, bedOut };
}

const impulses = new WeakMap<BaseAudioContext, AudioBuffer>();
/** A soft hall: decaying stereo noise. */
function impulse(c: BaseAudioContext) {
  let b = impulses.get(c);
  if (b) return b;
  const len = Math.floor(c.sampleRate * 2.8);
  b = c.createBuffer(2, len, c.sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const d = b.getChannelData(ch);
    for (let i = 0; i < len; i++) {
      const k = i / len;
      d[i] = (Math.random() * 2 - 1) * Math.pow(1 - k, 3.2) * (i < c.sampleRate * 0.012 ? i / (c.sampleRate * 0.012) : 1);
    }
  }
  impulses.set(c, b);
  return b;
}

const beds = new WeakMap<BaseAudioContext, AudioBuffer>();
/** Longer noise for beds, so the loop point is not heard. */
function bedNoise(c: BaseAudioContext) {
  let b = beds.get(c);
  if (!b) beds.set(c, (b = makeNoise(c, 7.3)));
  return b;
}

/* ------------------------------------------------------------------ notation */

const NAMES: Record<string, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };

/** 'C4', 'F#3', 'Bb5' → Hz. */
export function hz(name: string): number {
  const m = /^([A-G])([#b]?)(-?\d)$/.exec(name);
  if (!m) throw new Error(`bad note ${name}`);
  const semi = NAMES[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0) + (Number(m[3]) + 1) * 12;
  return 440 * Math.pow(2, (semi - 69) / 12);
}

export interface Step {
  beat: number;
  note: string;
  len: number;
}

/**
 * A phrase in beats: "E5 D5/2 C5/2 r G4*2" — `/2` half a beat, `*2` two beats, `r` rest,
 * several notes at once with '+' ("C4+E4+G4").
 */
export function phrase(src: string, start = 0): Step[] {
  const out: Step[] = [];
  let beat = start;
  for (const tok of src.trim().split(/\s+/)) {
    if (tok === '|') continue;
    const m = /^([^*/]+)(?:([*/])([\d.]+))?$/.exec(tok);
    if (!m) continue;
    const len = m[2] === '*' ? Number(m[3]) : m[2] === '/' ? 1 / Number(m[3]) : 1;
    if (m[1] !== 'r') for (const n of m[1].split('+')) out.push({ beat, note: n, len });
    beat += len;
  }
  return out;
}

/** A chord held for some beats: its notes low to high. */
export type Chord = [notes: string[], beats: number];

/** Broken chords: at every `step` beats play note `idx[j]` of the chord (-1 = rest). */
export function broken(chords: Chord[], idx: number[], step: number, start = 0): Step[] {
  const out: Step[] = [];
  let beat = start;
  for (const [notes, beats] of chords) {
    const n = Math.round(beats / step);
    for (let j = 0; j < n; j++) {
      const k = idx[j % idx.length];
      if (k >= 0 && notes[k]) out.push({ beat: beat + j * step, note: notes[k], len: step });
    }
    beat += beats;
  }
  return out;
}

/** Chords struck together at the given beats within each chord (several notes at once). */
export function struck(chords: Chord[], hits: number[], len: number, pick?: (notes: string[]) => string[], start = 0): Step[] {
  const out: Step[] = [];
  let beat = start;
  for (const [notes, beats] of chords) {
    for (const h of hits) if (h < beats) for (const n of pick ? pick(notes) : notes) out.push({ beat: beat + h, note: n, len });
    beat += beats;
  }
  return out;
}

/** Turn steps into notes with an instrument; `beat` = seconds per beat. */
export function play(steps: Step[], beat: number, inst: (f: number, len: number) => Recipe): Note[] {
  return steps.map((s) => ({ at: s.beat * beat, r: inst(hz(s.note), s.len * beat) }));
}

/** Notes of several voices, merged in time order. */
export function merge(...parts: Note[][]): Note[] {
  return parts.flat().sort((a, b) => a.at - b.at);
}

/** Small deterministic random numbers (loops vary, but the same way every time). */
export function rng(seed: number) {
  let a = seed >>> 0 || 1;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** A little human timing. */
export const humanize = (notes: Note[], r: () => number, amount = 0.012) => notes.map((n) => ({ ...n, at: Math.max(0, n.at + (r() - 0.5) * amount * 2) }));

/* ------------------------------------------------------------------ instruments */

type Inst = (o: { peak?: number }) => (f: number, len: number) => Recipe;

/** Soft felt piano. */
export const piano: Inst =
  ({ peak = 0.07 }) =>
  (f) =>
  (v) => {
    const d = 2.6 * Math.min(1.6, Math.max(0.6, 300 / f));
    tone(v, { f, type: 'triangle', e: { a: 0.004, d, peak }, lp: Math.min(4200, f * 5) });
    tone(v, { f: f * 2, type: 'sine', e: { a: 0.003, d: d * 0.45, peak: peak * 0.22 } });
    tone(v, { f: f * 3.01, type: 'sine', e: { a: 0.002, d: d * 0.2, peak: peak * 0.08 } });
  };

/** Music box: bright, harmonic-ish tines. */
export const musicBox: Inst =
  ({ peak = 0.05 }) =>
  (f) =>
  (v) =>
    bell(v, { f, peak, d: 2.4, partials: [1, 3.0, 5.98, 8.1] });

/** Glockenspiel / celesta. */
export const celesta: Inst =
  ({ peak = 0.045 }) =>
  (f) =>
  (v) =>
    bell(v, { f, peak, d: 1.8, partials: [1, 2.0, 4.0, 5.3] });

/** Harp / guitar: a plucked string. */
export const harp: Inst =
  ({ peak = 0.07 }) =>
  (f) =>
  (v) =>
    pluck(v, { f, peak, d: Math.min(2.4, 1.4 * Math.max(0.6, 260 / f)) });

/** Cello pizzicato: short, low, woody. */
export const pizz: Inst =
  ({ peak = 0.12 }) =>
  (f) =>
  (v) => {
    pluck(v, { f, peak, d: 0.7 });
    tone(v, { f, type: 'sine', e: { a: 0.003, d: 0.5, peak: peak * 0.6 } });
  };

/** Round sine bass. */
export const bass: Inst =
  ({ peak = 0.09 }) =>
  (f, len) =>
  (v) =>
    tone(v, { f, type: 'triangle', lp: 420, e: { a: 0.01, d: Math.max(0.4, len * 0.9), peak } });

/** 8-bit square lead. */
export const chip: Inst =
  ({ peak = 0.025 }) =>
  (f, len) =>
  (v) =>
    tone(v, { f, type: 'square', lp: 3200, e: { a: 0.004, hold: Math.max(0, len * 0.55), d: 0.09, peak } });

/** 8-bit triangle bass. */
export const chipBass: Inst =
  ({ peak = 0.08 }) =>
  (f, len) =>
  (v) =>
    tone(v, { f, type: 'triangle', e: { a: 0.004, hold: Math.max(0, len * 0.6), d: 0.06, peak } });

/** 80s synth: two detuned saws through a closing filter. */
export const synth: Inst =
  ({ peak = 0.035 }) =>
  (f, len) =>
  (v) => {
    for (const det of [-7, 7]) {
      const osc = v.ctx.createOscillator();
      osc.type = 'sawtooth';
      osc.frequency.value = f;
      osc.detune.value = det;
      const lp = v.ctx.createBiquadFilter();
      lp.type = 'lowpass';
      lp.Q.value = 4;
      lp.frequency.setValueAtTime(f * 7, v.t);
      lp.frequency.exponentialRampToValueAtTime(f * 1.5, v.t + Math.max(0.12, len));
      const g = v.ctx.createGain();
      g.gain.setValueAtTime(0.0001, v.t);
      g.gain.exponentialRampToValueAtTime(peak, v.t + 0.006);
      g.gain.exponentialRampToValueAtTime(0.0001, v.t + Math.max(0.16, len * 1.4));
      osc.connect(lp).connect(g).connect(v.out);
      osc.start(v.t);
      osc.stop(v.t + Math.max(0.16, len * 1.4) + 0.05);
    }
  };

/** Slow pad chord tone: detuned saws, dark filter, long attack and release. */
export const pad: Inst =
  ({ peak = 0.018 }) =>
  (f, len) =>
  (v) => {
    const att = Math.min(2.5, len * 0.4);
    const rel = Math.min(3, len * 0.5);
    for (const det of [-9, 0, 8]) {
      const osc = v.ctx.createOscillator();
      osc.type = 'sawtooth';
      osc.frequency.value = f;
      osc.detune.value = det;
      const lp = v.ctx.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.value = Math.min(1400, f * 3);
      const g = v.ctx.createGain();
      g.gain.setValueAtTime(0, v.t);
      g.gain.linearRampToValueAtTime(peak, v.t + att);
      g.gain.setValueAtTime(peak, v.t + Math.max(att, len - 0.05));
      g.gain.linearRampToValueAtTime(0, v.t + len + rel);
      osc.connect(lp).connect(g).connect(v.out);
      osc.start(v.t);
      osc.stop(v.t + len + rel + 0.05);
    }
  };

/* ------------------------------------------------------------------ ambience */

function loopNoise(v: Voice, rate = 1) {
  const src = v.ctx.createBufferSource();
  src.buffer = v.noise;
  src.loop = true;
  src.playbackRate.value = rate;
  src.start(v.t, Math.random() * 3);
  return src;
}

function filter(v: Voice, type: BiquadFilterType, f: number, q = 0.7) {
  const n = v.ctx.createBiquadFilter();
  n.type = type;
  n.frequency.value = f;
  n.Q.value = q;
  return n;
}

/** Slow wobble on a parameter: value ± depth at `hz`. */
function lfo(v: Voice, param: AudioParam, hz: number, depth: number) {
  const o = v.ctx.createOscillator();
  o.frequency.value = hz;
  const g = v.ctx.createGain();
  g.gain.value = depth;
  o.connect(g).connect(param);
  o.start(v.t);
  return o;
}

function fadeIn(v: Voice, level: number, sec = 3) {
  const g = v.ctx.createGain();
  g.gain.setValueAtTime(0.0001, v.t);
  g.gain.linearRampToValueAtTime(level, v.t + sec);
  g.connect(v.out);
  return g;
}

const stopAll =
  (...nodes: AudioScheduledSourceNode[]): Bed['stop'] =>
  (at) =>
    nodes.forEach((n) => {
      try {
        n.stop(at);
      } catch {
        /* already stopped */
      }
    });

/** Several beds at once. */
export const layer =
  (...bs: ((v: Voice) => Bed)[]) =>
  (v: Voice): Bed => {
    const all = bs.map((b) => b(v));
    return { stop: (at) => all.forEach((b) => b.stop(at)) };
  };

/** Rain: a soft body plus the hiss of drops, breathing slowly. */
export const rain =
  (level = 0.05) =>
  (v: Voice): Bed => {
    const out = fadeIn(v, level);
    const a = loopNoise(v, 1.1);
    const body = filter(v, 'lowpass', 1100);
    a.connect(body).connect(out);
    const b = loopNoise(v, 1.7);
    const hiss = filter(v, 'highpass', 2600);
    const hg = v.ctx.createGain();
    hg.gain.value = 0.6;
    b.connect(hiss).connect(hg).connect(out);
    const l = lfo(v, hg.gain, 0.09, 0.18);
    return { stop: stopAll(a, b, l) };
  };

/** Wind: band-passed noise whose pitch and level drift. */
export const wind =
  (level = 0.05, center = 520) =>
  (v: Voice): Bed => {
    const out = fadeIn(v, level, 4);
    const a = loopNoise(v, 0.8);
    const bp = filter(v, 'bandpass', center, 0.9);
    const g = v.ctx.createGain();
    g.gain.value = 0.7;
    a.connect(bp).connect(g).connect(out);
    const l1 = lfo(v, bp.frequency, 0.06, center * 0.45);
    const l2 = lfo(v, g.gain, 0.045, 0.3);
    return { stop: stopAll(a, l1, l2) };
  };

/** Hearth: a low rumble (the crackles are notes, see `crackles`). */
export const hearth =
  (level = 0.05) =>
  (v: Voice): Bed => {
    const out = fadeIn(v, level);
    const a = loopNoise(v, 0.6);
    a.connect(filter(v, 'lowpass', 260)).connect(out);
    return { stop: stopAll(a) };
  };

/** Cicadas: high band noise, buzzing (fast tremolo) and swelling. */
export const cicadas =
  (level = 0.012) =>
  (v: Voice): Bed => {
    const out = fadeIn(v, level, 5);
    const a = loopNoise(v, 1.9);
    const bp = filter(v, 'bandpass', 5200, 5);
    const buzz = v.ctx.createGain();
    buzz.gain.value = 0.55;
    const swell = v.ctx.createGain();
    swell.gain.value = 0.6;
    a.connect(bp).connect(buzz).connect(swell).connect(out);
    const l1 = lfo(v, buzz.gain, 41, 0.45);
    const l2 = lfo(v, swell.gain, 0.07, 0.4);
    return { stop: stopAll(a, l1, l2) };
  };

/** Tape / vinyl hiss. */
export const hiss =
  (level = 0.006) =>
  (v: Voice): Bed => {
    const out = fadeIn(v, level, 1.5);
    const a = loopNoise(v, 2);
    a.connect(filter(v, 'highpass', 3800)).connect(out);
    return { stop: stopAll(a) };
  };

/** Film projector: a whirring motor and the 24 fps shutter flutter. */
export const projector =
  (level = 0.02) =>
  (v: Voice): Bed => {
    const out = fadeIn(v, level, 2);
    const a = loopNoise(v, 1.3);
    const bp = filter(v, 'bandpass', 1800, 1.2);
    const flutter = v.ctx.createGain();
    flutter.gain.value = 0.5;
    a.connect(bp).connect(flutter).connect(out);
    const l = lfo(v, flutter.gain, 24, 0.4);
    const hum = v.ctx.createOscillator();
    hum.frequency.value = 118;
    const hg = v.ctx.createGain();
    hg.gain.value = 0.15;
    hum.connect(hg).connect(out);
    hum.start(v.t);
    return { stop: stopAll(a, l, hum) };
  };

/** A quiet large room. */
export const room =
  (level = 0.03) =>
  (v: Voice): Bed => {
    const out = fadeIn(v, level, 3);
    const a = loopNoise(v, 0.5);
    a.connect(filter(v, 'lowpass', 340)).connect(out);
    return { stop: stopAll(a) };
  };

/* occasional sounds, scattered through a loop (as notes) */

/** Fire crackles. */
export function crackles(loop: number, count: number, r: () => number, peak = 0.05): Note[] {
  return Array.from({ length: count }, () => ({
    at: r() * loop,
    r: ((v) => noiseBurst(v, { f: 2500 + r() * 3000, q: 2, type: 'bandpass', e: { a: 0.001, d: 0.03 + r() * 0.05, peak: peak * (0.4 + r()) } })) as Recipe,
  })).sort((a, b) => a.at - b.at);
}

/** Wind chimes: a few high glass bells. */
export function chimes(loop: number, count: number, r: () => number, peak = 0.018): Note[] {
  const scale = [2093, 2349, 2637, 3136, 3520];
  return Array.from({ length: count }, () => ({
    at: r() * loop,
    r: ((v) => bell(v, { f: scale[Math.floor(r() * scale.length)], peak, d: 2.6, partials: [1, 2.4, 4.1] })) as Recipe,
  })).sort((a, b) => a.at - b.at);
}

/** Birds: quick rising chirps in twos and threes. */
export function birds(loop: number, count: number, r: () => number, peak = 0.012): Note[] {
  const out: Note[] = [];
  for (let i = 0; i < count; i++) {
    const at = r() * loop;
    const f = 2600 + r() * 1800;
    const n = 2 + Math.floor(r() * 3);
    for (let j = 0; j < n; j++)
      out.push({ at: at + j * (0.09 + r() * 0.05), r: ((v) => tone(v, { f, f2: f * (1.3 + r() * 0.4), e: { a: 0.005, d: 0.06, peak } })) as Recipe });
  }
  return out.sort((a, b) => a.at - b.at);
}

/** Crickets at night: pulsed high chirps. */
export function crickets(loop: number, count: number, r: () => number, peak = 0.006): Note[] {
  const out: Note[] = [];
  for (let i = 0; i < count; i++) {
    const at = r() * loop;
    const f = 4300 + r() * 500;
    for (let j = 0; j < 3; j++) out.push({ at: at + j * 0.055, r: ((v) => tone(v, { f, e: { a: 0.004, d: 0.035, peak } })) as Recipe });
  }
  return out.sort((a, b) => a.at - b.at);
}

/** Distant thunder. */
export function thunder(at: number, peak = 0.12): Note {
  const r: Recipe = (v) => {
    const src = v.ctx.createBufferSource();
    src.buffer = v.noise;
    src.loop = true;
    src.playbackRate.value = 0.5;
    const lp = filter(v, 'lowpass', 170, 0.5);
    lp.frequency.setValueAtTime(170, v.t);
    lp.frequency.exponentialRampToValueAtTime(70, v.t + 4.2);
    const g = v.ctx.createGain();
    g.gain.setValueAtTime(0.0001, v.t);
    g.gain.exponentialRampToValueAtTime(peak, v.t + 0.4);
    g.gain.setValueAtTime(peak, v.t + 1);
    g.gain.exponentialRampToValueAtTime(0.0001, v.t + 4.2);
    src.connect(lp).connect(g).connect(v.out);
    src.start(v.t);
    src.stop(v.t + 4.3);
  };
  return { at, r };
}
