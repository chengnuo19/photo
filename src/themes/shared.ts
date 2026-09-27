import { useEdit } from '../components/Editor/EditContext';
import type { BookImage, BookMeta, Spread } from '../data/schema';

/** Small helpers so theme pages can wire edits without knowing the editor. */
export function useBookEdits() {
  const edit = useEdit();
  return {
    editing: !!edit,
    meta: <K extends keyof BookMeta>(key: K) => (v: BookMeta[K]) =>
      edit?.update((d) => {
        d.meta[key] = v;
      }),
    metaLine: (key: 'coverLines' | 'closingLines', i: number) => (v: string) =>
      edit?.update((d) => {
        const lines = [...d.meta[key]];
        lines[i] = v;
        while (lines.length && !lines[lines.length - 1]) lines.pop();
        d.meta[key] = lines;
      }),
    spread: (id: string | undefined, fn: (s: Spread) => void) =>
      edit?.update((d) => {
        const s = d.spreads.find((x) => x.id === id);
        if (s) fn(s);
      }),
    spreadImage: (id: string | undefined, index: number) =>
      edit
        ? (img: BookImage) =>
            edit.update((d) => {
              const s = d.spreads.find((x) => x.id === id);
              if (s) s.images[index] = img;
            })
        : undefined,
    coverImage: edit
      ? (img: BookImage | undefined) =>
          edit.update((d) => {
            d.cover.image = img;
          })
      : undefined,
    dedication: (key: 'to' | 'body') => (v: string) =>
      edit?.update((d) => {
        d.meta.dedication = { body: '', ...d.meta.dedication, [key]: v };
      }),
    letter: (key: 'salutation' | 'body' | 'signoff' | 'date') => (v: string) =>
      edit?.update((d) => {
        d.meta.letter = { body: '', ...d.meta.letter, [key]: v };
      }),
  };
}

/** Lines to show: in the editor always `min` slots so empty lines can be filled in. */
export function lineSlots(lines: string[], min: number, editing: boolean) {
  if (!editing) return lines;
  const out = [...lines];
  while (out.length < min) out.push('');
  return out;
}

const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

/** "9.14" → { m: 9, d: 14, mon: 'SEP' } (stamps are free text; anything else passes through). */
export function stampDate(date?: string) {
  const [m, d] = (date ?? '').split(/[./-]/).map((x) => Number(x));
  return { m, d, mon: MONTHS[m - 1], ok: !!MONTHS[m - 1] && !!d };
}
