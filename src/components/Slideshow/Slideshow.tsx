import { useCallback, useEffect, useRef, useState, type RefObject } from 'react';
import type { BuiltBook, View } from '../../data/buildPages';
import { INTRO, SPEEDS, slideHold, type SlideSpeed } from '../../data/timing';
import type { BookHandle } from '../Book/Book';
import styles from './Slideshow.module.css';

type State = 'off' | 'playing' | 'paused';

const SPEED_KEY = 'mb-slide-speed';
const readSpeed = (): SlideSpeed => {
  try {
    const v = localStorage.getItem(SPEED_KEY);
    return v === 'slow' || v === 'fast' ? v : 'normal';
  } catch {
    return 'normal';
  }
};

/**
 * The book turns its own pages, with the music — for parents on the sofa or a TV. Any tap,
 * drag or arrow key from the reader pauses it; it stops on the closed back cover.
 */
export function useSlideshow(book: RefObject<BookHandle | null>, opts: { voicePlaying: () => boolean }) {
  const [state, setState] = useState<State>('off');
  const [speed, setSpeedState] = useState<SlideSpeed>(readSpeed);
  const view = useRef<View | undefined>(undefined);
  const voice = useRef(opts.voicePlaying);
  voice.current = opts.voicePlaying;

  const onView = useCallback((v: number, built: BuiltBook) => {
    view.current = built.views[v];
  }, []);

  const setSpeed = (s: SlideSpeed) => {
    setSpeedState(s);
    try {
      localStorage.setItem(SPEED_KEY, s);
    } catch {
      /* this visit only */
    }
  };

  // the loop
  useEffect(() => {
    if (state !== 'playing') return;
    let alive = true;
    const sleep = (ms: number) => new Promise<void>((r) => window.setTimeout(r, ms));
    const until = async (test: () => boolean, ms = 60000) => {
      const end = Date.now() + ms;
      while (alive && !test() && Date.now() < end) await sleep(80);
    };
    const phase = () => book.current?.phase() ?? '';
    const atRest = () => ['closed', 'reading', 'ended'].includes(phase());
    void (async () => {
      while (alive) {
        await until(atRest, 8000);
        if (!alive) return;
        if (phase() === 'ended') return setState('off');
        const hold = phase() === 'closed' ? INTRO + 0.6 : slideHold(view.current, speed);
        const end = Date.now() + hold * 1000;
        await until(() => Date.now() >= end, hold * 1000 + 100);
        await until(() => !voice.current(), 70000);
        if (!alive) return;
        book.current?.next();
        await sleep(400); // the turn has begun
      }
    })();
    return () => {
      alive = false;
    };
  }, [state, speed, book]);

  // the reader taking over pauses it (our own controls carry data-slideshow)
  useEffect(() => {
    if (state !== 'playing') return;
    const pause = (e: Event) => {
      if ((e.target as Element | null)?.closest?.('[data-slideshow]')) return;
      if (e instanceof KeyboardEvent && !['ArrowRight', 'ArrowLeft', 'PageDown', 'PageUp', ' ', 'Escape'].includes(e.key)) return;
      setState('paused');
    };
    window.addEventListener('pointerdown', pause, { capture: true });
    window.addEventListener('keydown', pause, { capture: true });
    return () => {
      window.removeEventListener('pointerdown', pause, { capture: true });
      window.removeEventListener('keydown', pause, { capture: true });
    };
  }, [state]);

  // keep the screen on while it plays
  useEffect(() => {
    if (state !== 'playing') return;
    type Lock = { release: () => Promise<void> };
    const nav = navigator as Navigator & { wakeLock?: { request: (t: 'screen') => Promise<Lock> } };
    let lock: Lock | null = null;
    const take = () => nav.wakeLock?.request('screen').then((l) => (lock = l), () => undefined);
    void take();
    const again = () => document.visibilityState === 'visible' && void take();
    document.addEventListener('visibilitychange', again);
    return () => {
      document.removeEventListener('visibilitychange', again);
      void lock?.release().catch(() => undefined);
    };
  }, [state]);

  return {
    state,
    speed,
    setSpeed,
    onView,
    play: useCallback(() => setState('playing'), []),
    pause: useCallback(() => setState('paused'), []),
    stop: useCallback(() => setState('off'), []),
  };
}

export function SlideshowControls({ show }: { show: ReturnType<typeof useSlideshow> }) {
  const [full, setFull] = useState(() => typeof document !== 'undefined' && !!document.fullscreenElement);
  useEffect(() => {
    const on = () => setFull(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', on);
    return () => document.removeEventListener('fullscreenchange', on);
  }, []);
  const canFull = typeof document !== 'undefined' && !!document.documentElement.requestFullscreen;
  const toggleFull = () => {
    if (document.fullscreenElement) void document.exitFullscreen().catch(() => undefined);
    else void document.documentElement.requestFullscreen().catch(() => undefined);
  };
  const playing = show.state === 'playing';
  return (
    <div className={styles.controls} data-slideshow data-state={show.state}>
      <button type="button" className={styles.btn} onClick={playing ? show.pause : show.play} aria-pressed={playing}>
        <span aria-hidden>{playing ? '❚❚' : '▶'}</span>
        {playing ? '暂停放映' : show.state === 'paused' ? '继续放映' : '自动放映'}
      </button>
      {show.state !== 'off' && (
        <span className={styles.speeds} role="radiogroup" aria-label="放映速度">
          {(Object.keys(SPEEDS) as SlideSpeed[]).map((s) => (
            <button key={s} type="button" role="radio" aria-checked={show.speed === s} data-on={show.speed === s || undefined} onClick={() => show.setSpeed(s)}>
              {SPEEDS[s].label}
            </button>
          ))}
        </span>
      )}
      {canFull && show.state !== 'off' && (
        <button type="button" className={styles.btn} onClick={toggleFull}>
          {full ? '退出全屏' : '全屏'}
        </button>
      )}
    </div>
  );
}
