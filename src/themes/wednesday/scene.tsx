import { Backdrop, Egg, Prop, grain } from '../../components/Scene/Scene';
import { noiseBurst, pluck, type Recipe } from '../../sound/engine';
import s from './scene.module.css';

/**
 * A study at Nevermore: pinstripe wallpaper light, a black lace doily under a candle
 * (click: it goes out with a curl of smoke, then relights), a dead rose, an old key,
 * a crow's feather and a sheet from the typewriter.
 */
export function WednesdayScene() {
  return (
    <>
      <Backdrop className={s.study} style={{ ['--grain' as string]: grain(0.16) }}>
        <div className={`${s.candleLight} sc-anim`} />
      </Backdrop>

      <Prop at="bl" x="calc(var(--side) * 0.5 - 150px)" y="calc(var(--bottom) - 20px)" w="clamp(190px, 17vw, 280px)" mobile>
        <Egg id="candle" label="吹灭蜡烛" duration={3000} className={s.candleEgg}>
          <CandleOnLace />
          <span className={s.smoke} />
        </Egg>
      </Prop>

      <Prop at="tr" x="calc(var(--side) * 0.5 - 130px)" y="calc(var(--top) + 60px)" w="clamp(150px, 13vw, 220px)" rot={-30}>
        <DeadRose />
      </Prop>

      <Prop at="tl" x="calc(var(--side) * 0.5 - 150px)" y="calc(var(--top) + 30px)" w="clamp(160px, 14vw, 230px)" rot={-6} tier={2}>
        <TypedSheet />
      </Prop>

      <Prop at="r" x="calc(var(--side) * 0.5 - 60px)" y="60px" w="clamp(90px, 8vw, 130px)" rot={24} tier={2}>
        <Key />
      </Prop>

      <Prop at="l" x="calc(var(--side) * 0.5 - 70px)" y="30px" w="clamp(150px, 13vw, 210px)" rot={-58} depth={1} tier={3}>
        <Feather />
      </Prop>
    </>
  );
}

export const wednesdaySound = {
  // a low cello pizzicato on every page; the covers get the open string
  page: ((v) => pluck(v, { f: 98 + Math.floor(Math.random() * 3) * 12, peak: 0.1, d: 0.9 })) as Recipe,
  board: ((v) => pluck(v, { f: 65.4, peak: 0.14, d: 1.4 })) as Recipe,
  egg: {
    candle: ((v) => noiseBurst(v, { f: 700, f2: 300, q: 0.6, type: 'lowpass', e: { a: 0.02, d: 0.4, peak: 0.18 } })) as Recipe,
  },
};

/* ------------------------------------------------------------------ art */

function CandleOnLace() {
  const petals = Array.from({ length: 24 }, (_, i) => i * 15);
  return (
    <svg viewBox="0 0 240 240" aria-hidden>
      <defs>
        <radialGradient id="wd-wax" cx="0.4" cy="0.35" r="0.7">
          <stop offset="0" stopColor="#3a3a3e" />
          <stop offset="1" stopColor="#141416" />
        </radialGradient>
        <radialGradient id="wd-glow" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#ffd98a" stopOpacity="0.85" />
          <stop offset="0.4" stopColor="#ffb54a" stopOpacity="0.3" />
          <stop offset="1" stopColor="#ffb54a" stopOpacity="0" />
        </radialGradient>
      </defs>
      {/* black lace doily */}
      <g fill="none" stroke="#1a1a1c" strokeWidth="1.4" opacity="0.85">
        <circle cx="120" cy="120" r="108" />
        <circle cx="120" cy="120" r="92" strokeDasharray="2 4" />
        <circle cx="120" cy="120" r="70" />
        {petals.map((a) => (
          <g key={a} transform={`rotate(${a} 120 120)`}>
            <path d="M120 12 q10 14 0 26 q-10 -12 0 -26" />
            <path d="M120 50 L120 28" />
            <circle cx="120" cy="58" r="4" />
          </g>
        ))}
      </g>
      {/* candle seen from above */}
      <circle cx="120" cy="120" r="46" fill="url(#wd-wax)" />
      <circle cx="120" cy="120" r="46" fill="none" stroke="#000" strokeWidth="2" />
      <path d="M86 108 q6 -18 26 -24" stroke="#555" strokeWidth="3" fill="none" opacity="0.6" strokeLinecap="round" />
      {/* wax pool and wick */}
      <circle cx="120" cy="120" r="18" fill="#26262a" />
      <g className={s.flame}>
        <circle cx="120" cy="120" r="60" fill="url(#wd-glow)" />
        <path d="M120 98 C130 110 130 124 120 132 C110 124 110 110 120 98 Z" fill="#ffc15a" />
        <path d="M120 108 C125 115 125 123 120 127 C115 123 115 115 120 108 Z" fill="#fff4cf" />
      </g>
      <rect x="118.5" y="118" width="3" height="10" fill="#111" />
    </svg>
  );
}

function DeadRose() {
  return (
    <svg viewBox="0 0 220 120" aria-hidden>
      <path d="M40 60 C80 58 140 64 212 70" stroke="#3a3a2c" strokeWidth="4" fill="none" strokeLinecap="round" />
      {[90, 130, 170].map((x, i) => (
        <path key={x} d={`M${x} ${62 + i} l-6 ${i % 2 ? 8 : -8} l10 -2 Z`} fill="#2a2a22" />
      ))}
      <path d="M120 64 q-10 -26 -30 -28 q16 12 30 28 Z" fill="#3c3a2a" />
      <path d="M160 68 q14 22 34 22 q-16 -12 -34 -22 Z" fill="#35342a" />
      {/* bloom seen from above: dried, curled petals */}
      <g transform="translate(40 60)">
        {[0, 50, 100, 150, 200, 250, 300].map((a, i) => (
          <path key={a} d="M0 0 C10 -30 30 -32 34 -12 C36 2 20 8 0 0 Z" fill={i % 2 ? '#3a1216' : '#4d1a1f'} stroke="#1c0a0c" strokeWidth="1" transform={`rotate(${a}) scale(${1 - i * 0.05})`} />
        ))}
        <circle r="10" fill="#2a0c10" />
        <path d="M-6 -2 q6 -8 12 0 q-6 6 -12 0" fill="#5a2026" />
      </g>
      {/* a fallen petal */}
      <path d="M110 96 c8 -8 18 -6 18 4 c-6 6 -14 6 -18 -4 Z" fill="#4d1a1f" />
    </svg>
  );
}

function TypedSheet() {
  const lines = ['I will not be', 'a victim of', 'this town.', '', '— W.A.'];
  return (
    <svg viewBox="0 0 220 280" aria-hidden>
      <rect width="220" height="280" fill="#f4f1ea" />
      <rect width="220" height="280" fill="none" stroke="#d6d1c6" />
      {lines.map((l, i) => (
        <text key={i} x="22" y={48 + i * 24} fontSize="15" fill="#1f1f1f" fontFamily="'Special Elite', monospace">
          {l}
        </text>
      ))}
      <path d="M22 196 H190 M22 214 H150" stroke="#cfc9bd" strokeWidth="1" />
      <circle cx="176" cy="244" r="16" fill="#1c1c1c" opacity="0.06" />
    </svg>
  );
}

function Key() {
  return (
    <svg viewBox="0 0 80 200" aria-hidden>
      <defs>
        <linearGradient id="wd-iron" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#3a3632" />
          <stop offset="0.45" stopColor="#77706a" />
          <stop offset="1" stopColor="#2a2724" />
        </linearGradient>
      </defs>
      <g fill="none" stroke="url(#wd-iron)" strokeWidth="6">
        <circle cx="40" cy="30" r="22" />
        <path d="M40 8 q-14 22 0 44 q14 -22 0 -44" strokeWidth="3" />
      </g>
      <rect x="36" y="52" width="8" height="130" fill="url(#wd-iron)" />
      <rect x="30" y="60" width="20" height="6" fill="url(#wd-iron)" />
      <path d="M44 150 H64 V160 H56 V170 H64 V182 H44 Z" fill="url(#wd-iron)" />
    </svg>
  );
}

function Feather() {
  return (
    <svg viewBox="0 0 220 60" aria-hidden>
      <path d="M8 30 C60 6 150 4 212 26 C150 50 60 54 8 30 Z" fill="#141416" />
      {Array.from({ length: 16 }, (_, i) => (
        <path key={i} d={`M${30 + i * 11} 30 l${8} ${i % 2 ? -18 : 18}`} stroke="#2e2e34" strokeWidth="1" />
      ))}
      <path d="M0 30 H212" stroke="#4a4a52" strokeWidth="1.6" />
      <path d="M20 22 C80 10 150 12 200 24" stroke="#3a3a44" strokeWidth="1" fill="none" opacity="0.7" />
    </svg>
  );
}
