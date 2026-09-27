import { useRef, useState } from 'react';
import { Book, type BookHandle } from '../components/Book/Book';
import { MusicToggle, useBookMusic } from '../components/Music/Music';
import { Scene } from '../components/Scene/Scene';
import { QuietButton, QuietLink } from '../components/ui/QuietButton';
import { Unwrap } from '../components/Unwrap/Unwrap';
import type { BookDoc } from '../data/schema';
import {
  captureSupport,
  captureThisTab,
  composeLongImage,
  grab,
  nextFrame,
  NotThisTabError,
  pickVideoMime,
  record,
  streamVideo,
  until,
  wait,
  type Segment,
} from '../export/capture';
import { download } from '../export/exportBook';
import { fontSample, useFontsReady } from '../hooks/useFontsReady';
import { isSampleId, useLoadedBook } from '../hooks/useLoadedBook';
import { fmtBytes } from '../storage/quota';
import { fontsOf, getTheme, themeStyle } from '../themes';
import { href, type RecordMode } from './router';
import app from './App.module.css';
import styles from './RecordPage.module.css';

/** How long each open spread stays on screen in the video. */
const DWELL_MS = 2600;

/** Turn a book into a flip-through video or one long picture, for chat apps. */
export function RecordPage({ id, mode }: { id: string; mode: RecordMode }) {
  const { resolved, status } = useLoadedBook(id);
  const back = isSampleId(id) ? href.read(id) : href.edit(id);
  if (status === 'missing') {
    return (
      <main className={`${app.room} ${app.center}`} data-ready>
        <p className={app.note}>找不到这本书。</p>
        <QuietLink href={href.shelf()}>回到书架</QuietLink>
      </main>
    );
  }
  if (!resolved) return <main className={app.room} />;
  return <Recorder book={resolved} mode={mode} backHref={back} />;
}

type Stage = { name: 'intro' } | { name: 'running'; note: string } | { name: 'done'; text: string } | { name: 'error'; text: string };

function Recorder({ book, mode, backHref }: { book: BookDoc; mode: RecordMode; backHref: string }) {
  const theme = getTheme(book.themeId);
  const ready = useFontsReady(fontSample(book), fontsOf(book), book.themeId);
  const music = useBookMusic(book.music?.src);
  const roomRef = useRef<HTMLElement>(null);
  const bookRef = useRef<BookHandle>(null);
  const [stage, setStage] = useState<Stage>({ name: 'intro' });
  const wrapped = mode === 'video' && book.gift?.unwrap !== false;
  const [sealed, setSealed] = useState(wrapped);
  const [take, setTake] = useState(0);
  const unwrapped = useRef<() => void>(() => undefined);
  const support = captureSupport();
  const video = mode === 'video';

  const phase = () => roomRef.current?.querySelector('[data-phase]')?.getAttribute('data-phase') ?? '';
  const atRest = () => ['closed', 'reading', 'ended'].includes(phase());

  const views = () => bookRef.current?.viewCount() ?? 0;
  // cover, dedication, letter, closing words, back cover + the spreads
  const seconds = Math.round((wrapped ? 5 : 2) + ((book.spreads.length + 5) * (DWELL_MS + 1000)) / 1000 + 3);

  const run = async () => {
    if (!roomRef.current) return;
    let stream: MediaStream | null = null;
    try {
      stream = await captureThisTab(roomRef.current, video);
    } catch (err) {
      if (err instanceof NotThisTabError) setStage({ name: 'error', text: err.message });
      else if ((err as Error).name !== 'NotAllowedError') setStage({ name: 'error', text: `没能开始录制：${(err as Error).message}` });
      return;
    }
    const stopAll = () => stream?.getTracks().forEach((t) => t.stop());
    // if the person clicks "stop sharing" in the browser bar, wind down
    let cancelled = false;
    stream.getVideoTracks()[0].addEventListener('ended', () => (cancelled = true));

    setStage({ name: 'running', note: video ? '录制中…请不要切换标签页' : '正在拍下每一页…' });
    // the "sharing this tab" bar resizes the page: let the book settle first
    await wait(1200);

    try {
      if (video) {
        const rec = record(stream);
        await wait(900);
        if (sealed) {
          const done = new Promise<void>((r) => (unwrapped.current = r));
          roomRef.current.querySelector<HTMLButtonElement>('[data-unwrap] button')?.click();
          await done;
          await wait(1300);
        }
        bookRef.current?.next();
        while (!cancelled) {
          await until(() => atRest() && phase() !== 'closed', 6000);
          if (phase() === 'ended') break;
          await wait(DWELL_MS);
          bookRef.current?.next();
        }
        await wait(2200);
        const blob = await rec.stop();
        stopAll();
        const ext = rec.mp4 ? 'mp4' : 'webm';
        download({ blob, filename: `${safe(book.meta.title)}-翻书视频.${ext}` });
        setStage({
          name: 'done',
          text: rec.mp4
            ? `视频已保存（${fmtBytes(blob.size)}），可以直接发到微信。`
            : `视频已保存为 .webm（${fmtBytes(blob.size)}）。微信可能不能直接播放，可以先用剪映等工具转成 MP4。`,
        });
      } else {
        const v = await streamVideo(stream);
        const n = views();
        const segments: Segment[] = [];
        for (let i = 0; i < n && !cancelled; i++) {
          setStage({ name: 'running', note: `正在拍下每一页 ${i + 1}/${n}…` });
          bookRef.current?.goToView(i);
          await until(atRest, 4000);
          await imagesReady(roomRef.current);
          await wait(i === 0 ? 900 : 1100); // captions fade in
          await nextFrame(v);
          const closed = phase() === 'closed' || phase() === 'ended';
          segments.push({ bitmap: grab(v, cropRect(roomRef.current, closed)), kind: closed ? 'cover' : 'spread' });
        }
        stopAll();
        if (cancelled) throw new Error('录制被中途停止了');
        setStage({ name: 'running', note: '正在拼成长图…' });
        const cs = getComputedStyle(roomRef.current);
        const blob = await composeLongImage(segments, {
          background: cs.getPropertyValue('--room').trim() || '#f7f2e7',
          ink: cs.getPropertyValue('--room-ink').trim() || '#6d5d48',
          footer: `《${book.meta.title || '无题'}》 · 回忆绘本`,
        });
        download({ blob, filename: `${safe(book.meta.title)}-长图.jpg` });
        bookRef.current?.goToView(0);
        setStage({ name: 'done', text: `长图已保存（${segments.length} 页，${fmtBytes(blob.size)}），可以发到微信或朋友圈。` });
      }
    } catch (err) {
      stopAll();
      setStage({ name: 'error', text: `录制失败：${(err as Error).message}` });
    }
  };

  const again = () => {
    bookRef.current?.goToView(0);
    setSealed(wrapped);
    setTake((t) => t + 1);
    setStage({ name: 'intro' });
  };

  const running = stage.name === 'running';
  return (
    <main
      ref={roomRef}
      className={`${app.room} ${theme.className} ${styles.room}`}
      style={themeStyle(book)}
      data-ready={ready || undefined}
      data-running={running || undefined}
    >
      <Scene theme={theme} mode="read" sound={book.sound.flip} />
      {sealed && (
        <Unwrap
          key={take}
          theme={theme}
          book={book}
          sound={book.sound.flip}
          onOpen={music.start}
          onDone={() => {
            setSealed(false);
            unwrapped.current();
          }}
        />
      )}
      <div className={app.table} data-sealed={sealed || undefined}>
        <Book book={book} onOpen={music.start} handle={bookRef} recording />
      </div>
      {music.available && !running && <MusicToggle playing={music.playing} onToggle={music.toggle} />}

      {running ? (
        // the video records this page too: say nothing on screen (the browser's sharing bar shows it is recording)
        <p className={video ? 'visually-hidden' : styles.live} aria-live="polite">
          {stage.note}
        </p>
      ) : (
        <div className={styles.scrim}>
          <section className={styles.panel} role="dialog" aria-labelledby="rec-title">
            <h1 id="rec-title">{video ? '翻书视频' : '长图'}</h1>
            {stage.name === 'intro' &&
              (support.ok ? (
                <>
                  <p>
                    {video
                      ? `自动${wrapped ? '拆开礼物、' : ''}翻完整本书，保存成${pickVideoMime().startsWith('video/mp4') ? ' MP4 ' : ''}视频，可以直接发微信或朋友圈。大约 ${seconds} 秒。`
                      : '把封面和每一页拍下来，拼成一张长图，适合发微信和朋友圈。'}
                  </p>
                  <ol>
                    <li>点“开始”，浏览器会问要共享哪个画面：选择<b>此标签页</b>{video && <>，并打开<b>分享标签页音频</b>（这样音乐和翻页声也会录进去）</>}。</li>
                    <li>录制时请不要切换标签页或改变窗口大小。</li>
                    <li>结束后文件会自动下载。</li>
                  </ol>
                  <p className={styles.actions}>
                    <QuietButton className={styles.primary} onClick={() => void run()}>
                      开始
                    </QuietButton>
                    <QuietLink href={backHref}>返回</QuietLink>
                  </p>
                </>
              ) : (
                <>
                  <p>{support.reason}</p>
                  <p className={styles.actions}>
                    <QuietLink href={backHref}>返回</QuietLink>
                  </p>
                </>
              ))}
            {(stage.name === 'done' || stage.name === 'error') && (
              <>
                <p data-tone={stage.name === 'error' ? 'warn' : undefined}>{stage.text}</p>
                <p className={styles.actions}>
                  <QuietButton onClick={again}>{stage.name === 'error' ? '再试一次' : '再录一次'}</QuietButton>
                  <QuietLink href={backHref}>返回</QuietLink>
                </p>
              </>
            )}
          </section>
        </div>
      )}
    </main>
  );
}

/** The open spread (or the closed cover) plus its caption line, with a little air around it. */
function cropRect(room: HTMLElement, closed: boolean): DOMRect {
  const area = room.querySelector('[aria-roledescription="book"]')!.getBoundingClientRect();
  let { left, right } = area;
  const landscape = room.querySelector('[data-layout]')?.getAttribute('data-layout') === 'landscape';
  if (closed && landscape) {
    const half = area.width / 4; // a closed cover is one page wide, centred on the table
    left = area.left + area.width / 2 - half;
    right = area.left + area.width / 2 + half;
  }
  let bottom = area.bottom;
  const cap = room.querySelector('[data-mb-caption][data-show]');
  if (cap && !closed) bottom = Math.max(bottom, cap.getBoundingClientRect().bottom);
  const air = Math.round(area.height * 0.04);
  const l = Math.max(0, left - air);
  const t = Math.max(0, area.top - air);
  const r = Math.min(window.innerWidth, right + air);
  const b = Math.min(window.innerHeight, bottom + air);
  return new DOMRect(l, t, r - l, b - t);
}

async function imagesReady(room: HTMLElement) {
  const imgs = [...room.querySelectorAll<HTMLImageElement>('[aria-roledescription="book"] img')];
  await Promise.all(imgs.map((im) => (im.complete ? Promise.resolve() : im.decode().catch(() => undefined))));
}

const safe = (s: string) => (s || '无题').replace(/[\\/:*?"<>|\s]+/g, '').slice(0, 40) || '无题';
