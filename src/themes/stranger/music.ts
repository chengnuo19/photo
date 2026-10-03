import { bass, broken, hiss, hz, merge, pad, play, synth, type Chord, type Note, type Score } from '../../sound/score';

/** Eighties synths on a worn tape: a pulsing arpeggio over a dark pad. */
const BEAT = 60 / 92;
const CHORDS: Chord[] = [
  [['A3', 'C4', 'E4', 'A4', 'C5'], 8],
  [['F3', 'A3', 'C4', 'F4', 'A4'], 8],
  [['C3', 'E3', 'G3', 'C4', 'E4'], 8],
  [['E3', 'G3', 'B3', 'E4', 'G4'], 8],
];
const ROOTS = ['A1', 'F1', 'C2', 'E2'];
const ARP = broken(CHORDS, [0, 1, 2, 3, 4, 3, 2, 1], 0.25);
const LOOP = 32 * BEAT;

const PADS: Note[] = CHORDS.flatMap(([notes, beats], i) =>
  notes.slice(0, 3).map((n) => ({ at: i * beats * BEAT, r: pad({ peak: 0.011 })(hz(n), beats * BEAT) })),
);
const PULSE: Note[] = CHORDS.flatMap(([, beats], i) =>
  Array.from({ length: beats * 2 }, (_, j) => ({ at: (i * beats + j * 0.5) * BEAT, r: bass({ peak: 0.05 })(hz(ROOTS[i]), 0.35 * BEAT) })),
);

export const strangerMusic: Score = {
  loop: LOOP,
  level: 3.2,
  wet: 0.3,
  bed: hiss(0.006),
  bar: (k) => merge(play(ARP, BEAT, synth({ peak: k % 2 ? 0.026 : 0.02 })), PADS, PULSE),
};
