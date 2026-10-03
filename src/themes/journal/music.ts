import { broken, harp, humanize, merge, phrase, play, rng, wind, type Chord, type Score } from '../../sound/score';

/** Travelling guitar: a finger-picked progression in the wind. */
const BEAT = 60 / 96;
const BARS: Chord[] = [
  [['G2', 'B3', 'D4', 'G4'], 4],
  [['F#2', 'A3', 'D4', 'F#4'], 4],
  [['E2', 'B3', 'E4', 'G4'], 4],
  [['C3', 'G3', 'C4', 'E4'], 4],
  [['G2', 'B3', 'D4', 'G4'], 4],
  [['D3', 'A3', 'D4', 'F#4'], 4],
  [['C3', 'G3', 'C4', 'E4'], 4],
  [['D3', 'A3', 'D4', 'F#4'], 4],
];
const PICK = broken(BARS, [0, 2, 3, 2, 1, 2, 3, 2], 0.5);
const TUNE = phrase('D5*2 B4 G4 | A4*4 | B4*2 G4 E4 | E4*4 | D5 B4 G4 B4 | A4*3 F#4 | G4 E4 C5*2 | A4*4');
const LOOP = 32 * BEAT;

export const journalMusic: Score = {
  loop: LOOP,
  level: 3.8,
  wet: 0.22,
  bed: wind(0.035, 480),
  bar: (k) => {
    const r = rng(k + 5);
    return merge(humanize(play(PICK, BEAT, harp({ peak: 0.05 })), r, 0.015), k % 2 ? play(TUNE, BEAT, harp({ peak: 0.075 })) : []);
  },
};
