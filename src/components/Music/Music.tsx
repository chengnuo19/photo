import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import type { BuiltBook } from '../../data/buildPages';
import { PLATFORM_NAMES } from '../../data/musicLink';
import type { BookDoc, MusicChoice } from '../../data/schema';
import { BookAudio } from '../../sound/music';
import { sectionAt, sectionsOf, spreadIndexOfView } from '../../sound/sections';
import type { Theme } from '../../themes/types';
import styles from './Music.module.css';

/**
 * Music and voice notes for a book being read. Starts (with a slow fade) when the reader opens
 * the book — that tap is the gesture browsers require — follows chapters, fades at the end,
 * ducks under voice notes, and can be paused from the toggle.
 */
export function useBookMusic(book: BookDoc, theme: Theme, opts: { voice?: boolean } = {}) {
  const tracks = useMemo(() => sectionsOf(book, theme), [book, theme]);
  const sig = JSON.stringify(tracks, (k, v) => (k === 'score' ? theme.id : v));
  const [player, setPlayer] = useState<BookAudio | null>(null);
  const [, rerender] = useReducer((x: number) => x + 1, 0);
  useEffect(() => {
    const p = new BookAudio(tracks, 'book');
    setPlayer(p);
    const off = p.subscribe(rerender);
    return () => {
      off();
      p.dispose();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sig]);

  const voiceTimer = useRef(0);
  const voiceOn = opts.voice !== false;
  const [voice, setVoice] = useState<string | undefined>();
  const onView = useCallback(
    (view: number, built: BuiltBook) => {
      if (!player) return;
      const i = spreadIndexOfView(book, built, view);
      player.setSection(i < 0 ? 'book' : sectionAt(book, i, tracks));
      const kind = built.views[view]?.kind;
      player.setEnding(kind === 'finis' || kind === 'back');
      window.clearTimeout(voiceTimer.current);
      const note = built.views[view]?.spread?.voice;
      setVoice(note?.src || undefined);
      if (voiceOn && note?.src) voiceTimer.current = window.setTimeout(() => void player.playVoice(note.src), 600);
    },
    [book, tracks, player, voiceOn],
  );
  const onTurn = useCallback(() => {
    window.clearTimeout(voiceTimer.current);
    player?.stopVoice();
  }, [player]);
  useEffect(() => () => window.clearTimeout(voiceTimer.current), []);

  return {
    available: player?.available ?? false,
    playing: player?.playing ?? false,
    voicePlaying: player?.voicePlaying ?? false,
    /** The voice note of the page being read, if any. */
    voice,
    start: useCallback(() => player?.start(), [player]),
    toggle: useCallback(() => player?.toggle(), [player]),
    playVoice: useCallback((src: string) => player?.playVoice(src) ?? Promise.resolve(), [player]),
    stopVoice: useCallback(() => player?.stopVoice(), [player]),
    onView,
    onTurn,
  };
}

/** Replay (or stop) the voice note of the page being read. */
export function VoiceButton({ playing, onPlay, onStop }: { playing: boolean; onPlay: () => void; onStop: () => void }) {
  return (
    <button type="button" className={`${styles.toggle} ${styles.voiceBtn}`} data-playing={playing || undefined} onClick={playing ? onStop : onPlay}>
      <span aria-hidden>{playing ? '■' : '▶'}</span>
      <span className={styles.label}>{playing ? '停止留言' : '听一段留言'}</span>
    </button>
  );
}

export function MusicToggle({ playing, onToggle }: { playing: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      className={styles.toggle}
      data-playing={playing || undefined}
      onClick={onToggle}
      aria-label={playing ? '暂停音乐' : '播放音乐'}
      aria-pressed={playing}
    >
      <span className={styles.bars} aria-hidden>
        <i />
        <i />
        <i />
      </span>
      <span className={styles.label}>{playing ? '音乐' : '静音'}</span>
    </button>
  );
}

/** A song on a music platform: the reader opens it in their own app (full song, their account). */
export function MusicLink({ link }: { link: Extract<MusicChoice, { kind: 'link' }> }) {
  const [hidden, setHidden] = useState(false);
  const [copied, setCopied] = useState(false);
  if (hidden) return null;
  const app = PLATFORM_NAMES[link.platform];
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(link.url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      window.prompt('复制链接', link.url);
    }
  };
  return (
    <aside className={styles.link} aria-label="这本书的配乐">
      <p className={styles.linkLine}>
        <span aria-hidden>♪ </span>这本书配了一首歌{link.title ? <b>《{link.title}》</b> : null}
      </p>
      <p className={styles.linkActions}>
        <a href={link.url} target="_blank" rel="noopener noreferrer">
          在{app}里播放
        </a>
        <button type="button" onClick={() => void copy()}>
          {copied ? '已复制' : '复制链接'}
        </button>
        <button type="button" onClick={() => setHidden(true)} aria-label="收起">
          ×
        </button>
      </p>
    </aside>
  );
}
