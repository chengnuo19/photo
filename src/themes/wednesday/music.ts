import { bell, type Recipe } from '../../sound/engine';
import { merge, phrase, pizz, play, rain, rng, thunder, type Score } from '../../sound/score';

/** A cello plucking a lament in the rain; a far bell, now and then thunder. */
const BEAT = 60 / 80;
const LOW = phrase('D3 A2 D3 A2 | C3 G2 C3 G2 | Bb2 F2 Bb2 F2 | A2 E2 A2 C#3 | D3 A2 D3 A2 | C3 G2 C3 G2 | Bb2 F2 Bb2 G2 | A2 E2 A2 A2');
const HIGH = phrase('D4 F4 A4 D5 | E5*2 C5 G4 | F4 D5 Bb4 F4 | E4*2 C#4 A3 | D4 F4 A4 F5 | E5*2 C5 E5 | D5 Bb4 G4 E4 | C#4*2 E4 A4');
const LOOP = 32 * BEAT;
const toll: Recipe = (v) => bell(v, { f: 146.83, peak: 0.035, d: 5, partials: [1, 2.0, 2.4, 3.0, 4.2] });

export const wednesdayMusic: Score = {
  loop: LOOP,
  level: 2.5,
  wet: 0.4,
  bed: rain(0.03),
  bar: (k) => {
    const r = rng(k + 13);
    return merge(
      play(LOW, BEAT, pizz({ peak: 0.11 })),
      k % 2 ? play(HIGH, BEAT, pizz({ peak: 0.07 })) : [],
      [{ at: 0, r: toll }],
      k % 2 === 0 ? [thunder(8 + r() * 14, 0.1)] : [],
    );
  },
};
