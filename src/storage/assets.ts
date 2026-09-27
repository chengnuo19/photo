import type { BookDoc } from '../data/schema';
import { assetId, assetIdsOf, assetRef, getAsset, isAssetRef, mapSrcs, putAsset, thumbRef, type StoredAsset } from './db';

/**
 * Object URLs for stored assets. Kept for the session so the flip engine's cloned pages
 * and preloaded images never point at a revoked URL.
 */
const urls = new Map<string, string>();

function register(a: StoredAsset) {
  if (!urls.has(a.id)) urls.set(a.id, URL.createObjectURL(a.blob));
  if (a.thumb && !urls.has(a.id + '#thumb')) urls.set(a.id + '#thumb', URL.createObjectURL(a.thumb));
}

/** Load every asset a book references into memory (object URLs). */
export async function loadAssets(doc: BookDoc) {
  const missing = assetIdsOf(doc).filter((id) => !urls.has(id));
  const found = await Promise.all(missing.map(getAsset));
  found.forEach((a) => a && register(a));
}

/** Map `asset:` references to object URLs. Unknown references become '' (shown as broken). */
export function resolveBook(doc: BookDoc): BookDoc {
  return mapSrcs(doc, (src) => (isAssetRef(src) ? urls.get(assetId(src)) ?? '' : src));
}

const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);

export interface ImportedImage {
  src: string;
  thumb: string;
  width: number;
  height: number;
  takenAt?: Date;
  name: string;
}

const MAX_EDGE = 2560;
const THUMB_EDGE = 480;

async function encode(bitmap: ImageBitmap, maxEdge: number, quality: number): Promise<Blob> {
  const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height));
  const w = Math.round(bitmap.width * scale);
  const h = Math.round(bitmap.height * scale);
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(bitmap, 0, 0, w, h);
  const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, 'image/webp', quality));
  if (blob && blob.type === 'image/webp') return blob;
  return new Promise<Blob>((res, rej) =>
    canvas.toBlob((b) => (b ? res(b) : rej(new Error('encode failed'))), 'image/jpeg', quality),
  );
}

/**
 * Import a photo or illustration: honour EXIF orientation, downscale to a sensible print
 * size, re-encode as WebP, make a thumbnail and read the capture date.
 */
export async function importImage(file: File): Promise<ImportedImage> {
  const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
  const [blob, thumb, takenAt] = await Promise.all([
    encode(bitmap, MAX_EDGE, 0.86),
    encode(bitmap, THUMB_EDGE, 0.8),
    readTakenAt(file),
  ]);
  const asset: StoredAsset = {
    id: uid(),
    kind: 'image',
    blob,
    thumb,
    width: bitmap.width,
    height: bitmap.height,
    name: file.name,
    takenAt: takenAt?.toISOString(),
    createdAt: Date.now(),
  };
  bitmap.close();
  await putAsset(asset);
  register(asset);
  return { src: assetRef(asset.id), thumb: thumbRef(asset.id), width: asset.width!, height: asset.height!, takenAt, name: file.name };
}

export async function importAudio(file: File): Promise<string> {
  const asset: StoredAsset = { id: uid(), kind: 'audio', blob: file, name: file.name, createdAt: Date.now() };
  await putAsset(asset);
  register(asset);
  return assetRef(asset.id);
}

async function readTakenAt(file: File): Promise<Date | undefined> {
  try {
    const { parse } = await import('exifr');
    const exif = await parse(file, ['DateTimeOriginal', 'CreateDate']);
    const d = exif?.DateTimeOriginal ?? exif?.CreateDate;
    return d instanceof Date && !isNaN(+d) ? d : undefined;
  } catch {
    return undefined;
  }
}

/** Fetch any source (asset ref, object URL, relative URL) as a Blob — used by export. */
export async function srcToBlob(src: string): Promise<Blob> {
  if (isAssetRef(src)) {
    const id = assetId(src);
    const base = id.replace(/#thumb$/, '');
    const a = await getAsset(base);
    if (!a) throw new Error(`missing asset ${id}`);
    return id.endsWith('#thumb') && a.thumb ? a.thumb : a.blob;
  }
  const res = await fetch(src);
  if (!res.ok) throw new Error(`fetch ${src}: ${res.status}`);
  return res.blob();
}

export const newId = uid;
