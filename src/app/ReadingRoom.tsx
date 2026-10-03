import { useRef, useState } from 'react';
import { Book, type BookHandle } from '../components/Book/Book';
import { SlideshowControls, useSlideshow } from '../components/Slideshow/Slideshow';
import { Unwrap } from '../components/Unwrap/Unwrap';
import { Masthead } from '../components/Masthead/Masthead';
import { MusicLink, MusicToggle, useBookMusic, VoiceButton } from '../components/Music/Music';
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
  preview = false,
}: {
  book: BookDoc;
  shelfHref?: string;
  editHref?: string;
  /** Show the gift wrapping first. */
  unwrap?: boolean;
  onUnwrapped?: () => void;
  /** The author reading their own book in the app (may skip the gift's wait and question). */
  preview?: boolean;
}) {
  const [sealed, setSealed] = useState(unwrap);
  const [resumeView] = useState(() => lastView.get(book.id));
  const ready = useFontsReady(fontSample(book), fontsOf(book), book.themeId);
  const theme = getTheme(book.themeId);
  const music = useBookMusic(book, theme);
  const [opened, setOpened] = useState(false);
  const open = () => {
    setOpened(true);
    music.start();
  };
  const bookRef = useRef<BookHandle>(null);
  const voicePlaying = useRef(false);
  voicePlaying.current = music.voicePlaying;
  const show = useSlideshow(bookRef, { voicePlaying: () => voicePlaying.current });
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
          onOpen={open}
          preview={preview}
          onDone={() => {
            setSealed(false);
            onUnwrapped?.();
            if (book.gift?.autoplay) show.play();
          }}
        />
      )}
      <div className={styles.table} data-sealed={sealed || undefined}>
        <Book
          book={book}
          handle={bookRef}
          onOpen={open}
          onTurn={music.onTurn}
          resumeView={resumeView}
          onView={(v, built) => {
            music.onView(v, built);
            show.onView(v, built);
            if (v > 0 && v < built.views.length - 1) lastView.set(book.id, v);
            else if (v > 0) lastView.clear(book.id);
          }}
        />
      </div>
      {music.available && <MusicToggle playing={music.playing} onToggle={music.toggle} />}
      {!sealed && <SlideshowControls show={show} />}
      {music.voice && opened && <VoiceButton playing={music.voicePlaying} onPlay={() => void music.playVoice(music.voice!)} onStop={music.stopVoice} />}
      {book.music?.kind === 'link' && book.music.url && opened && !sealed && <MusicLink link={book.music} />}
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
