import { useEffect, useMemo, useState } from 'react';
import { Masthead } from '../components/Masthead/Masthead';
import { QuietButton, QuietLink } from '../components/ui/QuietButton';
import { createBook, spreadsFromImages } from '../data/bookOps';
import type { BookDoc } from '../data/schema';
import { useFontsReady } from '../hooks/useFontsReady';
import { importImage } from '../storage/assets';
import { putBook } from '../storage/db';
import { listThemes, themeStyle } from '../themes';
import { ThemeContext } from '../themes/context';
import { ensureFonts } from '../themes/fonts';
import type { Theme } from '../themes/types';
import { go, href } from './router';
import app from './App.module.css';
import styles from './ThemeGallery.module.css';

/**
 * “Pick a sample book”: every theme lies on the table as a small closed book,
 * rendered by its own cover. Choose one (and a palette), then add photos or start blank.
 */
export function ThemeGallery() {
  const themes = useMemo(() => listThemes(), []);
  const samples = useMemo(() => new Map(themes.map((t) => [t.id, t.sample()])), [themes]);
  useEffect(() => {
    themes.forEach((t) => void ensureFonts(t.fonts, t.id));
  }, [themes]);
  const [picked, setPicked] = useState<Theme | null>(null);
  const [palette, setPalette] = useState<string | undefined>();
  const [busy, setBusy] = useState<string | null>(null);
  const ready = useFontsReady(
    '选一本样书经典影视' + themes.map((t) => t.name + t.blurb + samples.get(t.id)!.meta.title).join(''),
    [...new Set(themes.flatMap((t) => t.fonts))],
  );

  const start = async (files: File[]) => {
    if (!picked) return;
    const book = createBook(picked.id);
    book.paletteId = palette;
    const images = files.filter((f) => f.type.startsWith('image/'));
    if (images.length) {
      setBusy(`正在整理 ${images.length} 张照片…`);
      const imported = [];
      for (const f of images) imported.push(await importImage(f));
      book.spreads = spreadsFromImages(imported, picked.id);
      book.cover.image = { src: imported[0].src, thumb: imported[0].thumb, alt: '封面' };
    }
    await putBook(book);
    go(href.edit(book.id));
  };

  const mini = (t: Theme, doc: BookDoc, big = false) => {
    const Cover = t.pages.cover;
    const shown = palette && picked?.id === t.id ? { ...doc, paletteId: palette } : doc;
    return (
      <ThemeContext.Provider value={t}>
        <span className={`${styles.cover} ${big ? styles.big : ''} ${t.className}`} style={themeStyle(shown)}>
          <Cover book={shown} page={{ key: 'cover', kind: 'cover', view: 0, side: 'single', hard: true }} />
          <span className={styles.spine} aria-hidden />
        </span>
      </ThemeContext.Provider>
    );
  };

  return (
    <main className={app.room} data-ready={ready || undefined}>
      <Masthead shelfHref={href.shelf()} right={<QuietLink href={href.shelf()}>回到书架</QuietLink>} />
      <section className={styles.gallery}>
        <header className={styles.head}>
          <h1>选一本样书</h1>
          <p>每一种风格都是一整套设计好的书：纸、字、配色、装饰和版式。之后随时可以换。</p>
        </header>

        {(['classic', 'screen'] as const).map((g) => (
          <div key={g} className={styles.group}>
            <h2>{g === 'classic' ? '经典' : '影视'}</h2>
            <ul className={styles.row}>
              {themes
                .filter((t) => t.group === g)
                .map((t) => (
                  <li key={t.id} className={styles.item}>
                    <button
                      type="button"
                      className={styles.pick}
                      onClick={() => {
                        setPicked(t);
                        setPalette(undefined);
                      }}
                      aria-label={`选择「${t.name}」`}
                    >
                      {mini(t, samples.get(t.id)!)}
                    </button>
                    <p className={styles.name}>{t.name}</p>
                    <p className={styles.blurb}>{t.blurb}</p>
                    <span className={styles.dots} aria-hidden>
                      {t.palettes.map((p) => (
                        <i key={p.id} style={{ background: `linear-gradient(135deg, ${p.swatch[0]} 50%, ${p.swatch[1]} 50%)` }} />
                      ))}
                    </span>
                  </li>
                ))}
            </ul>
          </div>
        ))}
      </section>

      {picked && (
        <div className={styles.scrim} onClick={(e) => e.target === e.currentTarget && setPicked(null)}>
          <div className={styles.card} role="dialog" aria-label={picked.name}>
            <div className={styles.cardCover}>{mini(picked, samples.get(picked.id)!, true)}</div>
            <div className={styles.cardBody}>
              <p className={styles.cardGroup}>{picked.group === 'classic' ? '经典' : '影视'}</p>
              <h2 className={styles.cardName}>{picked.name}</h2>
              <p className={styles.cardBlurb}>{picked.blurb}</p>
              <p className={styles.cardLabel}>配色</p>
              <div className={styles.palettes}>
                {picked.palettes.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    className={styles.palette}
                    data-active={(palette ?? picked.palettes[0].id) === p.id || undefined}
                    onClick={() => setPalette(p.id)}
                  >
                    <i style={{ background: `linear-gradient(135deg, ${p.swatch[0]} 50%, ${p.swatch[1]} 50%)`, boxShadow: `inset 0 0 0 2px ${p.swatch[2]}` }} />
                    {p.name}
                  </button>
                ))}
              </div>
              <div className={styles.actions}>
                <label className={styles.primary}>
                  <input type="file" accept="image/*" multiple className="visually-hidden" onChange={(e) => void start([...(e.target.files ?? [])])} />
                  选择照片，开始做书
                </label>
                <QuietButton onClick={() => void start([])}>先空着开始</QuietButton>
                <QuietLink href={href.read(samples.get(picked.id)!.id)}>翻开样书看看</QuietLink>
              </div>
            </div>
            <button type="button" className={styles.close} onClick={() => setPicked(null)} aria-label="关闭">
              ×
            </button>
          </div>
        </div>
      )}

      {busy && <div className={styles.busy}>{busy}</div>}
    </main>
  );
}
