/**
 * Render a soundtrack without playing it (for the drawn video): the book's music — songs and
 * theme scores, one segment per chapter, cross-faded — under the page sounds, with voice notes
 * on top (the music ducks while someone speaks).
 */
import { makeNoise, type Cue } from './engine';
import { renderScore, type Score } from './score';

export interface MusicSegment {
  /** A song's bytes, or a theme score. */
  data?: ArrayBuffer;
  score?: Score;
  /** Film seconds. The segment fades in from `at` and out after `until`. */
  at: number;
  until: number;
  /** Seconds into the song to begin (and to loop back to). */
  offset?: number;
  volume: number;
  fadeIn: number;
  fadeOut: number;
}

export interface VoiceCue {
  data: ArrayBuffer;
  at: number;
}

export async function renderSoundtrack(opts: {
  seconds: number;
  cues: Cue[];
  music?: MusicSegment[];
  voices?: VoiceCue[];
  sampleRate?: number;
}): Promise<AudioBuffer> {
  const rate = opts.sampleRate ?? 48000;
  const end = opts.seconds;
  const oc = new OfflineAudioContext(2, Math.ceil(end * rate), rate);
  const master = oc.createGain();
  master.gain.value = 0.9;
  master.connect(oc.destination);
  const musicBus = oc.createGain();
  musicBus.gain.value = 1;
  musicBus.connect(oc.destination);

  for (const m of opts.music ?? []) {
    const stop = Math.min(end, m.until + m.fadeOut);
    if (stop <= m.at) continue;
    let g: GainNode;
    if (m.score) {
      g = renderScore(oc, m.score, musicBus, m.at, stop);
    } else if (m.data) {
      try {
        const buf = await oc.decodeAudioData(m.data.slice(0));
        const src = oc.createBufferSource();
        src.buffer = buf;
        src.loop = true;
        const offset = Math.min(m.offset ?? 0, Math.max(0, buf.duration - 1));
        src.loopStart = offset;
        src.loopEnd = buf.duration;
        g = oc.createGain();
        src.connect(g).connect(musicBus);
        src.start(m.at, offset);
        src.stop(stop + 0.05);
      } catch {
        continue; // a song the browser cannot decode: page sounds only
      }
    } else continue;
    const p = g.gain;
    p.setValueAtTime(0.0001, m.at);
    p.linearRampToValueAtTime(m.volume, Math.min(stop, m.at + m.fadeIn));
    if (m.until > m.at + m.fadeIn) p.setValueAtTime(m.volume, m.until);
    p.linearRampToValueAtTime(0.0001, stop);
  }

  const n = makeNoise(oc);
  // the recipes only use node factories, which an offline context has too
  for (const c of opts.cues) c.recipe({ ctx: oc as unknown as AudioContext, noise: n, out: master, t: Math.max(0.001, c.at) });

  for (const v of opts.voices ?? []) {
    try {
      const buf = await oc.decodeAudioData(v.data.slice(0));
      const src = oc.createBufferSource();
      src.buffer = buf;
      src.connect(oc.destination);
      src.start(v.at);
      // duck the music while the voice speaks
      const d = musicBus.gain;
      d.setValueAtTime(1, Math.max(0, v.at - 0.4));
      d.linearRampToValueAtTime(0.16, v.at);
      d.setValueAtTime(0.16, v.at + buf.duration);
      d.linearRampToValueAtTime(1, v.at + buf.duration + 1.2);
    } catch {
      /* a voice note the browser cannot decode */
    }
  }
  return oc.startRendering();
}
