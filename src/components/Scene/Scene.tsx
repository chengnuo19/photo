import { createContext, useContext, useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { computeBookSize } from '../../hooks/useBookSize';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { play } from '../../sound/engine';
import type { Theme } from '../../themes/types';
import s from './Scene.module.css';

interface SceneCtx {
  theme: Theme;
  sound: boolean;
  mode: 'read' | 'edit';
}
const Ctx = createContext<SceneCtx | null>(null);

/**
 * The room around the book. Themes draw into it with `Backdrop`, `Prop` and `Egg`.
 *
 * The scene knows where the book will be (same maths as the book itself) and exposes the free
 * margins as CSS variables, so props can tuck in under the book's edges on any screen:
 *   --side   free space left / right of the open spread (px)
 *   --top    free space above the book, --bottom below it
 *   --page-h the book's height
 * Pointer movement nudges props by depth (`--mx`, `--my` in −1…1) for a little parallax.
 */
export function Scene({ theme, mode, sound }: { theme: Theme; mode: 'read' | 'edit'; sound: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const [portrait, setPortrait] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => {
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const b = computeBookSize(vw, vh);
      const bw = b.layout === 'landscape' ? b.pageWidth * 2 : b.pageWidth;
      const top = b.layout === 'landscape' ? Math.max(56, vh * 0.075) : Math.max(48, vh * 0.08);
      const bottom = b.layout === 'landscape' ? Math.max(84, vh * 0.1) : Math.max(72, vh * 0.12);
      const freeV = vh - top - bottom - b.pageHeight;
      el.style.setProperty('--side', `${Math.max(0, (vw - bw) / 2)}px`);
      el.style.setProperty('--top', `${top + freeV / 2}px`);
      el.style.setProperty('--bottom', `${bottom + freeV / 2}px`);
      el.style.setProperty('--page-h', `${b.pageHeight}px`);
      setPortrait(b.layout === 'portrait');
    };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el || reduced || mode !== 'read' || !window.matchMedia('(pointer: fine)').matches) return;
    let raf = 0;
    const onMove = (e: PointerEvent) => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        el.style.setProperty('--mx', ((e.clientX / window.innerWidth) * 2 - 1).toFixed(3));
        el.style.setProperty('--my', ((e.clientY / window.innerHeight) * 2 - 1).toFixed(3));
      });
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('pointermove', onMove);
    };
  }, [reduced, mode]);

  const C = theme.scene;
  if (!C) return null;
  return (
    <div ref={ref} className={s.scene} data-mode={mode} data-portrait={portrait || undefined} data-reduced={reduced || undefined} aria-hidden={mode === 'edit' || undefined}>
      <Ctx.Provider value={{ theme, sound, mode }}>
        <C mode={mode} sound={sound} />
      </Ctx.Provider>
    </div>
  );
}

/** Full-bleed layer behind everything (texture, light pool, vignette). Always shown. */
export function Backdrop({ className, style, children }: { className?: string; style?: CSSProperties; children?: ReactNode }) {
  return (
    <div className={`${s.backdrop} ${className ?? ''}`} style={style}>
      {children}
    </div>
  );
}

type Corner = 'tl' | 'tr' | 'bl' | 'br' | 'l' | 'r' | 't' | 'b';

export interface PropProps {
  /** Which edge / corner of the screen the prop is anchored to. */
  at: Corner;
  /** Offsets from that edge (any CSS length; may use var(--side) etc.). */
  x?: string;
  y?: string;
  /** Width (CSS length). The art keeps its aspect ratio. */
  w: string;
  rot?: number;
  /**
   * 0 = lying on the table by the book (sharp, moves least);
   * 1 = a little closer; 2 = out-of-focus foreground (blurred, moves most).
   */
  depth?: 0 | 1 | 2;
  /** 1 = always (landscape); 2 = hidden on smaller screens; 3 = only on large screens. */
  tier?: 1 | 2 | 3;
  /** Also show on phones / portrait (keep these small). */
  mobile?: boolean;
  className?: string;
  children: ReactNode;
}

/** An object on the table around the book. Only drawn while reading. */
export function Prop({ at, x = '0px', y = '0px', w, rot = 0, depth = 0, tier = 1, mobile, className, children }: PropProps) {
  const ctx = useContext(Ctx);
  if (ctx?.mode === 'edit') return null;
  const style: Record<string, string> = { width: w, '--rot': `${rot}deg`, '--depth': String(depth) };
  const h = at.includes('l') ? 'left' : at.includes('r') ? 'right' : undefined;
  const v = at.includes('t') ? 'top' : at.includes('b') ? 'bottom' : undefined;
  if (h) style[h] = x;
  if (v) style[v] = y;
  if (!h) style.left = `calc(50% + ${x})`;
  if (!v) style.top = `calc(50% + ${y})`;
  return (
    <div className={`${s.prop} ${className ?? ''}`} data-at={at} data-depth={depth} data-tier={tier} data-mobile={mobile || undefined} style={style as CSSProperties}>
      {children}
    </div>
  );
}

/**
 * A clickable easter egg inside a prop. Plays the theme's egg sound and sets `data-play`
 * for `duration` ms, so CSS can animate it (`.egg[data-play] …`).
 */
export function Egg({ id, label, duration = 1600, className, children, onPlay }: { id: string; label: string; duration?: number; className?: string; children: ReactNode; onPlay?: () => void }) {
  const ctx = useContext(Ctx);
  const [playing, setPlaying] = useState(0);
  useEffect(() => {
    if (!playing) return;
    const t = window.setTimeout(() => setPlaying(0), duration);
    return () => window.clearTimeout(t);
  }, [playing, duration]);
  if (ctx?.mode === 'edit') return <>{children}</>;
  return (
    <button
      type="button"
      className={`${s.egg} ${className ?? ''}`}
      data-play={playing ? playing % 2 ? 'a' : 'b' : undefined}
      aria-label={label}
      title={label}
      onClick={() => {
        setPlaying((n) => n + 1);
        if (ctx?.sound) play(ctx.theme.sound?.egg?.[id]);
        onPlay?.();
      }}
    >
      {children}
    </button>
  );
}

/* ------------------------------------------------------------------ textures
 * Small SVG tiles (noise filters) used as CSS backgrounds: the browser rasterises each tile once. */

const svgUrl = (svg: string) => `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;

/** Fine grain for paper / plaster / film. */
export const grain = (opacity = 0.5, freq = 0.9, size = 220) =>
  svgUrl(
    `<svg xmlns='http://www.w3.org/2000/svg' width='${size}' height='${size}'><filter id='n' x='0' y='0' width='100%' height='100%'><feTurbulence type='fractalNoise' baseFrequency='${freq}' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 ${opacity} 0'/></filter><rect width='100%' height='100%' filter='url(#n)'/></svg>`,
  );

/**
 * Long wood grain (horizontal), tinted `rgb` (0–1 channels). One wide tile so seams stay off-screen;
 * `planks` adds faint board joints every `planks` px.
 */
export const woodGrain = (opacity = 0.35, rgb: [number, number, number] = [0.35, 0.22, 0.1], planks = 0) => {
  const [r, g, b] = rgb;
  const w = 2400;
  const h = planks || 600;
  return svgUrl(
    `<svg xmlns='http://www.w3.org/2000/svg' width='${w}' height='${h}'><filter id='w' x='0' y='0' width='100%' height='100%'><feTurbulence type='fractalNoise' baseFrequency='0.0016 0.06' numOctaves='3' seed='7' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 ${r}  0 0 0 0 ${g}  0 0 0 0 ${b}  0 0 0 ${(opacity * 2.4).toFixed(3)} -${(opacity * 0.9).toFixed(3)}'/></filter><rect width='100%' height='100%' filter='url(#w)'/>${
      planks ? `<rect y='${h - 1.5}' width='100%' height='1.5' fill='rgb(${r * 255},${g * 255},${b * 255})' opacity='${opacity * 0.8}'/>` : ''
    }</svg>`,
  );
};

/** Soft cloudy mottling (plaster, watercolour, sky). */
export const mottle = (opacity = 0.3, freq = 0.012, size = 700, seed = 3) =>
  svgUrl(
    `<svg xmlns='http://www.w3.org/2000/svg' width='${size}' height='${size}'><filter id='m' x='0' y='0' width='100%' height='100%'><feTurbulence type='fractalNoise' baseFrequency='${freq}' numOctaves='4' seed='${seed}' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 ${opacity * 2} -${opacity * 0.6}'/></filter><rect width='100%' height='100%' filter='url(#m)'/></svg>`,
  );

/** Raw SVG markup as a CSS background url. */
export const tile = svgUrl;
