import { useRef, useState, type PointerEvent as RPointerEvent } from 'react';
import type { PageSpec } from '../../data/buildPages';
import type { Sticker } from '../../data/schema';
import { activeDecor, findSticker } from '../../themes';
import { hashId, useTheme } from '../../themes/context';
import { SpreadLayer } from '../../themes/kit/SpreadLayer';
import { useBookEdits } from '../../themes/shared';
import s from './Layers.module.css';

/** The spread's chosen decoration (tape, postmarks, fairy lights…), drawn on each of its pages. */
export function DecorLayer({ page }: { page: PageSpec }) {
  const theme = useTheme();
  if (!page.spread) return null;
  const opt = activeDecor(theme, page.spread);
  if (!opt?.Component) return null;
  const C = opt.Component;
  return (
    <div className={s.decor} aria-hidden>
      <C page={page} seed={hashId(page.spread.id)} />
    </div>
  );
}

/** Stickers placed on the spread. Editable in the editor: drag, rotate/scale from the corner, ×. */
export function StickerLayer({ page }: { page: PageSpec }) {
  const e = useBookEdits();
  const stickers = page.spread?.stickers;
  if (!page.spread || !stickers?.length) return null;
  const sid = page.spread.id;
  const update = (id: string, patch: Partial<Sticker> | null) =>
    e.spread(sid, (x) => {
      if (!x.stickers) return;
      if (patch === null) x.stickers = x.stickers.filter((st) => st.id !== id);
      else x.stickers = x.stickers.map((st) => (st.id === id ? { ...st, ...patch } : st));
    });
  return (
    <SpreadLayer part={page.part} className={s.stickers}>
      {stickers.map((st) => (
        <StickerView key={st.id} sticker={st} editing={e.editing} onChange={(p) => update(st.id, p)} />
      ))}
    </SpreadLayer>
  );
}

function StickerArt({ src }: { src: string }) {
  const theme = useTheme();
  if (src.startsWith('theme:')) {
    const found = findSticker(src.slice(6), theme);
    if (!found) return null;
    const C = found.Component;
    return <C className={s.art} />;
  }
  return <img className={s.art} src={src} alt="" draggable={false} />;
}

function StickerView({ sticker, editing, onChange }: { sticker: Sticker; editing: boolean; onChange: (p: Partial<Sticker> | null) => void }) {
  const [live, setLive] = useState<Partial<Sticker> | null>(null);
  const drag = useRef<{
    mode: 'move' | 'turn';
    px: number;
    py: number;
    w: number;
    h: number;
    cx: number;
    cy: number;
    a0: number;
    d0: number;
    st: Sticker;
  } | null>(null);
  const cur = { ...sticker, ...live };

  const begin = (mode: 'move' | 'turn') => (ev: RPointerEvent<HTMLElement>) => {
    if (!editing || ev.button !== 0) return;
    ev.stopPropagation();
    ev.preventDefault();
    const layer = (ev.currentTarget.closest('[data-part]') as HTMLElement).getBoundingClientRect();
    const cx = layer.left + sticker.x * layer.width;
    const cy = layer.top + sticker.y * layer.height;
    drag.current = {
      mode,
      px: ev.clientX,
      py: ev.clientY,
      w: layer.width,
      h: layer.height,
      cx,
      cy,
      a0: Math.atan2(ev.clientY - cy, ev.clientX - cx),
      d0: Math.hypot(ev.clientX - cx, ev.clientY - cy) || 1,
      st: sticker,
    };
    (ev.currentTarget as HTMLElement).setPointerCapture(ev.pointerId);
  };
  const move = (ev: RPointerEvent<HTMLElement>) => {
    const d = drag.current;
    if (!d) return;
    if (d.mode === 'move') {
      setLive({
        x: Math.min(1, Math.max(0, d.st.x + (ev.clientX - d.px) / d.w)),
        y: Math.min(1, Math.max(0, d.st.y + (ev.clientY - d.py) / d.h)),
      });
    } else {
      const a = Math.atan2(ev.clientY - d.cy, ev.clientX - d.cx);
      const dist = Math.hypot(ev.clientX - d.cx, ev.clientY - d.cy);
      setLive({
        rot: d.st.rot + ((a - d.a0) * 180) / Math.PI,
        scale: Math.min(0.6, Math.max(0.03, (d.st.scale * dist) / d.d0)),
      });
    }
  };
  const end = () => {
    if (drag.current && live) onChange(live);
    drag.current = null;
    setLive(null);
  };

  return (
    <div
      className={s.sticker}
      data-editing={editing || undefined}
      data-active={!!live || undefined}
      style={{ left: `${cur.x * 100}%`, top: `${cur.y * 100}%`, width: `${cur.scale * 100}%`, transform: `translate(-50%, -50%) rotate(${cur.rot}deg)` }}
      onPointerDown={begin('move')}
      onPointerMove={move}
      onPointerUp={end}
      onPointerCancel={end}
    >
      <StickerArt src={sticker.src} />
      {editing && (
        <>
          <button type="button" className={s.remove} aria-label="删除贴纸" onPointerDown={(ev) => ev.stopPropagation()} onClick={() => onChange(null)}>
            ×
          </button>
          <span className={s.handle} aria-label="旋转和缩放" onPointerDown={begin('turn')} onPointerMove={move} onPointerUp={end} onPointerCancel={end} />
        </>
      )}
    </div>
  );
}
