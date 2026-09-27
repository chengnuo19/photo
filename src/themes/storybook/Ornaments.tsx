/**
 * Small hand-drawn ornaments for the "storybook" theme.
 * Deliberately a little irregular — they should look drawn, not like icons.
 */
import type { CSSProperties } from 'react';

interface OrnProps {
  size?: number;
  color?: string;
  style?: CSSProperties;
  className?: string;
}

/** Four-point sparkle. */
export function Sparkle({ size = 14, color = '#e36d5a', style, className }: OrnProps) {
  return (
    <svg className={className} style={style} width={size} height={size} viewBox="0 0 20 20" aria-hidden>
      <path d="M10 0.8 C10.9 6.6 13.4 9.1 19.2 10 C13.4 10.9 10.9 13.4 10 19.2 C9.1 13.4 6.6 10.9 0.8 10 C6.6 9.1 9.1 6.6 10 0.8Z" fill={color} />
    </svg>
  );
}

/** Soft five-point star, slightly lopsided. */
export function Star({ size = 14, color = '#e8453c', style, className }: OrnProps) {
  return (
    <svg className={className} style={style} width={size} height={size} viewBox="0 0 24 24" aria-hidden>
      <path
        d="M12 1.5 L14.6 8.4 L22 8.9 L16.3 13.6 L18.2 21 L12 16.9 L5.6 21.1 L7.7 13.7 L2 8.8 L9.4 8.3 Z"
        fill={color}
        stroke={color}
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Starburst ("spark") like the purple one on the reference cover. */
export function Burst({ size = 18, color = '#8a6fd6', style, className }: OrnProps) {
  const rays = Array.from({ length: 8 }, (_, i) => {
    const a = (i * Math.PI) / 4;
    const r1 = i % 2 ? 5 : 3;
    return `M${12 + Math.cos(a) * r1} ${12 + Math.sin(a) * r1} L${12 + Math.cos(a) * 11} ${12 + Math.sin(a) * 11}`;
  }).join(' ');
  return (
    <svg className={className} style={style} width={size} height={size} viewBox="0 0 24 24" aria-hidden>
      <path d={rays} stroke={color} strokeWidth="2.4" strokeLinecap="round" />
      <circle cx="12" cy="12" r="3.4" fill={color} />
    </svg>
  );
}

/** Tiny airplane seen from above. */
export function Plane({ size = 26, color = '#3a3f4a', style, className }: OrnProps) {
  return (
    <svg className={className} style={style} width={size} height={size * 0.6} viewBox="0 0 40 24" aria-hidden>
      <path
        d="M2 12 C8 10.6 16 10.4 36 11.2 C38.4 11.4 38.6 12.6 36 12.8 C16 13.6 8 13.4 2 12Z"
        fill="#f7f5ef"
        stroke={color}
        strokeWidth="1.1"
      />
      <path d="M17 11.2 L11 2.5 L14.5 2.5 L24 11.3 Z M17 12.8 L11 21.5 L14.5 21.5 L24 12.7 Z" fill="#f7f5ef" stroke={color} strokeWidth="1.1" strokeLinejoin="round" />
      <path d="M4 11.6 L1.5 7 L4 7 L7.5 11.4 Z M4 12.4 L1.5 17 L4 17 L7.5 12.6 Z" fill="#f7f5ef" stroke={color} strokeWidth="1" strokeLinejoin="round" />
    </svg>
  );
}

const BEADS = [
  { c: '#b9a6e6', r: 7 },
  { c: '#86b6e8', r: 6 },
  { c: '#9fd3c7', r: 7.5 },
  { c: '#f2a7bf', r: 6 },
  { c: '#a4a6f0', r: 7 },
  { c: '#f5d58a', r: 5.5 },
  { c: '#7fc6b6', r: 7 },
  { c: '#f09aa8', r: 6.5 },
  { c: '#b7d88c', r: 6 },
  { c: '#c9a8ea', r: 7 },
];

/**
 * A bead string with a small plane charm, drawn along a gentle curve.
 * `width` is in px; the string is ~22% as tall as it is wide.
 */
export function BeadString({ width = 260, style, className, seed = 0 }: OrnProps & { width?: number; seed?: number }) {
  const h = width * 0.24;
  const n = 15;
  const pts = Array.from({ length: n }, (_, i) => {
    const t = i / (n - 1);
    const x = 8 + t * (width - 16);
    const y = h * 0.62 - Math.sin(t * Math.PI * 1.15 + 0.3) * h * 0.34;
    return { x, y };
  });
  const path = pts.map((p, i) => `${i ? 'L' : 'M'}${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
  const charmAt = 6;
  return (
    <svg className={className} style={style} width={width} height={h} viewBox={`0 0 ${width} ${h}`} aria-hidden>
      <path d={path} stroke="#8d8577" strokeWidth="1" fill="none" />
      {pts.map((p, i) => {
        if (i === charmAt) {
          return (
            <g key={i} transform={`translate(${p.x - 12} ${p.y - 7}) rotate(-8 12 7)`}>
              <path d="M0 7 C6 5.6 12 5.4 24 6.2 C25.6 6.4 25.6 7.6 24 7.8 C12 8.6 6 8.4 0 7Z" fill="#2f3440" />
              <path d="M10 6.2 L6 0.5 L8.6 0.5 L15 6.3 Z M10 7.8 L6 13.5 L8.6 13.5 L15 7.7 Z" fill="#2f3440" />
            </g>
          );
        }
        const b = BEADS[(i + seed) % BEADS.length];
        const s = (i + seed) % 3 === 0;
        return s ? (
          <rect key={i} x={p.x - b.r} y={p.y - b.r * 0.8} width={b.r * 2} height={b.r * 1.6} rx={b.r * 0.7} fill={b.c} />
        ) : (
          <g key={i}>
            <circle cx={p.x} cy={p.y} r={b.r} fill={b.c} />
            <circle cx={p.x - b.r * 0.35} cy={p.y - b.r * 0.35} r={b.r * 0.3} fill="#fff" opacity="0.55" />
          </g>
        );
      })}
    </svg>
  );
}

/** Layered rose / peony — the cover's centrepiece. */
export function Bloom({ size = 150, style, className }: OrnProps) {
  const rings = [
    { r: 46, n: 9, c: '#f6b9c6', rot: 0 },
    { r: 38, n: 8, c: '#f09bb0', rot: 18 },
    { r: 30, n: 7, c: '#ea7f98', rot: 6 },
    { r: 21, n: 6, c: '#e0677f', rot: 30 },
    { r: 12, n: 5, c: '#d25470', rot: 12 },
  ];
  return (
    <svg className={className} style={style} width={size} height={size} viewBox="-60 -60 120 120" aria-hidden>
      <defs>
        <radialGradient id="bloom-glow" r="0.6">
          <stop offset="0" stopColor="#fbd9e0" />
          <stop offset="1" stopColor="#fbd9e0" stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle r="58" fill="url(#bloom-glow)" />
      {rings.map((ring, k) => (
        <g key={k} transform={`rotate(${ring.rot})`}>
          {Array.from({ length: ring.n }, (_, i) => {
            const a = (360 / ring.n) * i;
            return (
              <path
                key={i}
                transform={`rotate(${a})`}
                d={`M0 0 C${ring.r * 0.55} ${-ring.r * 0.25} ${ring.r * 0.5} ${-ring.r * 1.02} 0 ${-ring.r} C${-ring.r * 0.5} ${-ring.r * 1.02} ${-ring.r * 0.55} ${-ring.r * 0.25} 0 0Z`}
                fill={ring.c}
                stroke="#c9536d"
                strokeOpacity="0.25"
                strokeWidth="0.8"
              />
            );
          })}
        </g>
      ))}
      <circle r="5" fill="#f3c24e" />
      <circle r="2.4" fill="#e39a2c" />
    </svg>
  );
}

/**
 * Torn paper strip along the top edge of illustration pages, with doodles.
 * Spans the whole spread; each page shows its half (see ImagePage).
 */
export function TornEdge({ seed = 1 }: { seed?: number }) {
  // deterministic jagged edge
  let s = seed * 9301 + 49297;
  const rand = () => ((s = (s * 9301 + 49297) % 233280) / 233280);
  const W = 1000;
  const pts: string[] = [];
  for (let x = 0; x <= W; x += 6 + rand() * 10) {
    pts.push(`${x.toFixed(1)} ${(34 + rand() * 7 - (rand() > 0.9 ? 4 : 0)).toFixed(1)}`);
  }
  const d = `M0 0 L${W} 0 L${W} 36 L${pts.reverse().join(' L')} L0 36 Z`;
  return (
    <svg viewBox={`0 0 ${W} 60`} preserveAspectRatio="none" width="100%" height="100%" aria-hidden>
      <defs>
        <filter id={`torn-shadow-${seed}`} x="-2%" y="-20%" width="104%" height="160%">
          <feDropShadow dx="0" dy="1.2" stdDeviation="1.2" floodColor="#3b2a18" floodOpacity="0.28" />
        </filter>
      </defs>
      <path d={d} fill="var(--paper)" filter={`url(#torn-shadow-${seed})`} />
    </svg>
  );
}

/** Dotted flight path with a plane and a few sparkles, laid over the torn strip. */
export function FlightDoodle() {
  return (
    <svg viewBox="0 0 1000 60" preserveAspectRatio="xMidYMid meet" width="100%" height="100%" aria-hidden>
      <path
        d="M40 22 C180 30 260 12 380 20 C470 26 520 30 560 22"
        stroke="#9aa3b5"
        strokeWidth="1.2"
        strokeDasharray="2 5"
        strokeLinecap="round"
        fill="none"
      />
      <path d="M640 22 C760 14 880 30 965 18" stroke="#9aa3b5" strokeWidth="1.2" strokeDasharray="2 5" strokeLinecap="round" fill="none" />
      <g transform="translate(560 12) scale(0.55)">
        <path d="M2 12 C8 10.6 16 10.4 36 11.2 C38.4 11.4 38.6 12.6 36 12.8 C16 13.6 8 13.4 2 12Z" fill="#f7f5ef" stroke="#3a3f4a" strokeWidth="1.6" />
        <path d="M17 11.2 L11 2.5 L14.5 2.5 L24 11.3 Z M17 12.8 L11 21.5 L14.5 21.5 L24 12.7 Z" fill="#f7f5ef" stroke="#3a3f4a" strokeWidth="1.6" strokeLinejoin="round" />
      </g>
      {[
        [120, 14, '#f2c230'],
        [300, 30, '#9fd3c7'],
        [455, 12, '#f09aa8'],
        [720, 30, '#b9a6e6'],
        [860, 12, '#f2c230'],
      ].map(([x, y, c], i) => (
        <path
          key={i}
          transform={`translate(${x} ${y}) scale(0.42)`}
          d="M10 0.8 C10.9 6.6 13.4 9.1 19.2 10 C13.4 10.9 10.9 13.4 10 19.2 C9.1 13.4 6.6 10.9 0.8 10 C6.6 9.1 9.1 6.6 10 0.8Z"
          fill={c as string}
        />
      ))}
    </svg>
  );
}
