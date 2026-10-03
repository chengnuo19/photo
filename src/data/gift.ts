import type { BookDoc } from './schema';

/**
 * The gift's little ceremonies: a time before which it cannot be opened, and a question only
 * the recipient can answer. Both live in the book itself (there is no server), so they are a
 * ritual, not a lock — someone who reads the page source can get past them.
 */

/** Milliseconds until the gift may be opened (0 = now). */
export function msUntilUnlock(doc: BookDoc, now = Date.now()) {
  const at = doc.gift?.unlockAt;
  return at && at > now ? at - now : 0;
}

/** "3 天 04:12:09" style pieces. */
export function countdown(ms: number) {
  const s = Math.max(0, Math.ceil(ms / 1000));
  return { days: Math.floor(s / 86400), hours: Math.floor((s % 86400) / 3600), minutes: Math.floor((s % 3600) / 60), seconds: s % 60 };
}

/** Answers compare loosely: case, spaces, punctuation, full-width letters do not matter. */
export function normalizeAnswer(s: string) {
  return s.normalize('NFKC').toLowerCase().replace(/[\s\p{P}\p{S}]+/gu, '');
}

/**
 * Two FNV-1a passes → 16 hex digits, salted (the salt is stored with the question, so a copy
 * of the book keeps working), so the answers do not show in the exported file.
 */
export function hashAnswer(answer: string, salt: string) {
  const text = salt + '\u0000' + normalizeAnswer(answer);
  const fnv = (seed: number) => {
    let h = seed >>> 0;
    for (let i = 0; i < text.length; i++) {
      h ^= text.charCodeAt(i);
      h = Math.imul(h, 0x01000193) >>> 0;
    }
    return h.toString(16).padStart(8, '0');
  };
  return fnv(0x811c9dc5) + fnv(0x9747b28c);
}

export function checkAnswer(doc: BookDoc, answer: string) {
  const q = doc.gift?.quiz;
  if (!q?.answers.length) return true;
  if (!normalizeAnswer(answer)) return false;
  return q.answers.includes(hashAnswer(answer, q.salt));
}

/** Several accepted answers can be typed at once: "公园，人民公园 / park". */
export function splitAnswers(s: string) {
  return s
    .split(/[\n,，、;；/|]+/)
    .map((x) => x.trim())
    .filter((x) => normalizeAnswer(x));
}
