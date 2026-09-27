/**
 * Vintage travel journal: hand-drawn (original) ephemera — postmarks, tickets, tags, stamps.
 * Colours read theme tokens where it matters so palettes carry through.
 */
import type { CSSProperties } from 'react';

type P = { className?: string; style?: CSSProperties };
const INK = 'var(--ink, #2e241b)';
const RED = 'var(--accent, #b5402f)';

/** Round postmark with wavy cancellation lines. */
export function Postmark({ className, style, text = 'TRAVEL · POST', date = '' }: P & { text?: string; date?: string }) {
  return (
    <svg className={className} style={style} viewBox="0 0 150 70" aria-hidden>
      <g fill="none" stroke={RED} strokeWidth="2" opacity="0.72">
        <circle cx="35" cy="35" r="29" />
        <circle cx="35" cy="35" r="21" strokeWidth="1" />
        {[20, 30, 40, 50].map((y) => (
          <path key={y} d={`M68 ${y} q10 -5 20 0 t20 0 t20 0 t20 0`} />
        ))}
      </g>
      <defs>
        <path id="pm-arc" d="M11 35 a24 24 0 1 1 48 0" />
      </defs>
      <text fontFamily="Special Elite, monospace" fontSize="8" fill={RED} opacity="0.8" letterSpacing="1.5">
        <textPath href="#pm-arc">{text}</textPath>
      </text>
      <text x="35" y="39" textAnchor="middle" fontFamily="Special Elite, monospace" fontSize="9" fill={RED} opacity="0.85">
        {date}
      </text>
    </svg>
  );
}

export function Compass({ className, style }: P) {
  return (
    <svg className={className} style={style} viewBox="0 0 80 80" aria-hidden>
      <circle cx="40" cy="40" r="36" fill="#e9dcc0" stroke={INK} strokeWidth="2" />
      <circle cx="40" cy="40" r="29" fill="none" stroke={INK} strokeWidth="0.8" strokeDasharray="1 3" />
      <path d="M40 10 L46 40 L40 70 L34 40Z" fill={INK} opacity="0.15" />
      <path d="M40 12 L45 40 L35 40Z" fill={RED} />
      <path d="M40 68 L45 40 L35 40Z" fill={INK} />
      <circle cx="40" cy="40" r="3" fill="#e9dcc0" stroke={INK} />
      <text x="40" y="9" textAnchor="middle" fontSize="7" fontFamily="Special Elite, monospace" fill={INK}>N</text>
    </svg>
  );
}

export function LuggageTag({ className, style }: P) {
  return (
    <svg className={className} style={style} viewBox="0 0 70 110" aria-hidden>
      <path d="M35 2 C30 10 20 12 18 20" fill="none" stroke="#a0845a" strokeWidth="1.6" />
      <path d="M12 22 L35 8 L58 22 L58 104 L12 104Z" fill="#e3c68f" stroke="#9f7f4d" strokeWidth="1.2" />
      <circle cx="35" cy="22" r="4.5" fill="#f5ecd8" stroke="#9f7f4d" />
      <rect x="18" y="40" width="34" height="1" fill={INK} opacity="0.4" />
      <rect x="18" y="52" width="34" height="1" fill={INK} opacity="0.4" />
      <rect x="18" y="64" width="34" height="1" fill={INK} opacity="0.4" />
      <text x="35" y="86" textAnchor="middle" fontFamily="Special Elite, monospace" fontSize="8" fill={RED}>BAGGAGE</text>
    </svg>
  );
}

export function AirmailStamp({ className, style }: P) {
  return (
    <svg className={className} style={style} viewBox="0 0 70 84" aria-hidden>
      <defs>
        <pattern id="perf" width="7" height="7" patternUnits="userSpaceOnUse">
          <circle cx="3.5" cy="3.5" r="2.2" fill="#fff" />
        </pattern>
      </defs>
      <rect width="70" height="84" fill="#fbf6ea" />
      <rect x="6" y="6" width="58" height="72" fill="#3f6c8f" />
      <path d="M14 58 L35 22 L56 58 Z" fill="#f2e3c0" opacity="0.9" />
      <path d="M22 40 L50 34 L52 37 L24 44Z" fill="#fbf6ea" />
      <text x="35" y="72" textAnchor="middle" fontFamily="Special Elite, monospace" fontSize="7" fill="#fbf6ea">PAR AVION</text>
      <text x="58" y="16" textAnchor="end" fontFamily="Special Elite, monospace" fontSize="8" fill="#fbf6ea">8</text>
      <rect x="0" y="0" width="70" height="3" fill="url(#perf)" />
    </svg>
  );
}

export function MapPin({ className, style }: P) {
  return (
    <svg className={className} style={style} viewBox="0 0 40 60" aria-hidden>
      <path d="M20 58 C20 58 4 34 4 20 a16 16 0 0 1 32 0 C36 34 20 58 20 58Z" fill={RED} />
      <circle cx="20" cy="20" r="6.5" fill="#f5ecd8" />
      <ellipse cx="20" cy="58" rx="6" ry="1.6" fill="#000" opacity="0.2" />
    </svg>
  );
}

export function OldCamera({ className, style }: P) {
  return (
    <svg className={className} style={style} viewBox="0 0 90 64" aria-hidden>
      <rect x="4" y="16" width="82" height="44" rx="6" fill="#3a3129" />
      <rect x="4" y="28" width="82" height="20" fill="#7a5c3e" />
      <rect x="14" y="8" width="20" height="10" rx="2" fill="#3a3129" />
      <circle cx="50" cy="38" r="16" fill="#1c1814" stroke="#cfc3ad" strokeWidth="3" />
      <circle cx="50" cy="38" r="8" fill="#476a7c" />
      <circle cx="46" cy="34" r="2.4" fill="#fff" opacity="0.6" />
      <rect x="70" y="20" width="10" height="6" rx="1" fill="#e8e0cf" />
    </svg>
  );
}

export function TrainTicket({ className, style, from = '出发', to = '目的地', date = '' }: P & { from?: string; to?: string; date?: string }) {
  return (
    <svg className={className} style={style} viewBox="0 0 160 70" aria-hidden>
      <path d="M0 0 H160 V26 a6 6 0 0 0 0 18 V70 H0 V44 a6 6 0 0 0 0 -18Z" fill="#e9d4a4" stroke="#b39360" />
      <line x1="118" y1="4" x2="118" y2="66" stroke="#9f7f4d" strokeDasharray="3 3" />
      <text x="12" y="18" fontFamily="Special Elite, monospace" fontSize="8" fill={RED} letterSpacing="2">RAIL · 火车票</text>
      <text x="12" y="44" fontFamily="Noto Serif SC, serif" fontSize="15" fill={INK}>{from}</text>
      <text x="62" y="44" fontFamily="Special Elite, monospace" fontSize="13" fill={INK}>→</text>
      <text x="78" y="44" fontFamily="Noto Serif SC, serif" fontSize="15" fill={INK}>{to}</text>
      <text x="12" y="60" fontFamily="Special Elite, monospace" fontSize="8" fill={INK} opacity="0.7">{date}</text>
      <text x="139" y="40" textAnchor="middle" fontFamily="Special Elite, monospace" fontSize="9" fill={INK} transform="rotate(-90 139 40)">No.0914</text>
    </svg>
  );
}

export function BoardingPass({ className, style }: P) {
  return (
    <svg className={className} style={style} viewBox="0 0 170 72" aria-hidden>
      <rect width="170" height="72" rx="4" fill="#f7f3ea" stroke="#c9bfa9" />
      <rect width="170" height="14" rx="4" fill="#2f5d86" />
      <text x="8" y="10" fontFamily="Special Elite, monospace" fontSize="7" fill="#fff" letterSpacing="2">BOARDING PASS</text>
      <text x="10" y="40" fontFamily="Special Elite, monospace" fontSize="18" fill={INK}>PEK</text>
      <path d="M58 34 l14 0 m-4 -4 l4 4 l-4 4" stroke={INK} fill="none" />
      <text x="80" y="40" fontFamily="Special Elite, monospace" fontSize="18" fill={INK}>CHC</text>
      <line x1="126" y1="18" x2="126" y2="68" stroke="#c9bfa9" strokeDasharray="3 3" />
      {Array.from({ length: 14 }, (_, i) => (
        <rect key={i} x={132 + i * 2.3} y="44" width={i % 3 ? 1 : 1.8} height="18" fill={INK} />
      ))}
      <text x="10" y="60" fontFamily="Special Elite, monospace" fontSize="7" fill={INK} opacity="0.7">SEAT 23A · GATE 9</text>
    </svg>
  );
}

export function EntryStamp({ className, style, text = 'ARRIVED', date = '' }: P & { text?: string; date?: string }) {
  return (
    <svg className={className} style={style} viewBox="0 0 120 70" aria-hidden>
      <g fill="none" stroke={RED} opacity="0.75">
        <rect x="4" y="4" width="112" height="62" rx="8" strokeWidth="3" />
        <rect x="10" y="10" width="100" height="50" rx="5" strokeWidth="1" />
      </g>
      <text x="60" y="37" textAnchor="middle" fontFamily="Special Elite, monospace" fontSize="17" fill={RED} opacity="0.8" letterSpacing="2">
        {text}
      </text>
      <text x="60" y="53" textAnchor="middle" fontFamily="Special Elite, monospace" fontSize="9" fill={RED} opacity="0.8">
        {date}
      </text>
    </svg>
  );
}

export function Postcard({ className, style }: P) {
  return (
    <svg className={className} style={style} viewBox="0 0 150 100" aria-hidden>
      <rect width="150" height="100" fill="#f8f3e7" stroke="#cbbfa6" />
      <line x1="80" y1="12" x2="80" y2="88" stroke="#cbbfa6" />
      {[46, 60, 74].map((y) => (
        <line key={y} x1="88" y1={y} x2="140" y2={y} stroke="#b8ab92" />
      ))}
      <rect x="116" y="10" width="24" height="28" fill="none" stroke="#b8ab92" strokeDasharray="2 2" />
      <text x="12" y="22" fontFamily="Special Elite, monospace" fontSize="9" fill={INK}>POST CARD</text>
      <path d="M12 40 q14 -6 28 0 t28 0 M12 52 q14 -6 28 0 t28 0 M12 64 q10 -4 20 0" fill="none" stroke={INK} opacity="0.4" />
    </svg>
  );
}

export function CoffeeCup({ className, style }: P) {
  return (
    <svg className={className} style={style} viewBox="0 0 80 80" aria-hidden>
      <path d="M26 6 q6 8 0 14 M38 4 q6 8 0 14 M50 6 q6 8 0 14" stroke="#a08868" fill="none" strokeWidth="2" strokeLinecap="round" />
      <path d="M14 26 H60 L54 70 H20Z" fill="#f4ede0" stroke={INK} strokeWidth="2" />
      <path d="M60 34 q14 2 10 16 q-3 8 -13 6" fill="none" stroke={INK} strokeWidth="2" />
      <rect x="18" y="40" width="38" height="10" fill={RED} opacity="0.75" />
      <ellipse cx="37" cy="74" rx="26" ry="3" fill={INK} opacity="0.15" />
    </svg>
  );
}

/** Washi tape strip (drawn, so it can be used as a sticker too). */
export function Washi({ className, style, color = '#d98f76' }: P & { color?: string }) {
  return (
    <svg className={className} style={style} viewBox="0 0 120 26" aria-hidden>
      <path d="M2 3 L118 1 L116 7 L119 13 L116 19 L118 25 L2 24 L5 18 L1 12 L5 6Z" fill={color} opacity="0.72" />
      <path d="M2 3 L118 1 L116 7 L119 13 L116 19 L118 25 L2 24 L5 18 L1 12 L5 6Z" fill="url(#washi-dots)" />
      <defs>
        <pattern id="washi-dots" width="8" height="8" patternUnits="userSpaceOnUse">
          <circle cx="4" cy="4" r="1.3" fill="#fff" opacity="0.55" />
        </pattern>
      </defs>
    </svg>
  );
}

/** Red–blue airmail border for the letter and a cover. */
export const AIRMAIL = 'repeating-linear-gradient(-45deg, #b5402f 0 10px, transparent 10px 20px, #2f5d86 20px 30px, transparent 30px 40px)';
