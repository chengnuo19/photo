import { useState } from 'react';
import { Book } from '../components/Book/Book';
import { Unwrap } from '../components/Unwrap/Unwrap';
import { Masthead } from '../components/Masthead/Masthead';
import { MusicToggle, useBookMusic } from '../components/Music/Music';
import { Scene } from '../components/Scene/Scene';
import { QuietLink } from '../components/ui/QuietButton';
import type { BookDoc } from '../data/schema';
import { fontsOf, getTheme, themeStyle } from '../themes';
import { fontSample, useFontsReady } from '../hooks/useFontsReady';
import styles from './App.module.css';

/** The reading experience itself — shared by the app and exported books. */
export function ReadingRoom({
  book,
  shelfHref,
  editHref,
  unwrap = false,
  onUnwrapped,
}: {
  book: BookDoc;
  shelfHref?: string;
  editHref?: string;
  /** Show the gift wrapping first. */
  unwrap?: boolean;
  onUnwrapped?: () => void;
}) {
  const [sealed, setSealed] = useState(unwrap);
  const [resumeView] = useState(() => lastView.get(book.id));
  const ready = useFontsReady(fontSample(book), fontsOf(book), book.themeId);
  const music = useBookMusic(book.music?.src);
  const theme = getTheme(book.themeId);
  return (
    <main className={`${styles.room} ${theme.className}`} style={themeStyle(book)} data-ready={ready || undefined}>
      <Scene theme={theme} mode="read" sound={book.sound.flip} />
      <Masthead
        book={book}
        shelfHref={shelfHref}
        right={editHref ? <QuietLink href={editHref}>编辑</QuietLink> : undefined}
      />
      {sealed && (
        <Unwrap
          theme={theme}
          book={book}
          sound={book.sound.flip}
          onOpen={music.start}
          onDone={() => {
            setSealed(false);
            onUnwrapped?.();
          }}
        />
      )}
      <div className={styles.table} data-sealed={sealed || undefined}>
        <Book
          book={book}
          onOpen={music.start}
          resumeView={resumeView}
          onView={(v, built) => (v > 0 && v < built.views.length - 1 ? lastView.set(book.id, v) : v > 0 && lastView.clear(book.id))}
        />
      </div>
      {music.available && <MusicToggle playing={music.playing} onToggle={music.toggle} />}
    </main>
  );
}

/** Where each reader stopped last time (per book, on this device). Finishing the book clears it. */
const LAST = 'mb-last:';
const lastView = {
  get(id: string) {
    try {
      const v = Number(localStorage.getItem(LAST + id));
      return v > 0 ? v : undefined;
    } catch {
      return undefined;
    }
  },
  set(id: string, v: number) {
    try {
      localStorage.setItem(LAST + id, String(v));
    } catch {
      /* private mode: starts from the cover next time */
    }
  },
  clear(id: string) {
    try {
      localStorage.removeItem(LAST + id);
    } catch {
      /* ignore */
    }
  },
};
