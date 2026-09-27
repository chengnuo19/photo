import { useMemo } from 'react';
import { Backdrop, Egg, Prop, grain } from '../../components/Scene/Scene';
import { tone, type Recipe } from '../../sound/engine';
import s from './scene.module.css';

/**
 * A picnic blanket on the grass at the edge of Route 1: tufts of tall grass rustling,
 * a capture ball (click: it wobbles three times and clicks shut), a handheld console,
 * a badge case and a few berries.
 */
export function PokemonScene() {
  const tufts = useMemo(
    () =>
      [
        [2, 8],
        [8, 78],
        [94, 14],
        [90, 70],
        [4, 44],
        [96, 42],
        [18, 92],
        [80, 94],
      ].map(([x, y], i) => ({ x, y, d: i * 0.7 })),
    [],
  );
  return (
    <>
      <Backdrop className={s.grass} style={{ ['--grain' as string]: grain(0.14) }}>
        {tufts.map((t, i) => (
          <svg key={i} className={`${s.tuft} sc-anim`} viewBox="0 0 60 40" style={{ left: `${t.x}%`, top: `${t.y}%`, animationDelay: `${-t.d}s` }} aria-hidden>
            {[6, 14, 22, 30, 38, 46, 54].map((x, j) => (
              <path key={j} d={`M${x - 4} 40 L${x + (j % 2 ? 2 : -2)} ${8 + (j % 3) * 6} L${x + 4} 40 Z`} fill={j % 2 ? '#4f9a3a' : '#63b14a'} />
            ))}
          </svg>
        ))}
      </Backdrop>

      <Prop at="bl" x="calc(var(--side) * 0.5 - 90px)" y="calc(var(--bottom) + 10px)" w="clamp(100px, 9vw, 150px)" mobile>
        <Egg id="ball" label="扔出精灵球" duration={2600} className={s.ballEgg}>
          <CaptureBall />
        </Egg>
      </Prop>

      <Prop at="tr" x="calc(var(--side) * 0.5 - 100px)" y="calc(var(--top) + 70px)" w="clamp(120px, 10vw, 170px)" rot={-10}>
        <Handheld />
      </Prop>

      <Prop at="tl" x="calc(var(--side) * 0.5 - 130px)" y="calc(var(--top) + 50px)" w="clamp(160px, 14vw, 230px)" rot={8} tier={2}>
        <BadgeCase />
      </Prop>

      <Prop at="r" x="calc(var(--side) * 0.5 - 50px)" y="110px" w="clamp(80px, 7vw, 110px)" tier={2}>
        <Berries />
      </Prop>
    </>
  );
}

const sq = (f: number, at: number, d = 0.07, peak = 0.05): Recipe => (v) => tone(v, { f, type: 'square', lp: 3500, at: v.t + at, e: { a: 0.002, d, peak } });

export const pokemonSound = {
  // the menu blip
  page: ((v) => {
    sq(1320, 0, 0.04, 0.04)(v);
    sq(1760, 0.045, 0.05, 0.035)(v);
  }) as Recipe,
  board: ((v) => {
    sq(660, 0, 0.06)(v);
    sq(880, 0.07, 0.06)(v);
    sq(1320, 0.14, 0.1)(v);
  }) as Recipe,
  egg: {
    // three wobbles, then the catch jingle
    ball: ((v) => {
      [0, 0.5, 1].forEach((t) => sq(220, t, 0.08, 0.05)(v));
      [
        [1568, 1.55],
        [1319, 1.67],
        [1568, 1.79],
        [2093, 1.91],
      ].forEach(([f, t]) => sq(f, t, 0.1, 0.04)(v));
    }) as Recipe,
  },
};

/* ------------------------------------------------------------------ art */

function CaptureBall() {
  return (
    <svg viewBox="0 0 140 140" aria-hidden>
      <defs>
        <radialGradient id="pk-red" cx="0.35" cy="0.3" r="0.8">
          <stop offset="0" stopColor="#ff6a5a" />
          <stop offset="0.6" stopColor="#e3321f" />
          <stop offset="1" stopColor="#a31d10" />
        </radialGradient>
        <radialGradient id="pk-white" cx="0.35" cy="0.3" r="0.9">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="1" stopColor="#d6d6d6" />
        </radialGradient>
      </defs>
      <g className={s.ball}>
        <path d="M8 70 A62 62 0 0 1 132 70 Z" fill="url(#pk-red)" />
        <path d="M8 70 A62 62 0 0 0 132 70 Z" fill="url(#pk-white)" />
        <rect x="8" y="64" width="124" height="12" fill="#222" />
        <circle cx="70" cy="70" r="62" fill="none" stroke="#222" strokeWidth="5" />
        <circle cx="70" cy="70" r="18" fill="#222" />
        <circle cx="70" cy="70" r="11" fill="url(#pk-white)" />
        <circle className={s.button} cx="70" cy="70" r="6" fill="#fff" />
        <ellipse cx="44" cy="34" rx="14" ry="8" fill="#fff" opacity="0.5" transform="rotate(-30 44 34)" />
      </g>
    </svg>
  );
}

function Handheld() {
  return (
    <svg viewBox="0 0 160 250" aria-hidden>
      <rect x="4" y="4" width="152" height="242" rx="12" fill="#d9d6cf" />
      <path d="M156 200 V234 a12 12 0 0 1 -12 12 H110" fill="#c8c4bb" />
      <rect x="18" y="18" width="124" height="104" rx="8" fill="#6b6a74" />
      <rect x="34" y="30" width="92" height="80" fill="#9bbc0f" />
      {/* a tiny pixel scene on the screen */}
      <g fill="#306230">
        <rect x="40" y="88" width="80" height="4" />
        <rect x="52" y="64" width="16" height="24" />
        <rect x="48" y="60" width="24" height="6" />
        <rect x="92" y="74" width="10" height="14" />
      </g>
      <rect x="84" y="40" width="30" height="8" fill="#0f380f" />
      <circle cx="26" cy="46" r="3" fill="#e3321f" />
      {/* d-pad and buttons */}
      <path d="M34 150 h14 v-14 h14 v14 h14 v14 h-14 v14 h-14 v-14 h-14 Z" fill="#2b2b2b" />
      <circle cx="112" cy="166" r="11" fill="#8b1f4a" />
      <circle cx="136" cy="150" r="11" fill="#8b1f4a" />
      <rect x="52" y="204" width="22" height="7" rx="3.5" fill="#8a877f" transform="rotate(-24 63 207)" />
      <rect x="84" y="204" width="22" height="7" rx="3.5" fill="#8a877f" transform="rotate(-24 95 207)" />
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <rect key={i} x={112 + i * 6} y="210" width="3" height="22" rx="1.5" fill="#b8b4ab" transform="rotate(-30 125 220)" />
      ))}
    </svg>
  );
}

function BadgeCase() {
  const badges: [string, string][] = [
    ['#9a9a9a', 'M0 -12 L10 -4 L6 10 L-6 10 L-10 -4 Z'],
    ['#4aa3df', 'M0 -12 C8 -2 8 8 0 12 C-8 8 -8 -2 0 -12 Z'],
    ['#f2c230', 'M0 -12 L3 -3 L12 -3 L5 3 L8 12 L0 6 L-8 12 L-5 3 L-12 -3 L-3 -3 Z'],
    ['#5bbf5b', 'M0 -12 A12 12 0 1 1 -0.1 -12 M0 -6 A6 6 0 1 0 0.1 -6'],
    ['#e85a7a', 'M-10 -10 H10 V10 H-10 Z'],
    ['#a070d0', 'M0 -12 L12 0 L0 12 L-12 0 Z'],
    ['#e0702a', 'M0 -12 C6 -4 12 0 0 12 C-12 0 -6 -4 0 -12 Z'],
    ['#8a6a4a', 'M-12 0 A12 12 0 0 1 12 0 L0 12 Z'],
  ];
  return (
    <svg viewBox="0 0 240 130" aria-hidden>
      <rect x="4" y="4" width="232" height="122" rx="10" fill="#b8321f" />
      <rect x="14" y="14" width="212" height="102" rx="6" fill="#2b2b2b" />
      {badges.map(([c, d], i) => (
        <g key={i} transform={`translate(${40 + (i % 4) * 54} ${44 + Math.floor(i / 4) * 44})`}>
          <circle r="18" fill="#3a3a3a" />
          {i < 5 && <path d={d} fill={c} stroke="#fff" strokeOpacity="0.5" strokeWidth="1" />}
          {i >= 5 && <path d={d} fill="none" stroke="#555" strokeWidth="1.2" strokeDasharray="2 2" />}
        </g>
      ))}
    </svg>
  );
}

function Berries() {
  const berry = (x: number, y: number, c: string) => (
    <g>
      <circle cx={x} cy={y} r="16" fill={c} />
      <ellipse cx={x - 5} cy={y - 6} rx="5" ry="3" fill="#fff" opacity="0.45" />
      <path d={`M${x} ${y - 16} q4 -10 12 -10 q-4 8 -12 10`} fill="#4f9a3a" />
    </g>
  );
  return (
    <svg viewBox="0 0 110 110" aria-hidden>
      {berry(36, 44, '#3a6fd8')}
      {berry(70, 64, '#e85a7a')}
      {berry(44, 82, '#f2a33a')}
    </svg>
  );
}
