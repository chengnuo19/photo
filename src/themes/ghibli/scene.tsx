import { Backdrop, Egg, Prop, grain } from '../../components/Scene/Scene';
import { bell, type Recipe } from '../../sound/engine';
import s from './scene.module.css';

/**
 * A summer veranda: pale wooden boards, big clouds drifting past (their shadows on the
 * floor), a glass wind chime (click: it sways and rings), a slice of watermelon, a
 * straw hat and a paper fan.
 */
export function GhibliScene() {
  return (
    <>
      <Backdrop className={s.veranda} style={{ ['--grain' as string]: grain(0.1) }}>
        <div className={`${s.cloudShadow} sc-anim`} />
        <div className={`${s.cloudShadow} ${s.second} sc-anim`} />
      </Backdrop>

      <Prop at="tl" x="calc(var(--side) * 0.5 - 70px)" y="54px" w="clamp(90px, 8vw, 130px)" mobile className={s.chimeProp}>
        <Egg id="chime" label="摇一摇风铃" duration={2800} className={s.chimeEgg}>
          <WindChime />
        </Egg>
      </Prop>

      <Prop at="bl" x="calc(var(--side) * 0.5 - 150px)" y="calc(var(--bottom) - 10px)" w="clamp(170px, 15vw, 250px)" rot={-14}>
        <Watermelon />
      </Prop>

      <Prop at="tr" x="calc(var(--side) * 0.5 - 150px)" y="calc(var(--top) + 60px)" w="clamp(190px, 17vw, 280px)" rot={10} tier={2}>
        <StrawHat />
      </Prop>

      <Prop at="r" x="calc(var(--side) * 0.5 - 80px)" y="150px" w="clamp(120px, 10vw, 160px)" rot={-30} tier={3}>
        <Fan />
      </Prop>
    </>
  );
}

export const ghibliSound = {
  egg: {
    chime: ((v) => {
      [2637, 3136, 2794, 3520].forEach((f, i) => bell(v, { f, peak: 0.045, d: 2.2, at: v.t + i * 0.28 + Math.random() * 0.06, partials: [1, 2.4, 4.1] }));
    }) as Recipe,
  },
};

/* ------------------------------------------------------------------ art */

function WindChime() {
  return (
    <svg viewBox="0 0 100 260" aria-hidden>
      <path d="M50 0 V40" stroke="#6a5a48" strokeWidth="1.5" />
      <g className={s.chime}>
        {/* glass bell with a painted goldfish */}
        <path d="M22 70 C22 46 34 38 50 38 C66 38 78 46 78 70 Z" fill="#dff1f7" opacity="0.85" stroke="#b9dde8" strokeWidth="1.5" />
        <path d="M32 58 q8 -8 16 0 q-8 6 -16 0 Z M48 58 l6 -5 v10 Z" fill="#e4542e" />
        <path d="M58 50 q6 -4 10 2" stroke="#2f7fc0" strokeWidth="2" fill="none" />
        <path d="M30 48 q6 -8 14 -8" stroke="#fff" strokeWidth="3" fill="none" strokeLinecap="round" />
        <path d="M50 70 V150" stroke="#6a5a48" strokeWidth="1" />
        <rect x="47" y="70" width="6" height="14" fill="#8a8a8a" />
        {/* paper strip with a poem */}
        <g className={s.strip}>
          <rect x="36" y="150" width="28" height="104" rx="1" fill="#fbf6e6" />
          <path d="M40 162 v80" stroke="#2f7fc0" strokeWidth="1" opacity="0.35" />
          <text x="50" y="176" fontSize="11" textAnchor="middle" fill="#3a3a3a" fontFamily="'Ma Shan Zheng', 'LXGW WenKai', serif" writingMode="vertical-rl">
            夏天的风
          </text>
        </g>
      </g>
    </svg>
  );
}

function Watermelon() {
  return (
    <svg viewBox="0 0 260 170" aria-hidden>
      {/* plate */}
      <ellipse cx="130" cy="92" rx="124" ry="74" fill="#f5f3ee" />
      <ellipse cx="130" cy="92" rx="104" ry="58" fill="none" stroke="#6ea3c8" strokeWidth="2" opacity="0.6" />
      {[0, 1].map((i) => (
        <g key={i} transform={`translate(${60 + i * 70} ${50 + i * 12}) rotate(${-8 + i * 16})`}>
          <path d="M0 0 H100 A50 50 0 0 1 0 0 Z" transform="scale(1 1)" fill="#3f8a3a" />
          <path d="M5 0 H95 A45 44 0 0 1 5 0 Z" fill="#dff2c8" />
          <path d="M10 0 H90 A40 38 0 0 1 10 0 Z" fill="#e8413a" />
          {[22, 38, 52, 66, 80, 30, 58, 46].map((x, j) => (
            <ellipse key={j} cx={x} cy={j < 5 ? 10 : 22} rx="2.2" ry="3.4" fill="#2a1a14" />
          ))}
        </g>
      ))}
    </svg>
  );
}

function StrawHat() {
  return (
    <svg viewBox="0 0 280 280" aria-hidden>
      <defs>
        <radialGradient id="gh-straw" cx="0.45" cy="0.4" r="0.6">
          <stop offset="0" stopColor="#f3dc9a" />
          <stop offset="1" stopColor="#d6b464" />
        </radialGradient>
      </defs>
      <circle cx="140" cy="140" r="134" fill="url(#gh-straw)" />
      {Array.from({ length: 12 }, (_, i) => (
        <circle key={i} cx="140" cy="140" r={134 - i * 10} fill="none" stroke="#c9a456" strokeWidth="1" opacity="0.6" />
      ))}
      <circle cx="140" cy="140" r="66" fill="#e8cd84" />
      <circle cx="140" cy="140" r="66" fill="none" stroke="#b8923e" strokeWidth="2" />
      {/* ribbon */}
      <circle cx="140" cy="140" r="72" fill="none" stroke="#e4542e" strokeWidth="12" />
      <path d="M200 178 q30 20 40 50 q-26 -8 -46 -40 Z" fill="#e4542e" />
      <path d="M190 186 q10 30 0 60 q-16 -24 -10 -56 Z" fill="#c9401f" />
      <ellipse cx="116" cy="112" rx="30" ry="18" fill="#fff" opacity="0.18" transform="rotate(-30 116 112)" />
    </svg>
  );
}

function Fan() {
  return (
    <svg viewBox="0 0 160 220" aria-hidden>
      <rect x="74" y="120" width="12" height="96" rx="4" fill="#c9a26a" />
      <ellipse cx="80" cy="74" rx="70" ry="66" fill="#fbf6e6" stroke="#d9cdb0" strokeWidth="2" />
      {Array.from({ length: 11 }, (_, i) => (
        <path key={i} d={`M80 128 L${80 + Math.cos(Math.PI + (i * Math.PI) / 10) * 70} ${74 + Math.sin(Math.PI + (i * Math.PI) / 10) * 66}`} stroke="#e8dcc0" strokeWidth="1.5" />
      ))}
      {/* a small painted wave and sun */}
      <path d="M22 96 q14 -14 28 0 t28 0 t28 0 t28 0" stroke="#2f7fc0" strokeWidth="4" fill="none" opacity="0.7" />
      <circle cx="104" cy="48" r="14" fill="#e4542e" opacity="0.8" />
    </svg>
  );
}
