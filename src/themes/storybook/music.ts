import { broken, crackles, hearth, merge, musicBox, phrase, play, rng, type Chord, type Score } from '../../sound/score';

/** A music-box lullaby by the fire (3/4). */
const BEAT = 60 / 66;
const BARS: Chord[] = [
  [['C4', 'E5', 'G5'], 3],
  [['A3', 'C5', 'E5'], 3],
  [['F3', 'A4', 'C5'], 3],
  [['G3', 'B4', 'D5'], 3],
  [['C4', 'E5', 'G5'], 3],
  [['A3', 'C5', 'E5'], 3],
  [['D4', 'F4', 'A4'], 3],
  [['C4', 'E4', 'G4'], 3],
];
const A = phrase('E5*2 G5 | A5 G5 E5 | F5*2 A5 | G5*3 | E5*2 G5 | C6 B5 A5 | G5 F5 D5 | C5*3');
const B = phrase('G5*2 E5 | C6*2 A5 | A5 G5 F5 | D5*3 | E5 G5 C6 | A5*2 E5 | F5 E5 D5 | C5*3');
const LOOP = 24 * BEAT;

export const storybookMusic: Score = {
  loop: LOOP,
  level: 3.1,
  wet: 0.35,
  bed: hearth(0.03),
  bar: (k) =>
    merge(
      play(broken(BARS, [0, 1, 2], 1), BEAT, musicBox({ peak: 0.022 })),
      play(k % 3 === 2 ? [] : k % 2 ? B : A, BEAT, musicBox({ peak: 0.045 })),
      crackles(LOOP, 14, rng(k + 11), 0.035),
    ),
};
