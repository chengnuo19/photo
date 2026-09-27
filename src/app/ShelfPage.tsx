import { useEffect, useRef, useState } from 'react';
import { Masthead } from '../components/Masthead/Masthead';
import { Dot, QuietButton, QuietLink } from '../components/ui/QuietButton';
import { Toast, type ToastState } from '../components/ui/Toast';
import { createBook, duplicateBook, spreadsFromImages } from '../data/bookOps';
import { sampleBook } from '../data/sampleBook';
import type { BookDoc } from '../data/schema';
import { useFontsReady } from '../hooks/useFontsReady';
import { download } from '../export/exportBook';
import { importImages, importLabel, loadAssets, resolveBook } from '../storage/assets';
import { backupBooks, restoreBackup } from '../storage/backup';
import { deleteBook, listBooks, putBook } from '../storage/db';
import { explainStorageError, fmtBytes, isLow, requestPersist, storageInfo, type StorageInfo } from '../storage/quota';
import { getTheme, loadThemes, themeStyle } from '../themes';
import { ThemeContext } from '../themes/context';
import { ensureFonts } from '../themes/fonts';
import { failedNote, setNote } from './notes';
import { go, href } from './router';
import app from './App.module.css';
import styles from './ShelfPage.module.css';

interface ShelfBook {
  doc: BookDoc;
  resolved: BookDoc;
  sample?: boolean;
}

export function ShelfPage() {
  const [books, setBooks] = useState<ShelfBook[] | null>(null);
  const [toast, setToast] = useState<ToastState | null>(null);
  const [over, setOver] = useState(false);
  const [storage, setStorage] = useState<StorageInfo | null>(null);
  const restoreInput = useRef<HTMLInputElement>(null);

  const flash = (text: string, tone?: ToastState['tone'], ms = tone === 'warn' ? 6000 : 2600) => {
    setToast({ text, tone });
    window.setTimeout(() => setToast((t) => (t?.text === text ? null : t)), ms);
  };
  const ready = useFontsReady('回忆绘本书架新建一本书把照片拖到这里' + sampleBook.meta.coverLines.join(''));

  const refresh = async () => {
    const stored = await listBooks();
    await Promise.all([...stored.map((b) => loadAssets(b.doc)), loadThemes(stored.map((b) => b.doc.themeId)).catch(() => undefined)]);
    stored.forEach((b) => void ensureFonts(getTheme(b.doc.themeId).fonts, b.doc.themeId));
    setBooks([
      ...stored.map((b) => ({ doc: b.doc, resolved: resolveBook(b.doc) })),
      { doc: sampleBook, resolved: sampleBook, sample: true },
    ]);
    // someone who already has books is exactly who should not lose them
    if (stored.length) await requestPersist();
    setStorage(await storageInfo());
  };
  useEffect(() => {
    refresh().catch(() => setBooks([{ doc: sampleBook, resolved: sampleBook, sample: true }]));
  }, []);

  const createFrom = async (files: File[]) => {
    if (files.some(isBackup)) return restore(files.filter(isBackup));
    const images = files.filter((f) => f.type.startsWith('image/'));
    const book = createBook();
    void requestPersist();
    try {
      if (images.length) {
        const batch = await importImages(images, (done, total) => setToast({ text: importLabel(done, total), progress: done / total }));
        if (batch.error) throw batch.error;
        book.spreads = spreadsFromImages(batch.images);
        const first = batch.images[0];
        if (first) book.cover.image = { src: first.src, thumb: first.thumb, alt: '封面' };
        if (batch.failed.length) setNote(failedNote(batch.failed));
      }
      await putBook(book);
      setToast(null);
      go(href.edit(book.id));
    } catch (err) {
      flash(explainStorageError(err), 'warn');
    }
  };

  const restore = async (files: File[]) => {
    try {
      const ids: string[] = [];
      for (const f of files) ids.push(...(await restoreBackup(f, (text) => setToast({ text }))));
      void requestPersist();
      await refresh();
      flash(`已恢复 ${ids.length} 本书`);
    } catch (err) {
      const e = err as Error;
      flash(e.message?.startsWith('这') ? e.message : explainStorageError(err), 'warn');
    }
  };

  const backup = async (docs: BookDoc[]) => {
    try {
      const res = await backupBooks(docs, (text) => setToast({ text }));
      download(res);
      flash(`备份完成，${fmtBytes(res.blob.size)}。换电脑或换浏览器后，在书架点“从备份恢复”。`, undefined, 4200);
    } catch (err) {
      flash(`备份失败：${(err as Error).message}`, 'warn');
    }
  };

  const useAsTemplate = async () => {
    const copy = duplicateBook(sampleBook);
    copy.meta.title = sampleBook.meta.title;
    await putBook(copy);
    go(href.edit(copy.id));
  };

  const remove = async (b: BookDoc) => {
    if (!window.confirm(`删除《${b.meta.title || '无题'}》？这本书和它的照片会从这个浏览器里移除，无法恢复。`)) return;
    await deleteBook(b.id);
    await refresh();
  };

  const own = (books ?? []).filter((b) => !b.sample).map((b) => b.doc);

  return (
    <main
      className={app.room}
      data-ready={(ready && books) || undefined}
      onDragOver={(e) => {
        if (e.dataTransfer.types.includes('Files')) {
          e.preventDefault();
          setOver(true);
        }
      }}
      onDragLeave={(e) => {
        if (e.currentTarget === e.target) setOver(false);
      }}
      onDrop={(e) => {
        e.preventDefault();
        setOver(false);
        void createFrom([...e.dataTransfer.files]);
      }}
    >
      <Masthead footer={<StorageNote info={storage} hasBooks={own.length > 0} />} />
      <section className={styles.shelf}>
        <header className={styles.head}>
          <h1>书架</h1>
          <p>把一次旅行、一段日子，做成一本可以翻开的书。</p>
          <p className={styles.tools}>
            <QuietButton onClick={() => restoreInput.current?.click()}>从备份恢复</QuietButton>
            {own.length > 1 && (
              <>
                <Dot />
                <QuietButton onClick={() => void backup(own)}>备份全部</QuietButton>
              </>
            )}
          </p>
        </header>

        <ul className={styles.row}>
          <li className={styles.item}>
            <a className={`${styles.cover} ${styles.new}`} data-over={over || undefined} href={href.gallery()}>
              <span className={styles.plus} aria-hidden>
                +
              </span>
              <span>新建一本</span>
              <small>先挑一种风格；也可以直接把照片拖到这里</small>
            </a>
            <p className={styles.caption}>&nbsp;</p>
          </li>

          {books?.map((b) => {
            const theme = getTheme(b.resolved.themeId);
            const Cover = theme.pages.cover;
            return (
              <li key={b.doc.id} className={styles.item}>
                <ThemeContext.Provider value={theme}>
                  <a
                    className={`${styles.cover} ${theme.className}`}
                    style={themeStyle(b.resolved)}
                    href={href.read(b.doc.id)}
                    aria-label={`阅读《${b.doc.meta.title}》`}
                  >
                    <Cover book={b.resolved} page={{ key: 'cover', kind: 'cover', view: 0, side: 'single', hard: true }} />
                    <span className={styles.spine} aria-hidden />
                  </a>
                </ThemeContext.Provider>
                <p className={styles.caption}>
                  <span className={styles.title}>{b.doc.meta.title || '无题'}</span>
                  {b.sample && <span className={styles.tag}>示例</span>}
                </p>
                <p className={styles.actions}>
                  <QuietLink href={href.read(b.doc.id)}>阅读</QuietLink>
                  <Dot />
                  {b.sample ? (
                    <QuietButton onClick={useAsTemplate}>以此为模板</QuietButton>
                  ) : (
                    <>
                      <QuietLink href={href.edit(b.doc.id)}>编辑</QuietLink>
                      <Dot />
                      <QuietButton onClick={() => void backup([b.doc])} title="备份成 .mbook 文件，换电脑或浏览器后可以恢复继续编辑">
                        备份
                      </QuietButton>
                      <Dot />
                      <QuietButton onClick={() => void remove(b.doc)}>删除</QuietButton>
                    </>
                  )}
                </p>
              </li>
            );
          })}
        </ul>
      </section>

      <input
        ref={restoreInput}
        type="file"
        accept=".mbook,application/zip"
        multiple
        className="visually-hidden"
        tabIndex={-1}
        onChange={(e) => {
          const files = [...(e.target.files ?? [])];
          e.target.value = '';
          if (files.length) void restore(files);
        }}
      />
      <Toast toast={toast} placement="bottom" />
    </main>
  );
}

const isBackup = (f: File) => /\.mbook$/i.test(f.name);

/** "照片只保存在这台设备的浏览器里 · 已用 84 MB" — and a warning when storage is at risk. */
function StorageNote({ info, hasBooks }: { info: StorageInfo | null; hasBooks: boolean }) {
  const base = '照片只保存在这台设备的浏览器里';
  if (!info || !hasBooks) return <>{base}</>;
  const used = `已用 ${fmtBytes(info.usage)}`;
  if (isLow(info)) return <span className={styles.warn}>存储空间快满了（{used}，共 {fmtBytes(info.quota)}），请备份后删除不用的书</span>;
  if (!info.persisted) return <>{base} · {used} · 浏览器清理空间时可能删掉它们，记得备份</>;
  return <>{base} · {used} · 已设为持久保存</>;
}
