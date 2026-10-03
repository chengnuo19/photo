import { DOC_VERSION, type BookDoc, type MusicChoice } from './schema';

/**
 * Bring a book from any earlier version up to date. Every way a book comes in goes through
 * here: the store (storage/db.ts), backups, and exported books (viewer-main.tsx).
 * Returns the same object when nothing changes.
 */
export function migrateDoc(doc: BookDoc): BookDoc {
  if (doc.version >= DOC_VERSION) return doc;
  let d = doc;
  // v1 → v2: music became a choice (theme / file / link / none); a v1 song is a file
  const m = d.music as MusicChoice | { src: string; title?: string } | undefined;
  if (m && !('kind' in m)) d = { ...d, music: { kind: 'file', src: m.src, title: m.title } };
  return { ...d, version: DOC_VERSION as 2 };
}
