/**
 * Wednesday: gothic boarding-school ephemera, all original drawings (no characters).
 * Mostly black ink so it prints on grey, bone and violet paper alike.
 */
import type { CSSProperties } from 'react';

type P = { className?: string; style?: CSSProperties };
const INK = 'var(--ink, #151515)';

export function Crow({ className, style, perched = true }: P & { perched?: boolean }) {
  if (!perched) {
    return (
      <svg className={className} style={style} viewBox="0 0 80 30" aria-hidden>
        <path d="M2 14 Q20 -2 40 12 Q60 -2 78 14 Q60 8 44 18 L40 24 L36 18 Q20 8 2 14Z" fill={INK} />
      </svg>
    );
  }
  return (
    <svg className={className} style={style} viewBox="0 0 90 70" aria-hidden>
      <g fill={INK}>
        <path d="M22 40 C18 26 32 16 48 20 C60 22 66 32 62 44 C58 52 44 56 30 52 L6 60 L18 48Z" />
        <circle cx="62" cy="22" r="10" />
        <path d="M70 20 L86 24 L70 27Z" />
        <path d="M40 54 L38 66 M48 54 L50 66" stroke={INK} strokeWidth="2.4" />
        <path d="M30 66 H58" stroke={INK} strokeWidth="2" />
      </g>
      <circle cx="64" cy="20" r="1.8" fill="#e9e6e0" />
    </svg>
  );
}

export function DeadRose({ className, style }: P) {
  return (
    <svg className={className} style={style} viewBox="0 0 60 130" aria-hidden>
      <path d="M30 128 C28 100 34 80 30 50" stroke="#2b2b2b" strokeWidth="2.6" fill="none" />
      <path d="M31 96 q14 -8 20 -2 q-8 10 -20 2Z M30 78 q-14 -8 -20 -2 q8 10 20 2Z" fill="#3a3a36" />
      <path d="M31 88 l6 -3 M29 70 l-5 -3" stroke="#2b2b2b" strokeWidth="1.4" />
      <g transform="translate(30 38)">
        <path d="M0 14 C-18 12 -20 -8 -8 -14 C-2 -20 8 -20 12 -12 C22 -6 16 12 0 14Z" fill="#3c0a12" />
        <path d="M-6 -8 C0 -14 8 -10 6 -2 C4 6 -6 6 -8 0Z" fill="#5b1520" />
        <path d="M-2 -4 q4 -3 5 2" stroke="#240409" strokeWidth="1.4" fill="none" />
        <path d="M10 10 l6 6 M-12 8 l-5 7" stroke="#3c0a12" strokeWidth="2" />
      </g>
      <path d="M44 60 l4 10 M16 58 l-3 9" stroke="#3c0a12" strokeWidth="1.6" opacity="0.7" />
    </svg>
  );
}

export function Cello({ className, style }: P) {
  return (
    <svg className={className} style={style} viewBox="0 0 60 160" aria-hidden>
      <path d="M22 60 C4 60 2 86 16 96 C0 106 2 138 30 140 C58 138 60 106 44 96 C58 86 56 60 38 60Z" fill="#2a1414" />
      <rect x="27" y="4" width="6" height="92" fill="#150a0a" />
      <path d="M26 2 q4 -6 8 0 q2 6 -2 8 h-4 q-4 -2 -2 -8Z" fill="#150a0a" />
      <path d="M22 92 q0 -6 4 -10 M38 92 q0 -6 -4 -10" stroke="#5a3a3a" strokeWidth="2" fill="none" />
      <rect x="22" y="112" width="16" height="3" fill="#150a0a" />
      <line x1="30" y1="140" x2="30" y2="158" stroke="#150a0a" strokeWidth="2" />
    </svg>
  );
}

export function Typewriter({ className, style }: P) {
  return (
    <svg className={className} style={style} viewBox="0 0 110 80" aria-hidden>
      <rect x="28" y="2" width="54" height="30" fill="#efece6" stroke={INK} strokeWidth="1.5" />
      <path d="M34 12 h40 M34 18 h32 M34 24 h36" stroke={INK} strokeWidth="1" opacity="0.5" />
      <rect x="10" y="28" width="90" height="12" rx="5" fill="#1b1b1b" />
      <path d="M8 40 H102 L96 74 H14Z" fill="#232323" />
      {Array.from({ length: 3 }, (_, r) =>
        Array.from({ length: 9 - r }, (_, i) => <circle key={`${r}${i}`} cx={22 + r * 4 + i * 9} cy={50 + r * 8} r="3" fill="#dcd8cf" />),
      )}
      <rect x="34" y="72" width="42" height="4" fill="#dcd8cf" />
    </svg>
  );
}

export function Spider({ className, style }: P) {
  return (
    <svg className={className} style={style} viewBox="0 0 60 90" aria-hidden>
      <line x1="30" y1="0" x2="30" y2="40" stroke={INK} strokeWidth="0.8" />
      <g stroke={INK} strokeWidth="2" fill="none" strokeLinecap="round">
        {[-1, 1].map((d) =>
          [0, 1, 2, 3].map((k) => <path key={`${d}${k}`} d={`M30 ${50 + k * 3} q${d * 12} ${-10 + k * 6} ${d * 22} ${-2 + k * 9}`} />),
        )}
      </g>
      <ellipse cx="30" cy="56" rx="8" ry="10" fill={INK} />
      <circle cx="30" cy="44" r="5" fill={INK} />
    </svg>
  );
}

export function Umbrella({ className, style }: P) {
  return (
    <svg className={className} style={style} viewBox="0 0 90 100" aria-hidden>
      <path d="M4 40 Q45 -12 86 40 Q75 32 65 40 Q55 32 45 40 Q35 32 25 40 Q15 32 4 40Z" fill="#121212" />
      <line x1="45" y1="6" x2="45" y2="86" stroke="#121212" strokeWidth="3" />
      <path d="M45 86 q0 10 -9 10 q-7 0 -7 -8" stroke="#121212" strokeWidth="3" fill="none" />
    </svg>
  );
}

export function Candelabra({ className, style }: P) {
  return (
    <svg className={className} style={style} viewBox="0 0 90 120" aria-hidden>
      <g fill="#1a1a1a">
        <rect x="42" y="50" width="6" height="58" />
        <path d="M24 116 h42 l-8 -8 h-26Z" />
        <path d="M45 66 C20 66 14 52 14 40 M45 66 C70 66 76 52 76 40" stroke="#1a1a1a" strokeWidth="4" fill="none" />
        <rect x="10" y="36" width="8" height="5" />
        <rect x="41" y="44" width="8" height="5" />
        <rect x="72" y="36" width="8" height="5" />
      </g>
      {[
        [14, 18, 18],
        [45, 20, 24],
        [76, 22, 14],
      ].map(([x, h, y]) => (
        <g key={x}>
          <rect x={x - 3.5} y={y} width="7" height={h} fill="#ece7da" />
          <path d={`M${x - 3.5} ${y + 4} q2 5 0 9`} stroke="#d8d2c2" strokeWidth="1.4" fill="none" />
          <ellipse cx={x} cy={y - 6} rx="3" ry="6" fill="#f3c65a" />
        </g>
      ))}
    </svg>
  );
}

/** An original academy crest: shield, crow, crossed keys, banner. */
export function Crest({ className, style, motto = 'NEVERMORE' }: P & { motto?: string }) {
  return (
    <svg className={className} style={style} viewBox="0 0 120 140" aria-hidden>
      <path d="M60 6 L108 20 C108 70 92 104 60 124 C28 104 12 70 12 20Z" fill="none" stroke={INK} strokeWidth="3" />
      <path d="M60 14 L100 26 C100 70 86 98 60 116 C34 98 20 70 20 26Z" fill="none" stroke={INK} strokeWidth="1" />
      <g stroke={INK} strokeWidth="3" fill="none">
        <path d="M36 88 L84 40 M84 88 L36 40" />
        <circle cx="33" cy="91" r="5" />
        <circle cx="87" cy="91" r="5" />
      </g>
      <g transform="translate(40 34) scale(0.45)" fill={INK}>
        <path d="M22 40 C18 26 32 16 48 20 C60 22 66 32 62 44 C58 52 44 56 30 52 L6 60 L18 48Z" />
        <circle cx="62" cy="22" r="10" />
        <path d="M70 20 L86 24 L70 27Z" />
      </g>
      <path d="M8 118 Q60 108 112 118 L106 132 Q60 124 14 132Z" fill="#efece6" stroke={INK} strokeWidth="1.5" />
      <text x="60" y="126" textAnchor="middle" fontFamily="UnifrakturMaguntia, serif" fontSize="10" fill={INK}>
        {motto}
      </text>
    </svg>
  );
}

export function Skull({ className, style }: P) {
  return (
    <svg className={className} style={style} viewBox="0 0 60 70" aria-hidden>
      <path d="M30 4 C12 4 6 18 8 30 C9 38 14 40 14 46 L16 56 H44 L46 46 C46 40 51 38 52 30 C54 18 48 4 30 4Z" fill="#ece8df" stroke={INK} strokeWidth="2" />
      <ellipse cx="21" cy="30" rx="6" ry="7" fill={INK} />
      <ellipse cx="39" cy="30" rx="6" ry="7" fill={INK} />
      <path d="M30 38 l-4 8 h8Z" fill={INK} />
      <path d="M20 56 v8 M26 56 v10 M34 56 v10 M40 56 v8" stroke={INK} strokeWidth="2" />
    </svg>
  );
}

export function RainWindow({ className, style }: P) {
  return (
    <svg className={className} style={style} viewBox="0 0 70 100" aria-hidden>
      <path d="M6 96 V36 A29 29 0 0 1 64 36 V96Z" fill="#9aa1ad" stroke="#151515" strokeWidth="5" />
      <path d="M35 8 V96 M6 50 H64" stroke="#151515" strokeWidth="3" />
      {[14, 24, 44, 54].map((x, i) => (
        <path key={x} d={`M${x} ${30 + i * 8} l-2 12`} stroke="#e8ecf0" strokeWidth="1.2" opacity="0.8" />
      ))}
    </svg>
  );
}

/** Spider-web lace for a corner (top-left orientation; rotate for others). */
export function WebCorner({ className, style }: P) {
  const rings = [18, 32, 46, 60];
  return (
    <svg className={className} style={style} viewBox="0 0 64 64" aria-hidden>
      <g stroke={INK} strokeWidth="1.1" fill="none" opacity="0.9">
        {[0, 22.5, 45, 67.5, 90].map((a) => (
          <line key={a} x1="0" y1="0" x2={64 * Math.cos((a * Math.PI) / 180)} y2={64 * Math.sin((a * Math.PI) / 180)} />
        ))}
        {rings.map((r) => (
          <path
            key={r}
            d={[0, 22.5, 45, 67.5, 90]
              .map((a, i) => `${i ? 'Q' + (r * 0.8 * Math.cos(((a - 11) * Math.PI) / 180)).toFixed(1) + ' ' + (r * 0.8 * Math.sin(((a - 11) * Math.PI) / 180)).toFixed(1) + ' ' : 'M'}${(r * Math.cos((a * Math.PI) / 180)).toFixed(1)} ${(r * Math.sin((a * Math.PI) / 180)).toFixed(1)}`)
              .join(' ')}
          />
        ))}
      </g>
    </svg>
  );
}

/** Dripping wax along a top edge. */
export function Drips({ className, style, seed = 3 }: P & { seed?: number }) {
  let s = seed * 97;
  const r = () => ((s = (s * 9301 + 49297) % 233280) / 233280);
  let d = 'M0 0 H200 V6';
  for (let x = 200; x > 0; x -= 8 + r() * 14) {
    const len = r() > 0.6 ? 10 + r() * 26 : 4 + r() * 4;
    d += ` L${x.toFixed(1)} 6 L${(x - 2).toFixed(1)} ${len.toFixed(1)} Q${(x - 4).toFixed(1)} ${(len + 4).toFixed(1)} ${(x - 6).toFixed(1)} ${len.toFixed(1)} L${(x - 8).toFixed(1)} 6`;
  }
  d += ' L0 6Z';
  return (
    <svg className={className} style={style} viewBox="0 0 200 40" preserveAspectRatio="none" aria-hidden>
      <path d={d} fill="#efece4" stroke="rgba(0,0,0,0.12)" strokeWidth="0.6" />
    </svg>
  );
}
