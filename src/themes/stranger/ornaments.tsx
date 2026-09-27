/**
 * Stranger Things: 1980s small-town objects and the Upside Down, drawn from scratch
 * (no characters, no logo).
 */
import type { CSSProperties } from 'react';

type P = { className?: string; style?: CSSProperties };
export const BULB_COLORS = ['#ff3b30', '#ffcc00', '#34c759', '#0a84ff', '#ff9500', '#bf5af2', '#ff2d55'];

export function Bulb({ className, style, color = '#ff3b30', lit = true }: P & { color?: string; lit?: boolean }) {
  return (
    <svg className={className} style={style} viewBox="0 0 30 50" aria-hidden>
      {lit && <ellipse cx="15" cy="32" rx="15" ry="18" fill={color} opacity="0.35" />}
      <rect x="10" y="2" width="10" height="11" rx="1.5" fill="#2c3a2c" />
      <path d="M15 12 C4 16 5 34 15 46 C25 34 26 16 15 12Z" fill={color} opacity={lit ? 1 : 0.5} />
      <ellipse cx="11.5" cy="24" rx="2.5" ry="5" fill="#fff" opacity="0.45" />
    </svg>
  );
}

export function WalkieTalkie({ className, style }: P) {
  return (
    <svg className={className} style={style} viewBox="0 0 50 110" aria-hidden>
      <rect x="32" y="2" width="6" height="36" rx="3" fill="#1d1d1d" />
      <rect x="6" y="30" width="38" height="76" rx="6" fill="#2b2b2b" />
      <rect x="11" y="38" width="28" height="30" rx="3" fill="#1a1a1a" />
      {Array.from({ length: 5 }, (_, i) => (
        <rect key={i} x="14" y={42 + i * 5} width="22" height="2" fill="#444" />
      ))}
      <circle cx="17" cy="80" r="4" fill="#d33" />
      <rect x="25" y="76" width="12" height="8" rx="2" fill="#555" />
      <rect x="11" y="90" width="28" height="10" rx="2" fill="#3a3a3a" />
    </svg>
  );
}

export function Bicycle({ className, style }: P) {
  return (
    <svg className={className} style={style} viewBox="0 0 140 80" aria-hidden>
      <g stroke="#1a1a1a" strokeWidth="4" fill="none" strokeLinecap="round">
        <circle cx="30" cy="52" r="24" />
        <circle cx="110" cy="52" r="24" />
        <path d="M30 52 L56 22 L96 22 L110 52 M56 22 L70 52 L30 52 M96 22 L102 8 M92 8 L112 10 M56 22 L52 14 M46 14 H60" />
      </g>
      <rect x="98" y="-2" width="30" height="16" rx="2" fill="none" stroke="#1a1a1a" strokeWidth="2.5" transform="translate(-4 8)" />
      <circle cx="70" cy="52" r="4" fill="#1a1a1a" />
    </svg>
  );
}

export function Waffle({ className, style }: P) {
  return (
    <svg className={className} style={style} viewBox="0 0 80 80" aria-hidden>
      <circle cx="40" cy="40" r="36" fill="#d99a3e" stroke="#a8691f" strokeWidth="3" />
      <clipPath id="wf">
        <circle cx="40" cy="40" r="32" />
      </clipPath>
      <g clipPath="url(#wf)" fill="#b97a2a">
        {Array.from({ length: 6 }, (_, i) =>
          Array.from({ length: 6 }, (_, j) => <rect key={`${i}${j}`} x={9 + i * 11} y={9 + j * 11} width="7" height="7" rx="1" />),
        )}
      </g>
      <path d="M30 30 q10 -6 20 2 q-4 8 -12 8 q-10 -2 -8 -10Z" fill="#fff4d6" opacity="0.9" />
    </svg>
  );
}

export function Boombox({ className, style }: P) {
  return (
    <svg className={className} style={style} viewBox="0 0 140 80" aria-hidden>
      <path d="M40 14 V4 H100 V14" stroke="#222" strokeWidth="4" fill="none" />
      <rect x="4" y="14" width="132" height="62" rx="6" fill="#bdb6aa" stroke="#333" strokeWidth="2" />
      <circle cx="32" cy="48" r="20" fill="#2b2b2b" />
      <circle cx="32" cy="48" r="8" fill="#555" />
      <circle cx="108" cy="48" r="20" fill="#2b2b2b" />
      <circle cx="108" cy="48" r="8" fill="#555" />
      <rect x="56" y="26" width="28" height="18" rx="2" fill="#3a3a3a" />
      <circle cx="63" cy="35" r="4" fill="#bdb6aa" />
      <circle cx="77" cy="35" r="4" fill="#bdb6aa" />
      <rect x="56" y="52" width="28" height="4" fill="#d33" />
    </svg>
  );
}

export function Flashlight({ className, style }: P) {
  return (
    <svg className={className} style={style} viewBox="0 0 140 50" aria-hidden>
      <path d="M86 12 L138 0 L138 50 L86 38Z" fill="#fff6c8" opacity="0.5" />
      <rect x="4" y="16" width="60" height="18" rx="4" fill="#2d3a55" />
      <path d="M62 10 H86 V40 H62Z" fill="#3c4b6b" />
      <rect x="18" y="20" width="10" height="10" rx="2" fill="#c33" />
    </svg>
  );
}

export function Token({ className, style }: P) {
  return (
    <svg className={className} style={style} viewBox="0 0 60 60" aria-hidden>
      <circle cx="30" cy="30" r="27" fill="#d9b44a" stroke="#9a7a1c" strokeWidth="3" />
      <circle cx="30" cy="30" r="19" fill="none" stroke="#9a7a1c" strokeWidth="1.5" strokeDasharray="3 2" />
      <text x="30" y="36" textAnchor="middle" fontFamily="VT323, monospace" fontSize="18" fill="#6e5410">
        25¢
      </text>
    </svg>
  );
}

export function D20({ className, style }: P) {
  return (
    <svg className={className} style={style} viewBox="0 0 70 70" aria-hidden>
      <polygon points="35,3 65,20 65,50 35,67 5,50 5,20" fill="#7a1a8f" stroke="#3a0a45" strokeWidth="2" />
      <polygon points="35,16 55,50 15,50" fill="#9a2bb3" stroke="#3a0a45" strokeWidth="1.5" />
      <path d="M35 3 L35 16 M65 20 L55 50 M5 20 L15 50 M65 50 L55 50 M5 50 L15 50 M35 67 L35 50 M35 16 L65 20 M35 16 L5 20" stroke="#3a0a45" strokeWidth="1.4" />
      <text x="35" y="44" textAnchor="middle" fontFamily="Georgia, serif" fontWeight="700" fontSize="14" fill="#fff">20</text>
    </svg>
  );
}

export function TownSign({ className, style, text = '欢迎来到小镇' }: P & { text?: string }) {
  return (
    <svg className={className} style={style} viewBox="0 0 160 110" aria-hidden>
      <rect x="30" y="60" width="6" height="50" fill="#4a3a2a" />
      <rect x="124" y="60" width="6" height="50" fill="#4a3a2a" />
      <rect x="6" y="6" width="148" height="62" rx="6" fill="#2f5a3a" stroke="#e9e1cf" strokeWidth="3" />
      <text x="80" y="34" textAnchor="middle" fontFamily="Noto Serif SC, serif" fontSize="15" fill="#e9e1cf">{text}</text>
      <text x="80" y="54" textAnchor="middle" fontFamily="Georgia, serif" fontSize="9" fill="#e9e1cf" letterSpacing="2">POP. 30,000</text>
    </svg>
  );
}

export function OldTV({ className, style }: P) {
  return (
    <svg className={className} style={style} viewBox="0 0 110 100" aria-hidden>
      <path d="M40 18 L28 2 M70 18 L84 2" stroke="#333" strokeWidth="3" />
      <rect x="4" y="18" width="102" height="72" rx="8" fill="#6b4a2c" />
      <rect x="12" y="26" width="70" height="56" rx="10" fill="#3b3f46" />
      <rect x="16" y="30" width="62" height="48" rx="8" fill="#8fb3c4" opacity="0.65" />
      {Array.from({ length: 8 }, (_, i) => (
        <rect key={i} x="16" y={32 + i * 6} width="62" height="2" fill="#fff" opacity="0.25" />
      ))}
      <circle cx="94" cy="40" r="5" fill="#2b2b2b" />
      <circle cx="94" cy="58" r="5" fill="#2b2b2b" />
      <rect x="18" y="90" width="10" height="8" fill="#3a2a1a" />
      <rect x="82" y="90" width="10" height="8" fill="#3a2a1a" />
    </svg>
  );
}

/** A red lightning crack. */
/** Build a filled, tapering stroke along a polyline (thick at the root, thin at the tip). */
function taper(pts: [number, number][], w0: number, w1: number) {
  const L: string[] = [];
  const R: string[] = [];
  pts.forEach(([x, y], i) => {
    const [px, py] = pts[Math.max(0, i - 1)];
    const [nx, ny] = pts[Math.min(pts.length - 1, i + 1)];
    let dx = nx - px;
    let dy = ny - py;
    const len = Math.hypot(dx, dy) || 1;
    dx /= len;
    dy /= len;
    const w = (w0 + (w1 - w0) * (i / (pts.length - 1))) / 2;
    L.push(`${(x - dy * w).toFixed(2)} ${(y + dx * w).toFixed(2)}`);
    R.push(`${(x + dy * w).toFixed(2)} ${(y - dx * w).toFixed(2)}`);
  });
  return `M${L.join(' L')} L${R.reverse().join(' L')} Z`;
}

function rng(seed: number) {
  let s = seed;
  return () => ((s = (s * 9301 + 49297) % 233280) / 233280);
}

/** Red lightning with a trunk and two forks, glowing. Drawn from the top. */
export function Lightning({ className, style, seed = 1 }: P & { seed?: number }) {
  const r = rng(seed * 131 + 7);
  const walk = (x: number, y: number, steps: number, dx: number, len: number) => {
    const pts: [number, number][] = [[x, y]];
    for (let i = 0; i < steps; i++) {
      x += dx + (r() - 0.5) * 16;
      y += len * (0.7 + r() * 0.6);
      pts.push([x, y]);
    }
    return pts;
  };
  const trunk = walk(60, 0, 9, -2.5, 13);
  const f1 = walk(...trunk[3], 4, 6, 9);
  const f2 = walk(...trunk[6], 3, -7, 8);
  const bolts = [
    { d: taper(trunk, 3.6, 0.4), core: taper(trunk, 1.2, 0.2) },
    { d: taper(f1, 2, 0.3), core: taper(f1, 0.7, 0.1) },
    { d: taper(f2, 1.6, 0.3), core: taper(f2, 0.6, 0.1) },
  ];
  return (
    <svg className={className} style={style} viewBox="0 0 120 130" aria-hidden>
      {bolts.map((b, i) => (
        <g key={i}>
          <path d={b.d} fill="#ff1f1f" opacity="0.28" stroke="#ff1f1f" strokeWidth="4" strokeLinejoin="round" />
          <path d={b.d} fill="#ff4a3a" />
          <path d={b.core} fill="#ffe2da" opacity="0.8" />
        </g>
      ))}
    </svg>
  );
}

/** Upside Down vines: fleshy tendrils creeping in from a corner, with nodules. */
export function Vines({ className, style, seed = 2 }: P & { seed?: number }) {
  const r = rng(seed * 71 + 3);
  const tendrils = Array.from({ length: 5 }, (_, k) => {
    let x = -4 + r() * 10;
    let y = 104 - r() * 8;
    let a = -0.35 - k * 0.22 - r() * 0.2; // angle, up and to the right
    const pts: [number, number][] = [[x, y]];
    const n = 9 + Math.floor(r() * 4);
    const step = 6 + r() * 3 - k * 0.5;
    for (let i = 0; i < n; i++) {
      a += (r() - 0.5) * 0.7;
      x += Math.cos(a) * step;
      y += Math.sin(a) * step;
      pts.push([x, y]);
    }
    return { pts, w: 7 - k * 0.9 };
  });
  return (
    <svg className={className} style={style} viewBox="0 0 100 100" aria-hidden>
      {tendrils.map((t, i) => (
        <g key={i}>
          <path d={taper(t.pts, t.w, 0.4)} fill="#2a0e12" />
          <path d={taper(t.pts, t.w * 0.45, 0.2)} fill="#8a2a30" opacity="0.85" transform="translate(-0.4 -0.6)" />
          {t.pts.slice(1, -2).filter((_, j) => j % 3 === 1).map(([x, y], j) => (
            <circle key={j} cx={x} cy={y} r={Math.max(0.8, t.w * 0.3 - j * 0.3)} fill="#3d1418" stroke="#7c2a2f" strokeWidth="0.3" />
          ))}
        </g>
      ))}
    </svg>
  );
}
