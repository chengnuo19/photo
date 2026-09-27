import { Backdrop, Egg, Prop, grain, woodGrain } from '../../components/Scene/Scene';
import { bell, noiseBurst, type Recipe } from '../../sound/engine';
import s from './scene.module.css';

/**
 * A pale birch table by a window: soft window-pane light with leaf shadows drifting,
 * dust in the light, a cup of tea (click: steam + clink), coloured pencils, a paper plane.
 */
export function StorybookScene() {
  return (
    <>
      <Backdrop className={s.table} style={{ ['--wood' as string]: woodGrain(0.07, [0.55, 0.4, 0.22], 180), ['--grain' as string]: grain(0.12) }}>
        <div className={s.window} />
        <div className={`${s.leaves} sc-anim`} />
        <div className={s.dust}>
          {Array.from({ length: 14 }, (_, i) => (
            <i key={i} className="sc-anim" style={{ left: `${(i * 37) % 100}%`, top: `${(i * 53) % 100}%`, animationDelay: `${-i * 1.7}s`, animationDuration: `${14 + (i % 5) * 3}s` }} />
          ))}
        </div>
      </Backdrop>

      <Prop at="bl" x="calc(var(--side) * 0.5 - 150px)" y="calc(var(--bottom) - 40px)" w="clamp(170px, 15vw, 260px)" mobile>
        <Egg id="tea" label="喝口茶" duration={2600} className={s.teaEgg}>
          <TeaCup />
          <span className={s.steam}>
            <i />
            <i />
            <i />
          </span>
        </Egg>
      </Prop>

      <Prop at="tr" x="calc(var(--side) * 0.45 - 110px)" y="calc(var(--top) + 60px)" w="clamp(150px, 13vw, 230px)" rot={-28} tier={1}>
        <Pencils />
      </Prop>

      <Prop at="tl" x="calc(var(--side) * 0.3 - 40px)" y="calc(var(--top) + 30px)" w="clamp(90px, 8vw, 140px)" rot={14} tier={2}>
        <PaperPlane />
      </Prop>

      <Prop at="r" x="calc(var(--side) * 0.5 - 70px)" y="10px" w="clamp(100px, 9vw, 170px)" rot={8} tier={2}>
        <Sprig />
      </Prop>

      <Prop at="br" x="-60px" y="-50px" w="clamp(240px, 22vw, 380px)" rot={-8} depth={2} tier={3}>
        <Leaf />
      </Prop>
    </>
  );
}

export const storybookSound = {
  egg: {
    tea: ((v) => {
      bell(v, { f: 2350, peak: 0.05, d: 0.9 });
      bell(v, { f: 2620, peak: 0.03, d: 0.7, at: v.t + 0.09 });
      noiseBurst(v, { f: 4000, q: 2, e: { a: 0.002, d: 0.05, peak: 0.05 } });
    }) as Recipe,
  },
};

/* ------------------------------------------------------------------ art (seen from above) */

function TeaCup() {
  return (
    <svg viewBox="0 0 200 200" aria-hidden>
      <defs>
        <radialGradient id="sb-saucer" cx="0.45" cy="0.4" r="0.6">
          <stop offset="0" stopColor="#fffdf8" />
          <stop offset="0.75" stopColor="#f1ece2" />
          <stop offset="1" stopColor="#ddd4c4" />
        </radialGradient>
        <radialGradient id="sb-tea" cx="0.42" cy="0.38" r="0.62">
          <stop offset="0" stopColor="#c98a4a" />
          <stop offset="0.6" stopColor="#9c5e2a" />
          <stop offset="1" stopColor="#6e3d17" />
        </radialGradient>
        <linearGradient id="sb-rim" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="1" stopColor="#e3dccf" />
        </linearGradient>
      </defs>
      {/* saucer */}
      <circle cx="100" cy="100" r="92" fill="url(#sb-saucer)" />
      <circle cx="100" cy="100" r="86" fill="none" stroke="#e8453c" strokeWidth="1.6" opacity="0.55" />
      <circle cx="100" cy="100" r="62" fill="none" stroke="#e6dfd2" strokeWidth="1.2" />
      {/* handle */}
      <path d="M150 78 q30 -4 32 22 q-2 26 -32 22" fill="none" stroke="url(#sb-rim)" strokeWidth="11" strokeLinecap="round" />
      <path d="M150 78 q30 -4 32 22 q-2 26 -32 22" fill="none" stroke="#cfc5b4" strokeWidth="1" opacity="0.6" />
      {/* cup */}
      <circle cx="100" cy="100" r="58" fill="url(#sb-rim)" />
      <circle cx="100" cy="100" r="58" fill="none" stroke="#d6cdbd" strokeWidth="1" />
      <circle cx="100" cy="100" r="51" fill="url(#sb-tea)" />
      {/* reflections on the tea */}
      <ellipse cx="84" cy="80" rx="20" ry="8" fill="#fff" opacity="0.28" transform="rotate(-30 84 80)" />
      <path d="M62 116 q18 20 48 16" fill="none" stroke="#f3cf9c" strokeWidth="2" opacity="0.35" strokeLinecap="round" />
      {/* the red dot of the picture book */}
      <circle cx="100" cy="44" r="3.2" fill="#e8453c" />
      {/* a teaspoon on the saucer */}
      <g transform="rotate(38 100 100)">
        <rect x="96.5" y="150" width="7" height="44" rx="3.5" fill="#d9d4cb" />
        <ellipse cx="100" cy="152" rx="10" ry="14" fill="#e7e3dc" stroke="#c5bfb4" strokeWidth="0.8" />
        <ellipse cx="97" cy="148" rx="3" ry="6" fill="#fff" opacity="0.7" />
      </g>
    </svg>
  );
}

function Pencils() {
  const pencil = (y: number, body: string, dark: string, len: number) => (
    <g transform={`translate(0 ${y})`}>
      <rect x="30" y="0" width={len} height="14" rx="1.5" fill={body} />
      <rect x="30" y="0" width={len} height="4.5" fill="#fff" opacity="0.22" />
      <rect x="30" y="9.5" width={len} height="4.5" fill={dark} opacity="0.35" />
      {/* wood cone + lead */}
      <path d={`M30 0 L6 7 L30 14 Z`} fill="#e8c897" />
      <path d={`M30 0 L6 7 L30 4.5 Z`} fill="#f3dcb4" />
      <path d={`M13 5 L6 7 L13 9 Z`} fill={dark} />
      {/* end cap */}
      <rect x={30 + len} y="0" width="10" height="14" fill="#c9c3b6" />
      <rect x={30 + len} y="0" width="10" height="4" fill="#fff" opacity="0.4" />
    </g>
  );
  return (
    <svg viewBox="0 0 220 80" aria-hidden>
      {pencil(6, '#e8453c', '#8a2018', 160)}
      {pencil(28, '#f2c230', '#9c7410', 138)}
      <g transform="rotate(-6 110 60)">{pencil(50, '#6c8fb0', '#2c4a66', 150)}</g>
    </svg>
  );
}

function PaperPlane() {
  return (
    <svg viewBox="0 0 120 90" aria-hidden>
      <path d="M4 44 L116 6 L52 84 Z" fill="#fffdf8" />
      <path d="M4 44 L116 6 L44 52 Z" fill="#f3eee4" />
      <path d="M44 52 L116 6 L52 84 Z" fill="#e7e0d3" />
      <path d="M44 52 L52 84" stroke="#d9d0bf" strokeWidth="1" />
      <path d="M4 44 L116 6" stroke="#e8453c" strokeWidth="1.2" strokeDasharray="4 5" opacity="0.6" />
    </svg>
  );
}

function Sprig() {
  const leaf = (x: number, y: number, r: number, c: string) => (
    <path d="M0 0 q10 -16 24 -14 q-6 14 -24 14 Z" fill={c} transform={`translate(${x} ${y}) rotate(${r})`} />
  );
  return (
    <svg viewBox="0 0 120 160" aria-hidden>
      <path d="M60 158 q-6 -60 10 -140" stroke="#7a8a55" strokeWidth="2.4" fill="none" strokeLinecap="round" />
      {leaf(58, 130, -40, '#9bb071')}
      {leaf(64, 112, -150, '#8aa362')}
      {leaf(60, 92, -30, '#a7bb7e')}
      {leaf(66, 72, -160, '#93aa6a')}
      {leaf(63, 52, -50, '#a9bd82')}
      <circle cx="70" cy="18" r="7" fill="#f2c230" />
      <circle cx="70" cy="18" r="3" fill="#e0a41c" />
      <circle cx="84" cy="34" r="5" fill="#e8453c" opacity="0.85" />
    </svg>
  );
}

function Leaf() {
  return (
    <svg viewBox="0 0 300 200" aria-hidden>
      <path d="M10 180 C60 60 180 10 290 20 C250 120 140 190 10 180 Z" fill="#8ea468" />
      <path d="M10 180 C90 120 180 60 290 20" stroke="#6f8a4c" strokeWidth="3" fill="none" />
      {[0.25, 0.4, 0.55, 0.7].map((t) => (
        <path key={t} d={`M${10 + 280 * t} ${180 - 160 * t} q${20 - t * 10} ${30} ${40 - t * 20} ${40}`} stroke="#7a9556" strokeWidth="1.6" fill="none" />
      ))}
    </svg>
  );
}
