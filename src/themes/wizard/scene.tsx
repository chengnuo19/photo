import { useMemo } from 'react';
import { Backdrop, Egg, Prop, grain, woodGrain } from '../../components/Scene/Scene';
import { noiseBurst, tone, type Recipe } from '../../sound/engine';
import s from './scene.module.css';

/**
 * The long table in the Great Hall: dark oak, candles floating overhead (their light
 * pooling on the wood), a quill and inkpot, a wand, a feather. The acceptance letter
 * lies sealed in the corner — click: it lifts off the table and flutters.
 */
export function WizardScene() {
  const candles = useMemo(
    () =>
      Array.from({ length: 12 }, (_, i) => ({
        x: i < 6 ? 1 + (i % 3) * 3.4 + (i > 2 ? 1.6 : 0) : 99 - ((i - 6) % 3) * 3.4 - (i > 8 ? 1.6 : 0),
        y: 6 + ((i * 37) % 60),
        w: 10 + ((i * 7) % 8),
        d: (i * 0.9) % 6,
      })),
    [],
  );
  return (
    <>
      <Backdrop className={s.hall} style={{ ['--grain' as string]: grain(0.14), ['--wood' as string]: woodGrain(0.12, [0.25, 0.14, 0.06], 220) }}>
        {candles.map((c, i) => (
          <span key={i} className={`${s.float} sc-anim`} style={{ left: `${c.x}%`, top: `${c.y}%`, width: c.w, animationDelay: `${-c.d}s` }}>
            <i />
          </span>
        ))}
      </Backdrop>

      <Prop at="bl" x="calc(var(--side) * 0.5 - 150px)" y="calc(var(--bottom) - 10px)" w="clamp(190px, 17vw, 270px)" rot={-10} mobile>
        <Egg id="letter" label="拆开录取信" duration={2600} className={s.letterEgg}>
          <Letter />
        </Egg>
      </Prop>

      <Prop at="tr" x="calc(var(--side) * 0.5 - 110px)" y="calc(var(--top) + 60px)" w="clamp(130px, 11vw, 180px)" rot={-8}>
        <InkAndQuill />
      </Prop>

      <Prop at="r" x="calc(var(--side) * 0.5 - 110px)" y="120px" w="clamp(190px, 16vw, 260px)" rot={-70} depth={1} tier={2}>
        <Wand />
      </Prop>

      <Prop at="tl" x="calc(var(--side) * 0.5 - 80px)" y="calc(var(--top) + 70px)" w="clamp(110px, 9vw, 150px)" rot={20} tier={3}>
        <Scarf />
      </Prop>
    </>
  );
}

export const wizardSound = {
  // the quill scratching a line as the page turns
  page: ((v) => {
    noiseBurst(v, { f: 5200, f2: 3000, q: 3, e: { a: 0.02, d: 0.22, peak: 0.05 } });
    noiseBurst(v, { f: 2600, f2: 900, q: 0.7, e: { a: 0.05, d: 0.5, peak: 0.1 }, at: v.t + 0.05 });
  }) as Recipe,
  board: ((v) => {
    tone(v, { f: 110, type: 'triangle', e: { a: 0.02, d: 1.2, peak: 0.08 } });
    tone(v, { f: 165, type: 'sine', e: { a: 0.04, d: 1.4, peak: 0.05 } });
  }) as Recipe,
  egg: {
    letter: ((v) => {
      noiseBurst(v, { f: 900, f2: 3200, q: 0.8, e: { a: 0.2, d: 0.6, peak: 0.1 } });
      [880, 1109, 1319, 1760].forEach((f, i) => tone(v, { f, type: 'sine', e: { a: 0.01, d: 0.8, peak: 0.03 }, at: v.t + 0.2 + i * 0.12 }));
    }) as Recipe,
  },
};

/* ------------------------------------------------------------------ art */

function Letter() {
  return (
    <svg viewBox="0 0 260 180" aria-hidden>
      <g className={s.envelope}>
        <rect x="6" y="10" width="248" height="160" rx="3" fill="#efe2c2" />
        <path d="M6 10 L130 102 L254 10" fill="#e6d6b0" stroke="#cdb98a" strokeWidth="1.2" />
        <path d="M6 170 L108 86 M254 170 L152 86" stroke="#d8c69c" strokeWidth="1.2" />
        <text x="130" y="150" textAnchor="middle" fontSize="12" fill="#3a5a3a" fontFamily="'Cinzel', serif" fontStyle="italic">
          The Cupboard under the Stairs
        </text>
        {/* wax seal */}
        <circle cx="130" cy="100" r="22" fill="#8e1f1f" />
        <circle cx="130" cy="100" r="16" fill="none" stroke="#6a1414" strokeWidth="2" />
        <text x="130" y="107" textAnchor="middle" fontSize="18" fill="#c4474a" fontFamily="'Cinzel Decorative', serif">
          M
        </text>
        <path d="M112 90 q-6 6 -2 14 M150 112 q8 -2 8 -10" stroke="#8e1f1f" strokeWidth="4" fill="none" strokeLinecap="round" />
      </g>
    </svg>
  );
}

function InkAndQuill() {
  return (
    <svg viewBox="0 0 180 240" aria-hidden>
      {/* inkpot from above */}
      <circle cx="70" cy="170" r="56" fill="#1b1b2a" />
      <circle cx="70" cy="170" r="56" fill="none" stroke="#0e0e18" strokeWidth="3" />
      <circle cx="70" cy="170" r="26" fill="#2a2a44" />
      <circle cx="70" cy="170" r="20" fill="#0a0a14" />
      <path d="M36 142 A44 44 0 0 1 70 126" stroke="#fff" strokeWidth="5" opacity="0.35" fill="none" strokeLinecap="round" />
      {/* quill feather resting in it */}
      <path d="M70 170 L160 14" stroke="#e8dcc0" strokeWidth="3" />
      <path d="M92 132 C120 110 150 50 160 14 C146 40 104 86 86 122 Z" fill="#f5efe0" />
      <path d="M92 132 C80 100 120 44 160 14 C132 44 98 90 92 132 Z" fill="#e8dcc0" />
      {Array.from({ length: 10 }, (_, i) => (
        <path key={i} d={`M${100 + i * 6} ${118 - i * 10} l${-8} ${-4}`} stroke="#d4c6a4" strokeWidth="1" />
      ))}
    </svg>
  );
}

function Wand() {
  return (
    <svg viewBox="0 0 280 30" aria-hidden>
      <defs>
        <linearGradient id="wz-wand" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#6a4428" />
          <stop offset="0.4" stopColor="#9a6a40" />
          <stop offset="1" stopColor="#3e2412" />
        </linearGradient>
      </defs>
      <path d="M4 15 L200 10 L200 20 Z" fill="url(#wz-wand)" />
      <path d="M200 8 C220 6 240 4 262 7 C272 9 276 13 276 15 C276 17 272 21 262 23 C240 26 220 24 200 22 Z" fill="url(#wz-wand)" />
      {[214, 232, 250].map((x) => (
        <ellipse key={x} cx={x} cy="15" rx="3" ry="8" fill="#3e2412" opacity="0.6" />
      ))}
    </svg>
  );
}

function Scarf() {
  return (
    <svg viewBox="0 0 150 260" aria-hidden>
      <defs>
        <clipPath id="wz-scarf">
          <path d="M20 0 H130 L120 240 H30 Z" />
        </clipPath>
      </defs>
      <g clipPath="url(#wz-scarf)">
        {Array.from({ length: 12 }, (_, i) => (
          <rect key={i} x="0" y={i * 22} width="150" height="22" fill={i % 2 ? '#d9a531' : '#7a1a1a'} />
        ))}
      </g>
      {Array.from({ length: 9 }, (_, i) => (
        <path key={i} d={`M${34 + i * 10} 240 v18`} stroke={i % 2 ? '#d9a531' : '#7a1a1a'} strokeWidth="4" strokeLinecap="round" />
      ))}
    </svg>
  );
}
