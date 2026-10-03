import { bass, crickets, hz, layer, merge, musicBox, pad, rng, wind, type Note, type Score } from '../../sound/score';

/** A night sky: a slow pad, crickets, and a music box picking stars. */
const BEAT = 1;
const CHORDS = [
  ['A3', 'C4', 'E4'],
  ['F3', 'A3', 'C4'],
  ['C4', 'E4', 'G4'],
  ['G3', 'B3', 'D4'],
];
const ROOTS = ['A2', 'F2', 'C3', 'G2'];
const STARS = ['A5', 'C6', 'D6', 'E6', 'G6', 'A6'];
const SPAN = 8 * BEAT;
const LOOP = 4 * SPAN;

function bar(k: number): Note[] {
  const r = rng(k + 17);
  const notes: Note[] = [];
  CHORDS.forEach((c, i) => {
    const at = i * SPAN;
    for (const n of c) notes.push({ at, r: pad({ peak: 0.014 })(hz(n), SPAN) });
    notes.push({ at, r: bass({ peak: 0.05 })(hz(ROOTS[i]), SPAN * 0.8) });
    // a few stars per chord, on the half beats
    const count = 4 + Math.floor(r() * 3);
    for (let j = 0; j < count; j++) {
      const step = Math.floor(r() * 16) * 0.5;
      notes.push({ at: at + step * BEAT, r: musicBox({ peak: 0.03 + r() * 0.015 })(hz(STARS[Math.floor(r() * STARS.length)]), 1) });
    }
  });
  return merge(notes, crickets(LOOP, 10, r));
}

export const starryMusic: Score = {
  loop: LOOP,
  level: 2.6,
  wet: 0.5,
  bed: layer(wind(0.02, 380)),
  bar,
};
