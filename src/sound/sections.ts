import type { BuiltBook } from '../data/buildPages';
import type { BookDoc, ChapterMusic, MusicChoice } from '../data/schema';
import type { Theme } from '../themes/types';
import type { TrackSpec } from './music';

/* Which music plays where in a book (shared by the reader and the drawn video). */

/** What a music choice plays here (a link plays in the reader's music app, not in the book). */
export function trackOf(choice: MusicChoice | ChapterMusic | undefined, theme: Theme): TrackSpec {
  const c = choice ?? { kind: 'theme' };
  if (c.kind === 'file') return c.src ? { kind: 'file', src: c.src, start: c.start } : { kind: 'none' };
  if (c.kind === 'theme') return theme.sound?.music ? { kind: 'score', score: theme.sound.music } : { kind: 'none' };
  return { kind: 'none' };
}

/** The book's music by section: 'book', then every chapter that sets its own. */
export function sectionsOf(book: BookDoc, theme: Theme) {
  const tracks: Record<string, TrackSpec> = { book: trackOf(book.music, theme) };
  // a song link plays outside the book: chapters stay quiet too
  if (book.music?.kind !== 'link') for (const s of book.spreads) if (s.chapter?.music) tracks[s.id] = trackOf(s.chapter.music, theme);
  return tracks;
}

/** Which section plays at spread `index` (the nearest chapter before it that sets music). */
export function sectionAt(book: BookDoc, index: number, tracks: Record<string, TrackSpec>) {
  for (let i = Math.min(index, book.spreads.length - 1); i >= 0; i--) {
    const id = book.spreads[i].id;
    if (id in tracks) return id;
  }
  return 'book';
}

/** Spread index a view belongs to: story views their own, the closing pages the last spread, opening pages -1. */
export function spreadIndexOfView(book: BookDoc, built: BuiltBook, view: number) {
  const v = built.views[view];
  if (!v) return -1;
  if (v.spread) return book.spreads.findIndex((s) => s.id === v.spread!.id);
  return v.kind === 'letter' || v.kind === 'finis' || v.kind === 'back' ? book.spreads.length - 1 : -1;
}
