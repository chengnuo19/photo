import { bass, humanize, merge, phrase, piano, play, projector, rng, struck, type Chord, type Score } from '../../sound/score';

/** Late-night jazz piano over a running projector. */
const BEAT = 60 / 84;
const CHORDS: Chord[] = [
  [['F4', 'A4', 'C5', 'E5'], 4], // Dm9
  [['F4', 'B4', 'E5'], 4], // G13
  [['E4', 'G4', 'B4', 'D5'], 4], // Cmaj9
  [['C#4', 'G4', 'Bb4'], 4], // A7b9
];
const ROOTS = ['D3', 'G2', 'C3', 'A2'];
const FIFTHS = ['A2', 'D3', 'G2', 'E3'];
const comp = struck([...CHORDS, ...CHORDS], [0, 2.5], 1.2);
const LINE = ROOTS.map((r, i) => `${r}*2 ${FIFTHS[i]}*2`).join(' ');
const walk = phrase(`${LINE} ${LINE}`);
const TUNE = phrase('r A5/2 C6/2 B5 A5 | G5*3 r | E5*2 D5 B4 | C#5*3 r | r A5/2 C6/2 D6 C6 | B5*2 G5 F5 | E5*4 | r*4');
const LOOP = 32 * BEAT;

export const filmMusic: Score = {
  loop: LOOP,
  level: 3.6,
  wet: 0.25,
  bed: projector(0.018),
  bar: (k) => {
    const r = rng(k + 3);
    return merge(
      humanize(play(comp, BEAT, piano({ peak: 0.03 })), r),
      play(walk, BEAT, bass({ peak: 0.07 })),
      k % 2 ? humanize(play(TUNE, BEAT, piano({ peak: 0.06 })), r) : [],
    );
  },
};
