import { broken, chimes, cicadas, humanize, layer, merge, phrase, piano, play, rng, wind, type Chord, type Score } from '../../sound/score';

/** A summer afternoon: cicadas, a wind chime, and a warm pentatonic piano. */
const BEAT = 60 / 80;
const BMAJ7 = ['Bb2', 'F3', 'D4', 'A4'];
const AM7 = ['A2', 'E3', 'C4', 'G4'];
const GM7 = ['G2', 'D3', 'Bb3', 'F4'];
const C7 = ['C3', 'G3', 'E4', 'Bb4'];
const FMAJ7 = ['F2', 'C3', 'A3', 'E4'];
const D7 = ['D3', 'A3', 'F#4', 'C5'];
const BARS: Chord[] = [
  [BMAJ7, 4],
  [AM7, 4],
  [GM7, 2],
  [C7, 2],
  [FMAJ7, 4],
  [BMAJ7, 4],
  [AM7, 2],
  [D7, 2],
  [GM7, 2],
  [C7, 2],
  [FMAJ7, 4],
];
const LEFT = broken(BARS, [0, 1, 2, 3, 2, 1, 2, 1], 0.5);
const TUNE = phrase('D5*1.5 C5/2 D5 F5 | E5*2 C5 A4 | D5*1.5 C5/2 Bb4 C5 | A4*4 | D5*1.5 C5/2 D5 G5 | A5*2 F#5 E5 | D5*1.5 E5/2 F5 G5 | F5*4');
const LOOP = 32 * BEAT;

export const ghibliMusic: Score = {
  loop: LOOP,
  level: 3.1,
  wet: 0.32,
  bed: layer(cicadas(0.011), wind(0.015, 600)),
  bar: (k) => {
    const r = rng(k + 29);
    return merge(
      humanize(play(LEFT, BEAT, piano({ peak: 0.03 })), r),
      k % 2 ? [] : humanize(play(TUNE, BEAT, piano({ peak: 0.06 })), r),
      chimes(LOOP, 3, r),
    );
  },
};
