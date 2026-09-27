/**
 * Keeping books safe in the browser.
 *
 * IndexedDB is "best effort" storage by default: the browser may clear it when the disk is
 * tight, and Safari clears it after 7 days without a visit. Asking for persistent storage
 * opts out of that (Chrome/Edge grant it silently to sites the user engages with, Firefox
 * asks once, Safari grants it to home-screen apps). Either way we show how much is used and
 * warn early, so nobody finds out by losing a book.
 */

export interface StorageInfo {
  /** Bytes used by this site. */
  usage: number;
  /** Bytes the browser will let this site use. */
  quota: number;
  /** true = the browser promised not to clear it on its own. */
  persisted: boolean;
}

/** Warn when less than this is left, or when more than 90 % is used. */
const LOW_BYTES = 150 * 1024 * 1024;

export async function storageInfo(): Promise<StorageInfo | null> {
  const s = navigator.storage;
  if (!s?.estimate) return null;
  try {
    const [{ usage = 0, quota = 0 }, persisted] = await Promise.all([s.estimate(), s.persisted?.() ?? false]);
    return { usage, quota, persisted };
  } catch {
    return null;
  }
}

/** Ask once per session (call it from a user action such as creating a book or adding photos). */
let asked: Promise<boolean> | null = null;
export function requestPersist(): Promise<boolean> {
  asked ??= (async () => {
    try {
      const s = navigator.storage;
      if (!s?.persist) return false;
      if (await s.persisted?.()) return true;
      return await s.persist();
    } catch {
      return false;
    }
  })();
  return asked;
}

export function isLow(info: StorageInfo | null, extra = 0) {
  if (!info || !info.quota) return false;
  const left = info.quota - info.usage - extra;
  return left < LOW_BYTES || (info.usage + extra) / info.quota > 0.9;
}

export function fmtBytes(n: number) {
  if (n < 1024 * 1024) return `${Math.max(1, Math.round(n / 1024))} KB`;
  if (n < 1024 * 1024 * 1024) return `${(n / 1024 / 1024).toFixed(n < 10 * 1024 * 1024 ? 1 : 0)} MB`;
  return `${(n / 1024 / 1024 / 1024).toFixed(1)} GB`;
}

/** Turn a storage failure into something a person can act on. */
export function explainStorageError(err: unknown): string {
  const e = err as { name?: string; message?: string } | null;
  const name = e?.name ?? '';
  if (name === 'QuotaExceededError' || /quota|space/i.test(e?.message ?? '')) {
    return '浏览器的存储空间满了。请先备份并删除用不到的书，或清理浏览器空间后再试。';
  }
  if (name === 'InvalidStateError' || name === 'UnknownError') {
    return '浏览器拒绝了保存（可能是无痕模式或存储被禁用）。请换普通窗口，或先备份这本书。';
  }
  return `保存失败：${e?.message || name || '未知错误'}`;
}
