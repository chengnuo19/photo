/**
 * Voice notes: record a few words from the microphone (or take a recording the author already
 * has) and store it as AAC (.m4a), which every phone plays — Chrome records WebM/Opus, which
 * older iPhones cannot.
 */

export const VOICE_MAX_SECONDS = 60;
/** Longest recording accepted from a file. */
export const VOICE_MAX_UPLOAD = 180;

const MIMES = ['audio/mp4', 'audio/webm;codecs=opus', 'audio/webm', 'audio/ogg;codecs=opus'];

export function canRecord() {
  return typeof MediaRecorder !== 'undefined' && !!navigator.mediaDevices?.getUserMedia;
}

export class VoiceRecorder {
  private rec?: MediaRecorder;
  private stream?: MediaStream;
  private chunks: Blob[] = [];
  private t0 = 0;

  /** Asks for the microphone (the browser shows its own prompt). */
  async start() {
    this.stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true } });
    const mimeType = MIMES.find((m) => MediaRecorder.isTypeSupported?.(m));
    this.rec = new MediaRecorder(this.stream, mimeType ? { mimeType, audioBitsPerSecond: 96_000 } : undefined);
    this.chunks = [];
    this.rec.ondataavailable = (e) => e.data.size && this.chunks.push(e.data);
    this.rec.start(250);
    this.t0 = performance.now();
  }

  get seconds() {
    return this.t0 ? (performance.now() - this.t0) / 1000 : 0;
  }

  stop(): Promise<Blob> {
    const rec = this.rec;
    if (!rec) return Promise.reject(new Error('not recording'));
    return new Promise((resolve) => {
      rec.onstop = () => {
        this.release();
        resolve(new Blob(this.chunks, { type: rec.mimeType || 'audio/webm' }));
      };
      rec.stop();
    });
  }

  cancel() {
    try {
      this.rec?.stop();
    } catch {
      /* not started */
    }
    this.release();
  }

  private release() {
    this.stream?.getTracks().forEach((t) => t.stop());
    this.stream = undefined;
  }
}

/** Why the microphone could not be used, in words a person can act on. */
export function micError(err: unknown) {
  const name = (err as { name?: string })?.name ?? '';
  if (name === 'NotAllowedError' || name === 'SecurityError') return '没有得到麦克风权限。请在浏览器地址栏左侧允许使用麦克风，再试一次。';
  if (name === 'NotFoundError') return '没有找到麦克风。';
  return '无法录音：' + ((err as Error)?.message || name || '未知错误');
}

/**
 * Turn a recording into the stored voice note: its length, and AAC in an .m4a when the
 * browser can encode it (else the original file).
 */
export async function finishVoice(blob: Blob, name = '留言'): Promise<{ file: File; seconds: number }> {
  const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  const ctx = new Ctx();
  let buf: AudioBuffer;
  try {
    buf = await ctx.decodeAudioData(await blob.arrayBuffer());
  } finally {
    void ctx.close();
  }
  const seconds = Math.round(buf.duration * 10) / 10;
  const plain = () => new File([blob], `${name}.${blob.type.includes('mp4') ? 'm4a' : blob.type.includes('ogg') ? 'ogg' : blob.type.includes('mpeg') ? 'mp3' : 'webm'}`, { type: blob.type.split(';')[0] || 'audio/webm' });
  // already something every phone plays
  if (/^audio\/(mp4|mpeg|aac|x-m4a)/.test(blob.type)) return { file: plain(), seconds };
  try {
    const mb = await import('mediabunny');
    const channels = Math.min(2, buf.numberOfChannels);
    const ok = typeof AudioEncoder !== 'undefined' && (await mb.canEncodeAudio('aac', { numberOfChannels: channels, sampleRate: buf.sampleRate, bitrate: 96_000 }).catch(() => false));
    if (!ok) return { file: plain(), seconds };
    const target = new mb.BufferTarget();
    const output = new mb.Output({ format: new mb.Mp4OutputFormat({ fastStart: 'in-memory' }), target });
    const src = new mb.AudioBufferSource({ codec: 'aac', bitrate: 96_000 });
    output.addAudioTrack(src);
    await output.start();
    await src.add(buf);
    await output.finalize();
    return { file: new File([target.buffer!], `${name}.m4a`, { type: 'audio/mp4' }), seconds };
  } catch {
    return { file: plain(), seconds };
  }
}
