import { useEffect, useRef, useState } from 'react';
import type { Spread } from '../../data/schema';
import { assetUrl } from '../../storage/assets';
import { canRecord, finishVoice, micError, VOICE_MAX_SECONDS, VOICE_MAX_UPLOAD, VoiceRecorder } from '../../sound/voice';
import { QuietButton } from '../ui/QuietButton';
import { useEdit } from './EditContext';
import s from './PageOptions.module.css';

type State = { name: 'idle' } | { name: 'recording'; seconds: number } | { name: 'saving' } | { name: 'error'; text: string };

/** Record (or add) a voice note for this page: it plays when the reader turns to it. */
export function VoiceTray({ sp, set }: { sp: Spread; set: (fn: (x: Spread) => void) => void }) {
  const edit = useEdit();
  const [state, setState] = useState<State>({ name: 'idle' });
  const rec = useRef<VoiceRecorder | null>(null);
  const timer = useRef(0);
  const player = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);

  useEffect(
    () => () => {
      window.clearInterval(timer.current);
      rec.current?.cancel();
      player.current?.pause();
    },
    [],
  );

  const save = async (blob: Blob, max: number) => {
    setState({ name: 'saving' });
    try {
      const { file, seconds } = await finishVoice(blob);
      if (seconds > max) {
        setState({ name: 'error', text: `这段录音有 ${Math.round(seconds)} 秒，最长 ${max} 秒。` });
        return;
      }
      const src = await edit?.storeAudio(file);
      if (src) set((x) => void (x.voice = { src, seconds }));
      setState({ name: 'idle' });
    } catch {
      setState({ name: 'error', text: '这段声音读不出来，换一个文件试试。' });
    }
  };

  const start = async () => {
    stopPlaying();
    const r = new VoiceRecorder();
    try {
      await r.start();
    } catch (err) {
      setState({ name: 'error', text: micError(err) });
      return;
    }
    rec.current = r;
    setState({ name: 'recording', seconds: 0 });
    timer.current = window.setInterval(() => {
      const sec = r.seconds;
      if (sec >= VOICE_MAX_SECONDS) void stop();
      else setState({ name: 'recording', seconds: sec });
    }, 200);
  };

  const stop = async () => {
    window.clearInterval(timer.current);
    const r = rec.current;
    rec.current = null;
    if (!r) return;
    const blob = await r.stop();
    await save(blob, VOICE_MAX_SECONDS + 1);
  };

  const upload = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'audio/*';
    input.onchange = () => {
      const f = input.files?.[0];
      if (f) void save(f, VOICE_MAX_UPLOAD);
    };
    input.click();
  };

  const stopPlaying = () => {
    player.current?.pause();
    setPlaying(false);
  };
  const listen = () => {
    if (!sp.voice) return;
    if (playing) return stopPlaying();
    const a = player.current ?? (player.current = new Audio());
    a.src = assetUrl(sp.voice.src);
    a.onended = () => setPlaying(false);
    void a.play().then(() => setPlaying(true)).catch(() => setPlaying(false));
  };

  const fmt = (sec: number) => `${Math.floor(sec / 60)}:${String(Math.floor(sec % 60)).padStart(2, '0')}`;

  return (
    <div className={`${s.tray} ${s.wide}`}>
      {state.name === 'recording' ? (
        <>
          <p className={s.recording} aria-live="polite">
            <i aria-hidden /> 正在录音 {fmt(state.seconds)} / {fmt(VOICE_MAX_SECONDS)}
          </p>
          <QuietButton onClick={() => void stop()}>录好了</QuietButton>
        </>
      ) : state.name === 'saving' ? (
        <p className={s.trayText}>正在保存…</p>
      ) : sp.voice ? (
        <>
          <p className={s.trayText}>这一页有一段 {fmt(sp.voice.seconds)} 的语音留言，读者翻到这页时会自动播放，背景音乐会暂时变小。</p>
          <div className={s.trayRow}>
            <QuietButton onClick={listen}>{playing ? '停止' : '试听'}</QuietButton>
            {canRecord() && <QuietButton onClick={() => void start()}>重录</QuietButton>}
            <QuietButton
              onClick={() => {
                stopPlaying();
                set((x) => void delete x.voice);
              }}
            >
              删除
            </QuietButton>
          </div>
        </>
      ) : (
        <>
          <p className={s.trayText}>录一句想对 TA 说的话（最长 {VOICE_MAX_SECONDS} 秒）。读者翻到这一页时会自动播放。</p>
          <div className={s.trayRow}>
            {canRecord() && <QuietButton onClick={() => void start()}>开始录音</QuietButton>}
            <QuietButton onClick={upload}>上传一段录音</QuietButton>
          </div>
        </>
      )}
      {state.name === 'error' && <p className={s.warn}>{state.text}</p>}
    </div>
  );
}
