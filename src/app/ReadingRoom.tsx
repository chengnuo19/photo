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
        <Book book={book} onOpen={music.start} />
      </div>
      {music.available && <MusicToggle playing={music.playing} onToggle={music.toggle} />}
    </main>
  );
}
