import { merge, phrase, piano, play, room, struck, type Chord, type Score } from '../../sound/score';

/** A slow, spare piano in an empty gallery (3/4). */
const BEAT = 1;
const BARS: Chord[] = [
  [['B3', 'D4', 'F#4'], 3], // Gmaj7 (bass G2)
  [['F#3', 'A3', 'C#4'], 3], // Dmaj7 (bass D2)
];
const BASS = ['G2', 'D2'];
const LEFT = merge(
  ...Array.from({ length: 4 }, (_, i) => [
    ...play(struck(BARS, [1], 2), BEAT, piano({ peak: 0.024 })).map((n) => ({ ...n, at: n.at + i * 6 * BEAT })),
    ...play(phrase(`${BASS[0]}*3 ${BASS[1]}*3`), BEAT, piano({ peak: 0.045 })).map((n) => ({ ...n, at: n.at + i * 6 * BEAT })),
  ]),
);
const TUNE = phrase('r*2 D5 | E5*2 F#5 | A5*2 G5 | F#5*3 | r*2 B4 | C#5*2 D5 | E5 D5 B4 | A4*3');
const TUNE2 = phrase('r*2 F#5 | G5*2 A5 | B5*2 A5 | F#5*3 | r*2 D5 | E5*2 F#5 | C#5 D5 E5 | D5*3');
const LOOP = 24 * BEAT;

export const museumMusic: Score = {
  loop: LOOP,
  level: 3.7,
  wet: 0.45,
  bed: room(0.02),
  bar: (k) => merge(LEFT, play(k % 2 ? TUNE2 : TUNE, BEAT, piano({ peak: 0.05 }))),
};
