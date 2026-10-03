import { broken, humanize, merge, phrase, piano, play, rain, rng, type Chord, type Score } from '../../sound/score';

/** Rain on the window and a piano rolling gentle arpeggios. */
const BEAT = 60 / 72;
const BARS: Chord[] = [
  [['F2', 'C3', 'F3', 'A3', 'C4'], 4],
  [['E2', 'C3', 'G3', 'C4', 'E4'], 4],
  [['D2', 'A2', 'D3', 'F3', 'A3'], 4],
  [['Bb1', 'F2', 'Bb2', 'D3', 'F3'], 4],
  [['F2', 'C3', 'F3', 'A3', 'C4'], 4],
  [['E2', 'C3', 'G3', 'C4', 'E4'], 4],
  [['Bb1', 'F2', 'Bb2', 'D3', 'F3'], 4],
  [['C2', 'G2', 'C3', 'E3', 'G3'], 4],
];
const ARP = broken(BARS, [0, 1, 2, 3, 4, 3, 2, 1], 0.5);
const A = phrase('A5*2 G5 F5 | E5*4 | F5*2 D5 C5 | D5*4 | C6*2 A5 F5 | G5*4 | F5 D5 Bb4 D5 | C5*4');
const B = phrase('C6*2 A5 G5 | G5*3 E5 | F5*2 A5 D6 | D6*4 | C6 A5 F5 A5 | G5*3 E5 | D5 F5 Bb5 A5 | G5*4');
const LOOP = 32 * BEAT;

export const watercolorMusic: Score = {
  loop: LOOP,
  level: 2.6,
  wet: 0.35,
  bed: rain(0.025),
  bar: (k) => {
    const r = rng(k + 7);
    return merge(humanize(play(ARP, BEAT, piano({ peak: 0.032 })), r), k % 3 === 2 ? [] : humanize(play(k % 2 ? B : A, BEAT, piano({ peak: 0.055 })), r));
  },
};
