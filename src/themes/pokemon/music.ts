import { birds, chip, chipBass, layer, merge, phrase, play, rng, struck, wind, type Chord, type Score } from '../../sound/score';

/** A cheerful 8-bit walk through tall grass. */
const BEAT = 60 / 132;
const TUNE = phrase(
  'G4/2 B4/2 D5 B4/2 G4/2 D5 | E5 D5/2 B4/2 G4*2 | C5/2 E5/2 G5 E5/2 C5/2 E5 | D5*2 F#5 A5 | B5/2 A5/2 G5 D5/2 B4/2 G4 | E5/2 F#5/2 G5 B5 G5 | E5 C5 F#5 A5 | G5*4',
);
const LOW = phrase('G2 D3 G2 D3 | E2 B2 E2 B2 | C3 G2 C3 G2 | D3 A2 D3 A2 | G2 D3 G2 D3 | E2 B2 E2 B2 | C3 G2 D3 A2 | G2 D3 G2*2');
const CHORDS: Chord[] = [
  [['B3', 'D4'], 4],
  [['B3', 'E4'], 4],
  [['C4', 'E4'], 4],
  [['D4', 'F#4'], 4],
  [['B3', 'D4'], 4],
  [['B3', 'E4'], 4],
  [['C4', 'E4'], 2],
  [['D4', 'F#4'], 2],
  [['B3', 'D4'], 4],
];
const OFFBEATS = struck(CHORDS, [0.5, 1.5, 2.5, 3.5], 0.25);
const LOOP = 32 * BEAT;

export const pokemonMusic: Score = {
  loop: LOOP,
  level: 1.8,
  wet: 0.15,
  bed: layer(wind(0.018, 700)),
  bar: (k) =>
    merge(
      k % 4 === 3 ? [] : play(TUNE, BEAT, chip({ peak: 0.02 })),
      play(LOW, BEAT, chipBass({ peak: 0.07 })),
      play(OFFBEATS, BEAT, chip({ peak: 0.008 })),
      birds(LOOP, 3, rng(k + 23)),
    ),
};
