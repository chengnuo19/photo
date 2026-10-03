import { useEffect, useRef, useState } from 'react';
import { PLATFORM_NAMES, parseSongLink } from '../../data/musicLink';
import type { ChapterMusic, MusicChoice } from '../../data/schema';
import { BookAudio, type TrackSpec } from '../../sound/music';
import { trackOf } from '../../sound/sections';
import { assetUrl } from '../../storage/assets';
import type { Theme } from '../../themes/types';
import { QuietButton } from '../ui/QuietButton';
import styles from './MusicPicker.module.css';

type Kind = MusicChoice['kind'];
type FileMusic = Extract<MusicChoice, { kind: 'file' }>;

const LABELS: Record<Kind, string> = { theme: '主题音乐', file: '上传的歌', link: '音乐 App 里的歌', none: '不要音乐' };

/**
 * Choose what plays: the theme's own music, a song file (with where it starts), a song link
 * that opens in the reader's music app, or nothing. Used for the whole book and per chapter.
 */
export function MusicPicker<T extends MusicChoice | ChapterMusic>({
  value,
  theme,
  onChange,
  pickFile,
  allowLink = true,
  inheritLabel,
}: {
  /** undefined = the default (the theme's music, or "keep playing" for a chapter). */
  value: T | undefined;
  theme: Theme;
  onChange: (v: T | undefined) => void;
  /** Ask for a song file; resolves to its stored source and name. */
  pickFile: () => Promise<{ src: string; title: string } | null>;
  allowLink?: boolean;
  /** For chapters: an extra choice "keep playing what was playing" (= undefined). */
  inheritLabel?: string;
}) {
  const kind: Kind | 'inherit' = value?.kind ?? (inheritLabel ? 'inherit' : 'theme');
  const hasScore = !!theme.sound?.music;
  const [linkText, setLinkText] = useState('');
  const [linkError, setLinkError] = useState('');
  const preview = usePreview();

  const kinds: Kind[] = allowLink ? ['theme', 'file', 'link', 'none'] : ['theme', 'file', 'none'];
  const choose = async (k: Kind | 'inherit') => {
    preview.stop();
    if (k === 'inherit') return onChange(undefined);
    if (k === 'theme') return onChange({ kind: 'theme' } as T);
    if (k === 'none') return onChange({ kind: 'none' } as T);
    if (k === 'file') {
      if (value?.kind === 'file') return;
      const f = await pickFile();
      if (f) onChange({ kind: 'file', src: f.src, title: f.title } as T);
      return;
    }
    if (value?.kind !== 'link') {
      setLinkText('');
      onChange({ kind: 'link', url: '', platform: 'other' } as T);
    }
  };

  return (
    <div className={styles.picker}>
      <div className={styles.kinds} role="radiogroup" aria-label="音乐">
        {inheritLabel && (
          <QuietButton role="radio" aria-checked={kind === 'inherit'} active={kind === 'inherit'} onClick={() => void choose('inherit')}>
            {inheritLabel}
          </QuietButton>
        )}
        {kinds.map((k) => (
          <QuietButton key={k} role="radio" aria-checked={kind === k} active={kind === k} onClick={() => void choose(k)}>
            {LABELS[k]}
          </QuietButton>
        ))}
      </div>

      {kind === 'theme' && (
        <div className={styles.body}>
          <p className={styles.note}>
            {hasScore ? `「${theme.name}」自带的音乐：浏览器现场合成，不占流量，也没有版权问题。` : '这个主题没有自带音乐。'}
          </p>
          {hasScore && <Listen preview={preview} make={() => trackOf({ kind: 'theme' }, theme)} />}
        </div>
      )}

      {value?.kind === 'file' && (
        <FileSettings value={value} onChange={(v) => onChange(v as T)} pickFile={pickFile} preview={preview} />
      )}

      {value?.kind === 'link' && (
        <div className={styles.body}>
          {value.url ? (
            <p className={styles.current}>
              {value.title ? `《${value.title}》` : '一首歌'} · {PLATFORM_NAMES[value.platform]}
            </p>
          ) : null}
          <label className={styles.field}>
            <span>在音乐 App 里点"分享 → 复制链接"，粘贴到这里：</span>
            <textarea
              rows={2}
              value={linkText}
              placeholder="分享歌手的单曲《歌名》: https://…"
              onChange={(e) => {
                setLinkText(e.target.value);
                const parsed = parseSongLink(e.target.value);
                setLinkError(e.target.value.trim() && !parsed ? '没找到链接，请粘贴包含 https:// 的分享内容' : '');
                if (parsed) onChange({ kind: 'link', ...parsed, title: parsed.title ?? value.title } as T);
              }}
            />
          </label>
          {value.url && (
            <label className={styles.field}>
              <span>歌名（显示给读者）</span>
              <input value={value.title ?? ''} maxLength={60} onChange={(e) => onChange({ ...value, title: e.target.value || undefined } as T)} />
            </label>
          )}
          {linkError && <p className={styles.warn}>{linkError}</p>}
          <p className={styles.note}>
            读者打开书后，会看到"在{PLATFORM_NAMES[value.platform]}里播放"，用自己手机上的 App 听完整版（会员歌曲也行）。书里不再放别的音乐；翻书视频里改用主题音乐。
          </p>
        </div>
      )}
    </div>
  );
}

function FileSettings({
  value,
  onChange,
  pickFile,
  preview,
}: {
  value: FileMusic;
  onChange: (v: FileMusic) => void;
  pickFile: () => Promise<{ src: string; title: string } | null>;
  preview: Preview;
}) {
  const [duration, setDuration] = useState(0);
  const url = assetUrl(value.src);
  useEffect(() => {
    if (!url) return;
    const a = new Audio();
    a.preload = 'metadata';
    const on = () => setDuration(Number.isFinite(a.duration) ? a.duration : 0);
    a.addEventListener('loadedmetadata', on);
    a.src = url;
    return () => {
      a.removeEventListener('loadedmetadata', on);
      a.removeAttribute('src');
    };
  }, [url]);
  const start = value.start ?? 0;
  const max = Math.max(0, Math.floor(duration - 10));
  const spec = (): TrackSpec => ({ kind: 'file', src: url, start: value.start });
  return (
    <div className={styles.body}>
      <p className={styles.current}>当前：{value.title || '一首歌'}</p>
      {max > 0 && (
        <label className={styles.field}>
          <span>
            从 {fmt(start)} 开始播放{start ? '' : '（开头）'}
          </span>
          <input
            type="range"
            min={0}
            max={max}
            step={1}
            value={Math.min(start, max)}
            onChange={(e) => onChange({ ...value, start: Number(e.target.value) || undefined })}
            onPointerUp={(e) => preview.play({ kind: 'file', src: url, start: Number(e.currentTarget.value) }, 12)}
            onKeyUp={(e) => preview.play({ kind: 'file', src: url, start: Number(e.currentTarget.value) }, 12)}
          />
        </label>
      )}
      <div className={styles.row}>
        <Listen preview={preview} make={spec} />
        <QuietButton
          onClick={async () => {
            preview.stop();
            const f = await pickFile();
            if (f) onChange({ kind: 'file', src: f.src, title: f.title });
          }}
        >
          换一首
        </QuietButton>
      </div>
      <p className={styles.note}>拖动滑块可以直接从副歌开始；读到书的最后，音乐会慢慢淡出。</p>
    </div>
  );
}

const fmt = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

/* ------------------------------------------------------------------ preview */

type Preview = ReturnType<typeof usePreview>;

function usePreview() {
  const cur = useRef<{ audio: BookAudio; timer: number } | null>(null);
  const [on, setOn] = useState(false);
  const stop = () => {
    const c = cur.current;
    if (!c) return;
    cur.current = null;
    window.clearTimeout(c.timer);
    c.audio.toggle(); // fade out
    window.setTimeout(() => c.audio.dispose(), 700);
    setOn(false);
  };
  const play = (spec: TrackSpec, seconds = 15) => {
    stop();
    const audio = new BookAudio({ p: spec }, 'p');
    audio.start();
    cur.current = { audio, timer: window.setTimeout(stop, seconds * 1000) };
    setOn(true);
  };
  useEffect(() => stop, []); // eslint-disable-line react-hooks/exhaustive-deps
  return { on, play, stop };
}

function Listen({ preview, make }: { preview: Preview; make: () => TrackSpec }) {
  return (
    <QuietButton onClick={() => (preview.on ? preview.stop() : preview.play(make()))} aria-pressed={preview.on}>
      {preview.on ? '停止试听' : '试听'}
    </QuietButton>
  );
}
