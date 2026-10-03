import { useEffect, useMemo, useRef, useState } from 'react';
import { Book, type BookHandle } from '../components/Book/Book';
import { MusicToggle, useBookMusic } from '../components/Music/Music';
import { Scene } from '../components/Scene/Scene';
import { QuietButton, QuietLink } from '../components/ui/QuietButton';
import { Unwrap } from '../components/Unwrap/Unwrap';
import { buildPages } from '../data/buildPages';
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
import { FilmCancelled, filmSeconds, makeFilm, makeLongImage } from '../export/film/film';
import { PagePress, type PressHandle } from '../export/film/press';
import { geometryFor, type FilmFormat } from '../export/film/renderer';
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

type Stage =
  | { name: 'intro' }
  | { name: 'running'; note: string; progress?: number }
  | { name: 'done'; text: string; file?: { blob: Blob; filename: string } }
  | { name: 'error'; text: string };

/** Screen capture (desktop Chrome / Edge, pixel-exact) or pictures drawn on a canvas (everywhere). */
type Method = 'capture' | 'draw';

const inWeChat = () => /MicroMessenger/i.test(navigator.userAgent);
const phoneLike = () => window.matchMedia('(pointer: coarse)').matches && !window.matchMedia('(pointer: fine)').matches;

function Recorder({ book, mode, backHref }: { book: BookDoc; mode: RecordMode; backHref: string }) {
  const theme = getTheme(book.themeId);
  const ready = useFontsReady(fontSample(book), fontsOf(book), book.themeId);
  const music = useBookMusic(book, theme);
  // the screen recording waits for a page's voice note to finish before turning on
  const speaking = useRef(false);
  speaking.current = music.voicePlaying;
  const roomRef = useRef<HTMLElement>(null);
  const bookRef = useRef<BookHandle>(null);
  const [stage, setStage] = useState<Stage>({ name: 'intro' });
  const wrapped = mode === 'video' && book.gift?.unwrap !== false;
  const [sealed, setSealed] = useState(wrapped);
  const [take, setTake] = useState(0);
  const unwrapped = useRef<() => void>(() => undefined);
  const support = captureSupport();
  const video = mode === 'video';
  const [method, setMethod] = useState<Method>(support.ok ? 'capture' : 'draw');
  const [format, setFormat] = useState<FilmFormat>(() => (window.innerWidth < window.innerHeight ? 'portrait' : 'landscape'));
  // the long picture is always made of open spreads
  const pressFormat: FilmFormat = video ? format : 'landscape';
  const geo = useMemo(() => geometryFor(pressFormat), [pressFormat]);
  const built = useMemo(() => buildPages(book, geo.landscape ? 'landscape' : 'portrait'), [book, geo]);
  const pressRef = useRef<PressHandle>(null);
  const [pressing, setPressing] = useState(false);
  const abort = useRef<AbortController | null>(null);
  useEffect(() => () => abort.current?.abort(), []);

  const phase = () => roomRef.current?.querySelector('[data-phase]')?.getAttribute('data-phase') ?? '';
  const atRest = () => ['closed', 'reading', 'ended'].includes(phase());

  const views = () => bookRef.current?.viewCount() ?? 0;
  // cover, dedication, letter, closing words, back cover + the spreads
  const seconds = Math.round((wrapped ? 5 : 2) + ((book.spreads.length + 5) * (DWELL_MS + 1000)) / 1000 + 3);
  const drawnSeconds = filmSeconds(built);

  /** Make the video or long picture from page pictures (no screen sharing). */
  const draw = async () => {
    const ac = new AbortController();
    abort.current = ac;
    setStage({ name: 'running', note: '正在准备页面…', progress: 0 });
    setPressing(true);
    try {
      // let the hidden pages lay out, load their photos and fonts
      await wait(80);
      await until(() => !!pressRef.current?.root(), 4000);
      await document.fonts.ready;
      await wait(500);
      const onProgress = (note: string, progress?: number) => setStage({ name: 'running', note, progress });
      const common = { book, built, press: pressRef.current!, onProgress, signal: ac.signal };
      let file: { blob: Blob; filename: string };
      let text: string;
      if (video) {
        const scene = roomRef.current?.querySelector<HTMLElement>('[data-scene]') ?? null;
        const film = await makeFilm({ ...common, format, scene, sound: book.sound.flip });
        file = { blob: film.blob, filename: `${safe(book.meta.title)}-翻书视频.${film.mp4 ? 'mp4' : 'webm'}` };
        text = film.mp4
          ? `视频做好了（${fmtBytes(film.blob.size)}${film.audio ? '' : '，没有声音'}）。`
          : `视频做好了，是 .webm 格式（${fmtBytes(film.blob.size)}）。微信可能不能直接播放，可以先用剪映等工具转成 MP4。`;
      } else {
        const blob = await makeLongImage(common, `《${book.meta.title || '无题'}》 · 回忆绘本`);
        file = { blob, filename: `${safe(book.meta.title)}-长图.jpg` };
        text = `长图做好了（${fmtBytes(blob.size)}），可以发到微信或朋友圈。`;
      }
      if (!phoneLike()) download(file);
      setStage({ name: 'done', text: phoneLike() ? text : `${text}已开始下载。`, file });
    } catch (err) {
      if (err instanceof FilmCancelled) setStage({ name: 'intro' });
      else setStage({ name: 'error', text: `没能做好：${(err as Error).message}` });
    } finally {
      setPressing(false);
      abort.current = null;
    }
  };

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
          await until(() => !speaking.current, 70000);
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
  // screen capture records this page: nothing on screen while it runs
  const capturing = running && method === 'capture';
  return (
    <main
      ref={roomRef}
      className={`${app.room} ${theme.className} ${styles.room}`}
      style={themeStyle(book)}
      data-ready={ready || undefined}
      data-running={capturing || undefined}
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
        <Book book={book} onOpen={music.start} onView={music.onView} onTurn={music.onTurn} handle={bookRef} recording />
      </div>
      {music.available && !running && <MusicToggle playing={music.playing} onToggle={music.toggle} />}
      {pressing && (
        <PagePress book={book} built={built} W={geo.W} H={geo.H} captionWidth={Math.min(720, (geo.landscape ? geo.W * 2 : geo.W) * 0.88)} handle={pressRef} />
      )}

      {capturing ? (
        // the video records this page too: say nothing on screen (the browser's sharing bar shows it is recording)
        <p className={video ? 'visually-hidden' : styles.live} aria-live="polite">
          {stage.note}
        </p>
      ) : (
        <div className={styles.scrim}>
          <section className={styles.panel} role="dialog" aria-labelledby="rec-title">
            <h1 id="rec-title">{video ? '翻书视频' : '长图'}</h1>
            {stage.name === 'intro' && method === 'capture' && support.ok && (
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
                <p className={styles.aside}>
                  不想共享屏幕？
                  <QuietButton onClick={() => setMethod('draw')}>{video ? '直接生成（可选竖屏）' : '直接生成'}</QuietButton>
                </p>
              </>
            )}
            {stage.name === 'intro' && method === 'draw' && (
              <>
                <p>
                  {video
                    ? `自动翻完整本书，直接生成 MP4 视频${music.available || book.sound.flip ? '（带音乐和翻页声）' : ''}，大约 ${drawnSeconds} 秒。不用共享屏幕，手机上也能做。`
                    : '把封面和每一页拼成一张长图，适合发微信和朋友圈。不用共享屏幕，手机上也能做。'}
                </p>
                {video && (
                  <div className={styles.formats} role="radiogroup" aria-label="画面方向">
                    <QuietButton role="radio" aria-checked={format === 'portrait'} active={format === 'portrait'} onClick={() => setFormat('portrait')}>
                      竖屏 9:16
                      <small>适合手机、视频号</small>
                    </QuietButton>
                    <QuietButton role="radio" aria-checked={format === 'landscape'} active={format === 'landscape'} onClick={() => setFormat('landscape')}>
                      横屏 16:9
                      <small>两页摊开一起看</small>
                    </QuietButton>
                  </div>
                )}
                {inWeChat() && <p data-tone="warn">在微信里不能保存文件：请点右上角「···」，选「在浏览器打开」后再生成。</p>}
                <p className={styles.actions}>
                  <QuietButton className={styles.primary} onClick={() => void draw()}>
                    开始生成
                  </QuietButton>
                  <QuietLink href={backHref}>返回</QuietLink>
                </p>
                <p className={styles.aside}>
                  画面由每一页的图片重新绘制，个别动态效果会和书里不一样。
                  {support.ok && <QuietButton onClick={() => setMethod('capture')}>改用录屏</QuietButton>}
                </p>
              </>
            )}
            {stage.name === 'running' && (
              <>
                <p aria-live="polite">{stage.note}</p>
                <div className={styles.bar} role="progressbar" aria-label="进度" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round((stage.progress ?? 0) * 100)}>
                  <i style={{ width: `${Math.round((stage.progress ?? 0) * 100)}%` }} />
                </div>
                <p className={styles.aside}>生成时请停留在这个页面。</p>
                <p className={styles.actions}>
                  <QuietButton onClick={() => abort.current?.abort()}>取消</QuietButton>
                </p>
              </>
            )}
            {(stage.name === 'done' || stage.name === 'error') && (
              <>
                {stage.name === 'done' && stage.file && <Preview file={stage.file} />}
                <p data-tone={stage.name === 'error' ? 'warn' : undefined}>{stage.text}</p>
                {stage.name === 'done' && stage.file && <SaveButtons file={stage.file} />}
                <p className={styles.actions}>
                  <QuietButton onClick={again}>{stage.name === 'error' ? '再试一次' : video ? '再录一次' : '再做一次'}</QuietButton>
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

/** What was made, to look at before saving. */
function Preview({ file }: { file: { blob: Blob; filename: string } }) {
  const [url, setUrl] = useState<string>();
  useEffect(() => {
    const u = URL.createObjectURL(file.blob);
    setUrl(u);
    return () => URL.revokeObjectURL(u);
  }, [file]);
  if (!url) return null;
  return file.blob.type.startsWith('video/') ? (
    <video className={styles.preview} src={url} controls playsInline preload="metadata" />
  ) : (
    <img className={styles.preview} src={url} alt="长图预览" />
  );
}

/** Save: the phone's share sheet (存储视频, 发给微信好友…) where there is one, and a plain download. */
function SaveButtons({ file }: { file: { blob: Blob; filename: string } }) {
  const shareable = useMemo(() => {
    try {
      const f = new File([file.blob], file.filename, { type: file.blob.type });
      return navigator.canShare?.({ files: [f] }) ? f : null;
    } catch {
      return null;
    }
  }, [file]);
  return (
    <p className={styles.actions}>
      {shareable && (
        <QuietButton className={styles.primary} onClick={() => void navigator.share({ files: [shareable] }).catch(() => undefined)}>
          保存 / 分享
        </QuietButton>
      )}
      <QuietButton className={shareable ? undefined : styles.primary} onClick={() => download(file)}>
        下载文件
      </QuietButton>
    </p>
  );
}

const safe = (s: string) => (s || '无题').replace(/[\\/:*?"<>|\s]+/g, '').slice(0, 40) || '无题';
