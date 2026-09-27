import type { BookDoc } from '../data/schema';
import { newId } from './assets';
import { assetIdsOf, getAsset, getBook, putAsset, putBook, type StoredAsset } from './db';

/**
 * Editable backups (.mbook): a zip holding the book documents and every photo / song they
 * use, exactly as stored — so a book can move to another browser or computer and keep being
 * edited. (Exports are for readers; backups are for the author.)
 *
 *   mbook.json            { format, version, books: BookDoc[], assets: AssetEntry[] }
 *   assets/<id>.<ext>     the stored blob
 *   assets/<id>.t.<ext>   its thumbnail
 */
const FORMAT = 'memory-book-backup';
const VERSION = 1;

interface AssetEntry {
  id: string;
  kind: StoredAsset['kind'];
  file: string;
  type: string;
  thumb?: string;
  thumbType?: string;
  width?: number;
  height?: number;
  name?: string;
  takenAt?: string;
  createdAt: number;
}

interface Manifest {
  format: typeof FORMAT;
  version: number;
  exportedAt: string;
  books: BookDoc[];
  assets: AssetEntry[];
}

type Progress = (msg: string) => void;

const EXT: Record<string, string> = { 'image/webp': 'webp', 'image/jpeg': 'jpg', 'image/png': 'png', 'audio/mpeg': 'mp3', 'audio/mp4': 'm4a' };
const ext = (type: string) => EXT[type] ?? 'bin';

export async function backupBooks(docs: BookDoc[], progress: Progress = () => {}): Promise<{ blob: Blob; filename: string }> {
  const { default: JSZip } = await import('jszip');
  const zip = new JSZip();
  const ids = [...new Set(docs.flatMap(assetIdsOf))];
  const assets: AssetEntry[] = [];
  let n = 0;
  for (const id of ids) {
    progress(`备份照片和音乐 ${++n}/${ids.length}…`);
    const a = await getAsset(id);
    if (!a) continue;
    const file = `assets/${id}.${ext(a.blob.type)}`;
    zip.file(file, a.blob);
    const entry: AssetEntry = {
      id,
      kind: a.kind,
      file,
      type: a.blob.type,
      width: a.width,
      height: a.height,
      name: a.name,
      takenAt: a.takenAt,
      createdAt: a.createdAt,
    };
    if (a.thumb) {
      entry.thumb = `assets/${id}.t.${ext(a.thumb.type)}`;
      entry.thumbType = a.thumb.type;
      zip.file(entry.thumb, a.thumb);
    }
    assets.push(entry);
  }
  const manifest: Manifest = { format: FORMAT, version: VERSION, exportedAt: new Date().toISOString(), books: docs, assets };
  zip.file('mbook.json', JSON.stringify(manifest));
  progress('写入备份文件…');
  // photos are already compressed; storing is faster and just as small
  const blob = await zip.generateAsync({ type: 'blob', compression: 'STORE' });
  const day = new Date().toISOString().slice(0, 10);
  const name = docs.length === 1 ? safeName(docs[0].meta.title) : `全部${docs.length}本`;
  return { blob, filename: `${name}-备份-${day}.mbook` };
}

/**
 * Restore one or more backups. A book whose id already exists on this device is restored as
 * a separate copy (nothing is overwritten). Returns the ids of the restored books.
 */
export async function restoreBackup(file: Blob, progress: Progress = () => {}): Promise<string[]> {
  const { default: JSZip } = await import('jszip');
  let zip: InstanceType<typeof JSZip>;
  try {
    zip = await JSZip.loadAsync(file);
  } catch {
    throw new Error('这不是回忆绘本的备份文件（.mbook）');
  }
  const raw = await zip.file('mbook.json')?.async('string');
  const manifest = raw ? (JSON.parse(raw) as Manifest) : null;
  if (!manifest || manifest.format !== FORMAT || !Array.isArray(manifest.books)) {
    throw new Error('这不是回忆绘本的备份文件（.mbook）');
  }
  if (manifest.version > VERSION) throw new Error('这个备份来自更新版本的回忆绘本，请先更新应用');

  let n = 0;
  for (const e of manifest.assets) {
    progress(`恢复照片和音乐 ${++n}/${manifest.assets.length}…`);
    if (await getAsset(e.id)) continue;
    const data = await zip.file(e.file)?.async('blob');
    if (!data) continue;
    const thumbData = e.thumb ? await zip.file(e.thumb)?.async('blob') : undefined;
    await putAsset({
      id: e.id,
      kind: e.kind,
      blob: new Blob([data], { type: e.type }),
      thumb: thumbData ? new Blob([thumbData], { type: e.thumbType ?? e.type }) : undefined,
      width: e.width,
      height: e.height,
      name: e.name,
      takenAt: e.takenAt,
      createdAt: e.createdAt,
    });
  }

  const restored: string[] = [];
  for (const doc of manifest.books) {
    const copy = (await getBook(doc.id)) ? { ...doc, id: newId() } : doc;
    await putBook(copy);
    restored.push(copy.id);
  }
  return restored;
}

const safeName = (s: string) => (s || '无题').replace(/[\\/:*?"<>|\s]+/g, '').slice(0, 40) || '无题';
