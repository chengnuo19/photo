import { useEffect, useRef, useState, type PointerEvent as RPointerEvent } from 'react';
import { createPortal } from 'react-dom';
import type { Signature } from '../../data/schema';
import styles from './Signature.module.css';

const W = 600;
const H = 220;
const PEN = 3.2;

/** The signature on the letter, in the page's ink (an SVG path: sharp in print, any colour). */
export function SignatureMark({ signature, className }: { signature?: Signature; className?: string }) {
  if (!signature?.d) return null;
  return (
    <svg className={`${styles.mark} ${className ?? ''}`} viewBox={`0 0 ${signature.w} ${signature.h}`} role="img" aria-label="手写签名">
      <path d={signature.d} fill="none" stroke="currentColor" strokeWidth={PEN} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

type Pt = [number, number];

/** Smooth a stroke: quadratic curves through the midpoints of its points. */
function strokePath(pts: Pt[]) {
  const f = (n: number) => Math.round(n * 10) / 10;
  if (!pts.length) return '';
  if (pts.length < 3) return `M${f(pts[0][0])} ${f(pts[0][1])}L${f(pts[pts.length - 1][0] + 0.1)} ${f(pts[pts.length - 1][1])}`;
  let d = `M${f(pts[0][0])} ${f(pts[0][1])}`;
  for (let i = 1; i < pts.length - 1; i++) {
    const mx = (pts[i][0] + pts[i + 1][0]) / 2;
    const my = (pts[i][1] + pts[i + 1][1]) / 2;
    d += `Q${f(pts[i][0])} ${f(pts[i][1])} ${f(mx)} ${f(my)}`;
  }
  const last = pts[pts.length - 1];
  return d + `L${f(last[0])} ${f(last[1])}`;
}

/** Trim the strokes to their own size (plus a little margin) and make the stored signature. */
function finish(strokes: Pt[][]): Signature | null {
  const all = strokes.flat();
  if (!all.length) return null;
  const pad = PEN * 2;
  const x0 = Math.max(0, Math.min(...all.map((p) => p[0])) - pad);
  const y0 = Math.max(0, Math.min(...all.map((p) => p[1])) - pad);
  const x1 = Math.min(W, Math.max(...all.map((p) => p[0])) + pad);
  const y1 = Math.min(H, Math.max(...all.map((p) => p[1])) + pad);
  const moved = strokes.map((s) => s.map(([x, y]) => [x - x0, y - y0] as Pt));
  return { d: moved.map(strokePath).join(''), w: Math.round(x1 - x0), h: Math.round(y1 - y0) };
}

/** Sign with a finger, a pen or the mouse. */
export function SignaturePad({ initial, onSave, onClose }: { initial?: Signature; onSave: (s: Signature | undefined) => void; onClose: () => void }) {
  const [strokes, setStrokes] = useState<Pt[][]>([]);
  const current = useRef<Pt[] | null>(null);
  const [, redraw] = useState(0);
  const svg = useRef<SVGSVGElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const at = (e: RPointerEvent): Pt => {
    const r = svg.current!.getBoundingClientRect();
    return [((e.clientX - r.left) / r.width) * W, ((e.clientY - r.top) / r.height) * H];
  };
  const down = (e: RPointerEvent<SVGSVGElement>) => {
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    current.current = [at(e)];
    redraw((n) => n + 1);
  };
  const move = (e: RPointerEvent<SVGSVGElement>) => {
    const c = current.current;
    if (!c) return;
    const p = at(e);
    const last = c[c.length - 1];
    if (Math.hypot(p[0] - last[0], p[1] - last[1]) < 1.5) return;
    c.push(p);
    redraw((n) => n + 1);
  };
  const up = () => {
    const c = current.current;
    current.current = null;
    if (c) setStrokes((s) => [...s, c]);
  };

  const live = current.current ? [...strokes, current.current] : strokes;
  const empty = !live.length;

  // on <body>: the editor's option bar is transformed, which would pin a fixed overlay to it
  return createPortal(
    <div className={styles.scrim} role="dialog" aria-modal="true" aria-label="手写签名" onPointerDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className={styles.sheet}>
        <p className={styles.title}>在下面写上你的名字</p>
        <svg
          ref={svg}
          className={styles.pad}
          viewBox={`0 0 ${W} ${H}`}
          onPointerDown={down}
          onPointerMove={move}
          onPointerUp={up}
          onPointerCancel={up}
          data-empty={empty || undefined}
        >
          <line x1="40" x2={W - 40} y1={H - 54} y2={H - 54} className={styles.line} />
          {empty && initial?.d && (
            <g transform={`translate(${(W - initial.w) / 2} ${(H - initial.h) / 2})`} className={styles.ghost}>
              <path d={initial.d} fill="none" stroke="currentColor" strokeWidth={PEN} strokeLinecap="round" strokeLinejoin="round" />
            </g>
          )}
          {live.map((s, i) => (
            <path key={i} d={strokePath(s)} fill="none" stroke="currentColor" strokeWidth={PEN} strokeLinecap="round" strokeLinejoin="round" />
          ))}
        </svg>
        <div className={styles.actions}>
          <button type="button" onClick={() => setStrokes((s) => s.slice(0, -1))} disabled={!strokes.length}>
            撤销一笔
          </button>
          <button type="button" onClick={() => setStrokes([])} disabled={!strokes.length}>
            清空
          </button>
          {initial?.d && (
            <button type="button" onClick={() => (onSave(undefined), onClose())}>
              去掉签名
            </button>
          )}
          <span className={styles.spacer} />
          <button type="button" onClick={onClose}>
            取消
          </button>
          <button
            type="button"
            className={styles.primary}
            disabled={!strokes.length}
            onClick={() => {
              const sig = finish(strokes);
              if (sig) onSave(sig);
              onClose();
            }}
          >
            放到信上
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
