import type { View } from './buildPages';

/**
 * How long things last when the book turns its own pages: the drawn video (export/film) and
 * the reader's slideshow use the same rhythm. Seconds.
 */
export const INTRO = 1.2;
export const TURN = 0.95;
export const DWELL = 2.6;
/** Second page of the same spread (portrait): a shorter look. */
export const DWELL_SAME = 1.7;
export const OUTRO = 2.4;
/** A page's voice note starts this long after the page settles. */
export const VOICE_AT = 0.6;

export type SlideSpeed = 'slow' | 'normal' | 'fast';

export const SPEEDS: Record<SlideSpeed, { label: string; base: number; perChar: number }> = {
  slow: { label: '慢', base: 6.5, perChar: 0.09 },
  normal: { label: '中', base: 4.5, perChar: 0.06 },
  fast: { label: '快', base: 3, perChar: 0.035 },
};

/** Characters a reader would read on this view. */
function textOn(view: View) {
  const s = view.spread;
  if (!s) return 0;
  return [s.caption, s.title, s.text].filter(Boolean).join('').length;
}

/**
 * The slideshow's pause on a view: longer for slower speeds and for pages with more to read,
 * and long enough to hear the page's voice note out.
 */
export function slideHold(view: View | undefined, speed: SlideSpeed) {
  const sp = SPEEDS[speed];
  if (!view) return sp.base;
  const reading = Math.min(8, textOn(view) * sp.perChar);
  const voice = view.spread?.voice ? VOICE_AT + view.spread.voice.seconds + 1 : 0;
  const letter = view.kind === 'letter' ? 4 : 0;
  return Math.max(sp.base + reading + letter, voice);
}
