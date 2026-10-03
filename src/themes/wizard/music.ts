import { celesta, harp, merge, phrase, play, struck, wind, type Chord, type Score } from '../../sound/score';

/** A celesta waltz in a draughty castle hall (3/4). */
const BEAT = 60 / 108;
const EM: string[] = ['E2', 'G3', 'B3', 'E4'];
const AM: string[] = ['A2', 'A3', 'C4', 'E4'];
const B7: string[] = ['B1', 'A3', 'D#4', 'F#4'];
const C: string[] = ['C3', 'G3', 'C4', 'E4'];
const FSHM7B5: string[] = ['F#2', 'A3', 'C4', 'E4'];
const BARS: Chord[] = [EM, EM, AM, AM, B7, B7, EM, EM, C, C, AM, AM, FSHM7B5, B7, EM, B7].map((c) => [c, 3] as Chord);
const OOM = struck(BARS, [0], 1, (n) => [n[0]]);
const PAH = struck(BARS, [1, 2], 0.8, (n) => n.slice(1));
const TUNE = phrase(
  'E5 G5 B5 | A5*2 G5 | E5 A5 C6 | B5*2 A5 | D#5 F#5 B5 | A5*2 F#5 | G5 F#5 E5 | B4*3 | C5 E5 G5 | C6*2 B5 | A5 G5 E5 | C5*3 | C5 D5 E5 | D#5 F#5 A5 | G5*2 F#5 | E5*2 r',
);
const LOOP = 48 * BEAT;

export const wizardMusic: Score = {
  loop: LOOP,
  level: 3.0,
  wet: 0.45,
  bed: wind(0.04, 420),
  bar: (k) => merge(play(OOM, BEAT, harp({ peak: 0.06 })), play(PAH, BEAT, harp({ peak: 0.025 })), k % 3 === 2 ? [] : play(TUNE, BEAT, celesta({ peak: 0.045 }))),
};
