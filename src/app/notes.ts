/**
 * A note carried across a page change (e.g. from the shelf into the editor after an import
 * where some files could not be read), shown once.
 */
const KEY = 'mb-note';

export function setNote(text: string) {
  try {
    sessionStorage.setItem(KEY, text);
  } catch {
    /* not important enough to fail over */
  }
}

export function takeNote(): string | null {
  try {
    const t = sessionStorage.getItem(KEY);
    if (t) sessionStorage.removeItem(KEY);
    return t;
  } catch {
    return null;
  }
}

export function failedNote(names: string[]) {
  const list = names.slice(0, 3).join('、') + (names.length > 3 ? '…' : '');
  return `有 ${names.length} 张没能读取（${list}），可能是 HEIC 等浏览器不支持的格式，可以先转成 JPG 再添加。`;
}
