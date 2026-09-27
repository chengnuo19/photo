import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import type { BookDoc } from '../data/schema';

export interface StoredAsset {
  id: string;
  kind: 'image' | 'audio';
  blob: Blob;
  /** Small preview for thumbnails / the polaroid. */
  thumb?: Blob;
  width?: number;
  height?: number;
  name?: string;
  /** Capture time from EXIF, ISO string. */
  takenAt?: string;
  createdAt: number;
}

export interface StoredBook {
  id: string;
  doc: BookDoc;
  updatedAt: number;
  createdAt: number;
}

interface MemoryBookDB extends DBSchema {
  books: { key: string; value: StoredBook; indexes: { updatedAt: number } };
  assets: { key: string; value: StoredAsset };
}

let dbp: Promise<IDBPDatabase<MemoryBookDB>> | null = null;

export function db() {
  dbp ??= openDB<MemoryBookDB>('memory-book', 1, {
    upgrade(d) {
      const books = d.createObjectStore('books', { keyPath: 'id' });
      books.createIndex('updatedAt', 'updatedAt');
      d.createObjectStore('assets', { keyPath: 'id' });
    },
  });
  return dbp;
}

export async function listBooks(): Promise<StoredBook[]> {
  const all = await (await db()).getAllFromIndex('books', 'updatedAt');
  return all.reverse();
}

export async function getBook(id: string) {
  return (await db()).get('books', id);
}

export async function putBook(doc: BookDoc) {
  const d = await db();
  const prev = await d.get('books', doc.id);
  const now = Date.now();
  await d.put('books', { id: doc.id, doc, updatedAt: now, createdAt: prev?.createdAt ?? now });
}

/** Delete a book and every asset only it references. */
export async function deleteBook(id: string) {
  const d = await db();
  const book = await d.get('books', id);
  if (!book) return;
  const others = (await d.getAll('books')).filter((b) => b.id !== id);
  const stillUsed = new Set(others.flatMap((b) => assetIdsOf(b.doc)));
  const tx = d.transaction(['books', 'assets'], 'readwrite');
  await tx.objectStore('books').delete(id);
  for (const a of assetIdsOf(book.doc)) if (!stillUsed.has(a)) await tx.objectStore('assets').delete(a);
  await tx.done;
}

export async function putAsset(asset: StoredAsset) {
  await (await db()).put('assets', asset);
}

export async function getAsset(id: string) {
  return (await db()).get('assets', id);
}

export const ASSET_PREFIX = 'asset:';
export const isAssetRef = (src?: string): src is string => !!src && src.startsWith(ASSET_PREFIX);
export const assetId = (src: string) => src.slice(ASSET_PREFIX.length);
export const assetRef = (id: string) => ASSET_PREFIX + id;
export const thumbRef = (id: string) => ASSET_PREFIX + id + '#thumb';

/** Every asset id a book references (images, thumbs, music). */
export function assetIdsOf(doc: BookDoc): string[] {
  const ids = new Set<string>();
  forEachSrc(doc, (src) => {
    if (isAssetRef(src)) ids.add(assetId(src).replace(/#thumb$/, ''));
  });
  return [...ids];
}

/** Visit every asset source in a book. */
export function forEachSrc(doc: BookDoc, fn: (src: string) => void) {
  const img = (i?: { src: string; thumb?: string }) => {
    if (!i) return;
    fn(i.src);
    if (i.thumb) fn(i.thumb);
  };
  img(doc.cover.image);
  for (const s of doc.spreads) {
    s.images.forEach(img);
    img(s.snapshot);
    s.stickers?.forEach((st) => !st.src.startsWith('theme:') && fn(st.src));
  }
  if (doc.music) fn(doc.music.src);
}

/** Return a copy of the book with every source passed through `map`. */
export function mapSrcs(doc: BookDoc, map: (src: string) => string): BookDoc {
  const img = <T extends { src: string; thumb?: string } | undefined>(i: T): T =>
    i ? ({ ...i, src: map(i.src), ...(i.thumb ? { thumb: map(i.thumb) } : {}) } as T) : i;
  return {
    ...doc,
    cover: { ...doc.cover, image: img(doc.cover.image) },
    spreads: doc.spreads.map((s) => ({
      ...s,
      images: s.images.map(img),
      snapshot: img(s.snapshot),
      stickers: s.stickers?.map((st) => (st.src.startsWith('theme:') ? st : { ...st, src: map(st.src) })),
    })),
    music: doc.music ? { ...doc.music, src: map(doc.music.src) } : undefined,
  };
}
