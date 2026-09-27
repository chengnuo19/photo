import { useState } from 'react';
import { Backdrop, Egg, Prop, grain, mottle } from '../../components/Scene/Scene';
import { noiseBurst, tone, type Recipe } from '../../sound/engine';
import s from './scene.module.css';

const BLOOMS = ['#f2a0b8', '#8fc3d9', '#b7d38f', '#f5c86a', '#c3a6e0'];

/**
 * Cold-press watercolour paper with old colour blooms: a paint tin, a jar of rinse water,
 * brushes. Click the jar: a drop falls and a new bloom of colour spreads on the paper.
 */
export function WatercolorScene() {
  const [blooms, setBlooms] = useState<{ id: number; c: string; x: number; y: number }[]>([]);
  return (
    <>
      <Backdrop className={s.paper} style={{ ['--grain' as string]: grain(0.12, 0.6), ['--mottle' as string]: mottle(0.035, 0.02, 600, 5) }}>
        <i className={s.bloom} style={{ left: '-6%', top: '8%', background: BLOOMS[0] }} />
        <i className={s.bloom} style={{ right: '-8%', bottom: '4%', background: BLOOMS[1] }} />
        <i className={s.bloom} style={{ right: '4%', top: '-10%', background: BLOOMS[2], scale: '0.7' }} />
        {blooms.map((b) => (
          <i key={b.id} className={`${s.bloom} ${s.fresh}`} style={{ left: `${b.x}%`, top: `${b.y}%`, background: b.c }} />
        ))}
      </Backdrop>

      <Prop at="bl" x="calc(var(--side) * 0.5 - 150px)" y="calc(var(--bottom) + 20px)" w="clamp(180px, 16vw, 270px)" rot={-10} mobile>
        <PaintTin />
      </Prop>

      <Prop at="tr" x="calc(var(--side) * 0.5 - 100px)" y="calc(var(--top) + 70px)" w="clamp(120px, 10vw, 170px)">
        <Egg
          id="drop"
          label="蘸一下水"
          duration={1800}
          className={s.jarEgg}
          onPlay={() =>
            setBlooms((bs) => [
              ...bs.slice(-4),
              { id: Date.now(), c: BLOOMS[Math.floor(Math.random() * BLOOMS.length)], x: Math.random() > 0.5 ? 78 + Math.random() * 10 : 2 + Math.random() * 8, y: 20 + Math.random() * 50 },
            ])
          }
        >
          <Jar />
        </Egg>
      </Prop>

      <Prop at="r" x="calc(var(--side) * 0.5 - 110px)" y="70px" w="clamp(170px, 15vw, 250px)" rot={-68} tier={2}>
        <Brushes />
      </Prop>

      <Prop at="tl" x="calc(var(--side) * 0.5 - 80px)" y="calc(var(--top) + 40px)" w="clamp(90px, 8vw, 130px)" rot={16} tier={2}>
        <PressedFlower />
      </Prop>
    </>
  );
}

export const watercolorSound = {
  egg: {
    // a drop into water: a quick falling pitch plus a wet splash
    drop: ((v) => {
      tone(v, { f: 1400, f2: 420, type: 'sine', e: { a: 0.002, d: 0.14, peak: 0.12 } });
      tone(v, { f: 900, f2: 1500, type: 'sine', e: { a: 0.002, d: 0.08, peak: 0.05 }, at: v.t + 0.05 });
      noiseBurst(v, { f: 2400, q: 1.2, e: { a: 0.004, d: 0.18, peak: 0.05 }, at: v.t + 0.03 });
    }) as Recipe,
  },
};

/* ------------------------------------------------------------------ art */

function PaintTin() {
  const pans = ['#d9463e', '#f0a13a', '#f3d34a', '#7fb35a', '#3f8f7a', '#4a86c5', '#2d4f8e', '#8a5ab0', '#a0522d', '#3a3a3a', '#e98fb0', '#c9b79a'];
  return (
    <svg viewBox="0 0 280 150" aria-hidden>
      <rect x="4" y="4" width="272" height="142" rx="12" fill="#e9ecef" />
      <rect x="4" y="4" width="272" height="142" rx="12" fill="none" stroke="#b9c0c7" strokeWidth="2" />
      <rect x="12" y="12" width="256" height="126" rx="8" fill="#f7f8f9" />
      {pans.map((c, i) => {
        const x = 20 + (i % 6) * 41;
        const y = 22 + Math.floor(i / 6) * 58;
        return (
          <g key={i}>
            <rect x={x} y={y} width="34" height="48" rx="3" fill="#fff" stroke="#d6dbe0" />
            <rect x={x + 3} y={y + 3} width="28" height="42" rx="2" fill={c} />
            {/* used: a scooped-out, wet patch */}
            <ellipse cx={x + 17} cy={y + 24} rx={8 + (i % 3) * 2} ry={11} fill="#fff" opacity="0.22" />
            <ellipse cx={x + 12} cy={y + 12} rx="4" ry="2" fill="#fff" opacity="0.55" />
          </g>
        );
      })}
      {/* smears of mixed colour on the lid edge */}
      <path d="M30 140 q30 -6 60 0" stroke="#8a5ab0" strokeWidth="5" opacity="0.25" strokeLinecap="round" />
      <path d="M150 142 q40 -8 90 -2" stroke="#4a86c5" strokeWidth="6" opacity="0.2" strokeLinecap="round" />
    </svg>
  );
}

function Jar() {
  return (
    <svg viewBox="0 0 160 160" aria-hidden>
      <defs>
        <radialGradient id="wc-water" cx="0.45" cy="0.4" r="0.6">
          <stop offset="0" stopColor="#c9d8e8" />
          <stop offset="0.7" stopColor="#a7bfd6" />
          <stop offset="1" stopColor="#8aa6c2" />
        </radialGradient>
      </defs>
      <circle cx="80" cy="80" r="74" fill="#eef3f6" opacity="0.8" />
      <circle cx="80" cy="80" r="74" fill="none" stroke="#c8d3dc" strokeWidth="4" />
      <circle cx="80" cy="80" r="64" fill="url(#wc-water)" />
      {/* swirls of rinsed paint */}
      <path d="M40 84 q20 -30 46 -12 t38 -4" stroke="#c77ba0" strokeWidth="6" fill="none" opacity="0.35" strokeLinecap="round" />
      <path d="M52 110 q24 10 50 -10" stroke="#7fb35a" strokeWidth="5" fill="none" opacity="0.3" strokeLinecap="round" />
      <circle className={s.ripple} cx="80" cy="80" r="10" fill="none" stroke="#fff" strokeWidth="2" />
      <circle className={s.ripple} cx="80" cy="80" r="10" fill="none" stroke="#fff" strokeWidth="1.5" style={{ animationDelay: '0.25s' }} />
      <path d="M34 50 A56 56 0 0 1 70 24" stroke="#fff" strokeWidth="6" opacity="0.7" fill="none" strokeLinecap="round" />
    </svg>
  );
}

function Brushes() {
  const brush = (y: number, handle: string, len: number, tip: string) => (
    <g transform={`translate(0 ${y})`}>
      <path d={`M60 2 H${60 + len} a6 6 0 0 1 0 12 H60 Z`} fill={handle} />
      <rect x="40" y="1" width="22" height="14" fill="#c9ccd0" />
      <rect x="40" y="1" width="22" height="4" fill="#fff" opacity="0.5" />
      <path d="M40 2 Q20 4 4 8 Q20 12 40 14 Z" fill="#3a2a1e" />
      <path d="M22 5 Q10 7 4 8 Q10 9 22 11 Z" fill={tip} />
    </g>
  );
  return (
    <svg viewBox="0 0 260 60" aria-hidden>
      {brush(4, '#b5462c', 180, '#4a86c5')}
      {brush(26, '#2f3a42', 150, '#e98fb0')}
      <g transform="rotate(4 130 40)">{brush(42, '#d9b98a', 164, '#7fb35a')}</g>
    </svg>
  );
}

function PressedFlower() {
  return (
    <svg viewBox="0 0 120 160" aria-hidden>
      <path d="M60 156 Q54 110 62 60" stroke="#8a9a5a" strokeWidth="2" fill="none" />
      <path d="M58 120 q-22 -8 -30 -26 q20 2 30 26 Z" fill="#9fb07a" opacity="0.9" />
      <path d="M60 96 q20 -10 32 -28 q-22 4 -32 28 Z" fill="#aabd84" opacity="0.9" />
      {Array.from({ length: 7 }, (_, i) => (
        <ellipse key={i} cx="62" cy="36" rx="9" ry="20" fill="#e9a7c0" opacity="0.8" transform={`rotate(${i * (360 / 7)} 62 50)`} />
      ))}
      <circle cx="62" cy="50" r="7" fill="#f3cf6a" />
    </svg>
  );
}
