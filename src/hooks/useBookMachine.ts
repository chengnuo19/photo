import { useCallback, useReducer } from 'react';
import { BACK, FORWARD, type EngineState } from '../components/Book/PageFlipView';

/**
 * Book lifecycle.
 *
 *   closed ──open──▶ opening ──▶ reading ⇄ flipping ──▶ closing ──▶ ended
 *     ▲                                                              │
 *     └──────────────────────── (reopen from the back) ◀────────────┘
 *
 * The phase is derived from engine events rather than set by callers, so it always
 * matches what is on screen — including user drags that are released halfway.
 */
export type BookPhase = 'closed' | 'opening' | 'reading' | 'flipping' | 'closing' | 'ended';

interface MachineState {
  phase: BookPhase;
  /** Physical index of the page (or left page of the spread) currently shown. */
  index: number;
  /** Physical index of the last page (the back cover). */
  last: number;
}

type Action =
  | { type: 'flip'; index: number }
  | { type: 'engine'; state: EngineState; direction: number | null }
  | { type: 'reset'; index: number; last: number };

function atRest(index: number, last: number): BookPhase {
  if (index <= 0) return 'closed';
  if (index >= last) return 'ended';
  return 'reading';
}

function inMotion(index: number, last: number, direction: number | null, landscape: boolean): BookPhase {
  if (direction === FORWARD) {
    if (index === 0) return 'opening';
    const target = landscape ? index + 2 : index + 1;
    if (target >= last) return 'closing';
  } else if (direction === BACK) {
    if (index >= last) return 'opening';
    if (index === 1) return 'closing';
  }
  return 'flipping';
}

export function useBookMachine(initialIndex: number, last: number, landscape: boolean) {
  const reducer = useCallback(
    (s: MachineState, a: Action): MachineState => {
      switch (a.type) {
        case 'reset':
          return { index: a.index, last: a.last, phase: atRest(a.index, a.last) };
        case 'flip':
          return a.index === s.index ? s : { ...s, index: a.index };
        case 'engine': {
          if (a.state === 'fold_corner') return s;
          const phase =
            a.state === 'read' ? atRest(s.index, s.last) : inMotion(s.index, s.last, a.direction, landscape);
          return phase === s.phase ? s : { ...s, phase };
        }
      }
    },
    [landscape],
  );

  const [state, dispatch] = useReducer(reducer, { index: initialIndex, last, phase: atRest(initialIndex, last) });
  return [state, dispatch] as const;
}

/** Phases in which the reader may start a new page turn. */
export function acceptsInput(phase: BookPhase) {
  return phase === 'closed' || phase === 'reading' || phase === 'ended';
}
