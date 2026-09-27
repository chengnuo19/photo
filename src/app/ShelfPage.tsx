import { useEffect, useState } from 'react';
import { Masthead } from '../components/Masthead/Masthead';
import { Dot, QuietButton, QuietLink } from '../components/ui/QuietButton';
import { createBook, duplicateBook, spreadsFromImages } from '../data/bookOps';
import { sampleBook } from '../data/sampleBook';
import type { BookDoc } from '../data/schema';
import { useFontsReady } from '../hooks/useFontsReady';
import { importImage, loadAssets, resolveBook } from '../storage/assets';
import { deleteBook, listBooks, putBook } from '../storage/db';
import { getTheme, themeStyle } from '../themes';
import { ThemeContext } from '../themes/context';
import { ensureFonts } from '../themes/fonts';
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
  const [busy, setBusy] = useState<string | null>(null);
  const [over, setOver] = useState(false);
  const ready = useFontsReady('回忆绘本书架新建一本书把照片拖到这里' + sampleBook.meta.coverLines.join(''));

  const refresh = async () => {
    const stored = await listBooks();
    await Promise.all(stored.map((b) => loadAssets(b.doc)));
    stored.forEach((b) => void ensureFonts(getTheme(b.doc.themeId).fonts, b.doc.themeId));
    setBooks([
      ...stored.map((b) => ({ doc: b.doc, resolved: resolveBook(b.doc) })),
      { doc: sampleBook, resolved: sampleBook, sample: true },
    ]);
  };
  useEffect(() => {
    refresh().catch(() => setBooks([{ doc: sampleBook, resolved: sampleBook, sample: true }]));
  }, []);

  const createFrom = async (files: File[]) => {
    const images = files.filter((f) => f.type.startsWith('image/'));
    const book = createBook();
    if (images.length) {
      setBusy(`正在整理 ${images.length} 张照片…`);
      const imported = [];
      for (const f of images) imported.push(await importImage(f));
      book.spreads = spreadsFromImages(imported);
      if (imported[0]) book.cover.image = { src: imported[0].src, thumb: imported[0].thumb, alt: '封面' };
    }
    await putBook(book);
    setBusy(null);
    go(href.edit(book.id));
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
      <Masthead footer="照片只保存在这台设备的浏览器里" />
      <section className={styles.shelf}>
        <header className={styles.head}>
          <h1>书架</h1>
          <p>把一次旅行、一段日子，做成一本可以翻开的书。</p>
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
                      <QuietButton onClick={() => void remove(b.doc)}>删除</QuietButton>
                    </>
                  )}
                </p>
              </li>
            );
          })}
        </ul>
      </section>

      {busy && <div className={styles.busy}>{busy}</div>}
    </main>
  );
}
