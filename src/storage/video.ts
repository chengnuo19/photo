import type { BookImage } from '../data/schema';
import { assetRef, putAsset, thumbRef, type StoredAsset } from './db';
import { encodePicture, newId, registerAsset, type ImportedImage } from './assets';

/**
 * Moving photos: a short clip that loops, silently, on the page (a Live Photo saved as a
 * video, a few seconds of the sea…). Stored small — the first 10 s, no sound, 720 p H.264 —
 * with a still from its first moments as the picture everything else uses (thumbnails, the
 * drawn video, prints), so a clip is just a photo that happens to move.
 */

export const VIDEO_SECONDS = 10;
const VIDEO_EDGE = 720;
const VIDEO_BITRATE = 1_500_000;
/** A clip the browser cannot re-encode is kept as it is, up to this size. */
const RAW_LIMIT = 20 * 1024 * 1024;

export type ImportedVideo = ImportedImage & { motion: NonNullable<BookImage['motion']> };

export const VIDEO_ACCEPT = 'video/*,.mov,.mp4,.m4v,.webm';
export const isVideoFile = (f: File) => f.type.startsWith('video/') || /\.(mov|mp4|m4v|webm)$/i.test(f.name);

export class VideoImportError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'VideoImportError';
  }
}

const even = (n: number) => Math.max(2, Math.round(n / 2) * 2);

export async function importVideo(file: File): Promise<ImportedVideo> {
  let clip: Blob | null = null;
  let still: CanvasImageSource | null = null;
  let size = { w: 0, h: 0 };
  let seconds = 0;

  // 1. re-encode small with WebCodecs (Chrome, Edge, Safari 17+)
  try {
    const mb = await import('mediabunny');
    const input = new mb.Input({ source: new mb.BlobSource(file), formats: mb.ALL_FORMATS });
    const track = await input.getPrimaryVideoTrack();
    if (!track || !(await track.canDecode())) throw new Error('no decodable video');
    const duration = await input.computeDuration();
    seconds = Math.min(VIDEO_SECONDS, duration);
    const scale = Math.min(1, VIDEO_EDGE / Math.max(track.displayWidth, track.displayHeight));
    size = { w: even(track.displayWidth * scale), h: even(track.displayHeight * scale) };
    const sink = new mb.CanvasSink(track, { width: size.w, height: size.h, fit: 'fill', poolSize: 1 });
    still = (await sink.getCanvas(Math.min(0.15, duration / 2)))?.canvas ?? null;
    if (typeof VideoEncoder === 'undefined' || !(await mb.canEncodeVideo('avc', { width: size.w, height: size.h, bitrate: VIDEO_BITRATE }))) {
      throw new Error('cannot encode');
    }
    const target = new mb.BufferTarget();
    const output = new mb.Output({ format: new mb.Mp4OutputFormat({ fastStart: 'in-memory' }), target });
    const conversion = await mb.Conversion.init({
      input,
      output,
      video: { width: size.w, height: size.h, fit: 'fill', codec: 'avc', bitrate: VIDEO_BITRATE, frameRate: 30 },
      audio: { discard: true },
      trim: { start: 0, end: seconds },
    });
    if (!conversion.isValid) throw new Error('conversion not possible');
    await conversion.execute();
    clip = new Blob([target.buffer!], { type: 'video/mp4' });
  } catch {
    clip = null;
  }

  // 2. otherwise keep the file as it is (small ones only), with a still the browser draws
  if (!clip) {
    if (file.size > RAW_LIMIT) throw new VideoImportError(`「${file.name}」太大了，这个浏览器不能压缩视频。请先剪短（10 秒以内）再放进来。`);
    const probe = await probeWithElement(file).catch(() => null);
    if (!probe) throw new VideoImportError(`打不开「${file.name}」：文件可能损坏，或是这个浏览器不支持的格式（如 iPhone 的 HEVC 视频，可以改用 Safari，或先转成 MP4）。`);
    clip = file;
    still = probe.canvas;
    size = { w: probe.canvas.width, h: probe.canvas.height };
    seconds = Math.min(VIDEO_SECONDS, probe.seconds);
  }
  if (!still) {
    const probe = await probeWithElement(clip).catch(() => null);
    if (!probe) throw new VideoImportError(`读不出「${file.name}」的画面。`);
    still = probe.canvas;
  }

  // the still is stored like any photo; the clip rides along
  const bitmap = await createImageBitmap(still as ImageBitmapSource);
  const [picture, thumb] = await Promise.all([encodePicture(bitmap, 2560, 0.86), encodePicture(bitmap, 480, 0.8)]);
  bitmap.close();
  const now = Date.now();
  const photo: StoredAsset = { id: newId(), kind: 'image', blob: picture, thumb, width: size.w, height: size.h, name: file.name, createdAt: now };
  const movie: StoredAsset = { id: newId(), kind: 'video', blob: clip, width: size.w, height: size.h, name: file.name, createdAt: now };
  await putAsset(photo);
  await putAsset(movie);
  registerAsset(photo);
  registerAsset(movie);
  return {
    src: assetRef(photo.id),
    thumb: thumbRef(photo.id),
    width: size.w,
    height: size.h,
    name: file.name,
    takenAt: file.lastModified ? new Date(file.lastModified) : undefined,
    motion: { src: assetRef(movie.id), seconds: Math.round(seconds * 10) / 10 },
  };
}

/** Length and a still of a clip, using the browser's own player. */
function probeWithElement(blob: Blob): Promise<{ seconds: number; canvas: HTMLCanvasElement }> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(blob);
    const v = document.createElement('video');
    v.muted = true;
    v.playsInline = true;
    v.preload = 'auto';
    const done = (fn: () => void) => {
      window.clearTimeout(timer);
      fn();
      v.removeAttribute('src');
      v.load();
      URL.revokeObjectURL(url);
    };
    const timer = window.setTimeout(() => done(() => reject(new Error('timeout'))), 15000);
    v.onerror = () => done(() => reject(new Error('cannot play')));
    v.onloadeddata = () => {
      v.currentTime = Math.min(0.15, (v.duration || 1) / 2);
    };
    v.onseeked = () =>
      done(() => {
        const scale = Math.min(1, VIDEO_EDGE / Math.max(v.videoWidth, v.videoHeight));
        const c = document.createElement('canvas');
        c.width = even(v.videoWidth * scale);
        c.height = even(v.videoHeight * scale);
        c.getContext('2d')!.drawImage(v, 0, 0, c.width, c.height);
        resolve({ seconds: Number.isFinite(v.duration) ? v.duration : VIDEO_SECONDS, canvas: c });
      });
    v.src = url;
  });
}
