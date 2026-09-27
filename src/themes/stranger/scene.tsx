import { useMemo } from 'react';
import { Backdrop, Egg, Prop, grain } from '../../components/Scene/Scene';
import { noiseBurst, tone, type Recipe } from '../../sound/engine';
import s from './scene.module.css';

const BULBS = ['#ff3b30', '#ffcc00', '#34c759', '#0a84ff', '#ff9500', '#ff2d92'];

/**
 * A kid's bedroom floor in 1984: a string of Christmas lights across the top (click:
 * they flicker a message), a walkie-talkie (click: static and a chirp), a Walkman with
 * a mixtape, a plate of waffles, a flashlight. Spores drift up from the Upside Down.
 */
export function StrangerScene() {
  const spores = useMemo(() => Array.from({ length: 22 }, (_, i) => ({ x: (i * 47) % 100, d: (i * 1.3) % 12, t: 12 + (i % 6) * 2 })), []);
  const bulbs = useMemo(() => Array.from({ length: 18 }, (_, i) => ({ x: 2 + i * 5.6, y: 12 + Math.sin((i / 17) * Math.PI) * 26 + (i % 2) * 6, c: BULBS[i % BULBS.length] })), []);
  return (
    <>
      <Backdrop className={s.floor} style={{ ['--grain' as string]: grain(0.2, 0.85) }}>
        {spores.map((p, i) => (
          <i key={i} className={`${s.spore} sc-anim`} style={{ left: `${p.x}%`, animationDelay: `${-p.d}s`, animationDuration: `${p.t}s` }} />
        ))}
      </Backdrop>

      <Prop at="t" x="-50vw" y="30px" w="100vw" tier={1} className={s.lightsProp}>
        <Egg id="lights" label="让串灯闪一下" duration={3400} className={s.lightsEgg}>
          <svg className={s.string} viewBox="0 0 100 50" preserveAspectRatio="none" aria-hidden>
            <path d="M-2 10 Q25 42 50 26 T102 14" stroke="#1d2a1d" strokeWidth="0.35" fill="none" vectorEffect="non-scaling-stroke" />
          </svg>
          {bulbs.map((b, i) => (
            <span key={i} className={`${s.bulb} sc-anim`} style={{ left: `${b.x}%`, top: `${b.y}px`, ['--c' as string]: b.c, animationDelay: `${-i * 0.37}s` }} />
          ))}
        </Egg>
      </Prop>

      <Prop at="bl" x="calc(var(--side) * 0.5 - 90px)" y="calc(var(--bottom) - 10px)" w="clamp(90px, 8vw, 130px)" rot={-14} mobile>
        <Egg id="radio" label="按下对讲机" duration={1400} className={s.radioEgg}>
          <WalkieTalkie />
        </Egg>
      </Prop>

      <Prop at="tr" x="calc(var(--side) * 0.5 - 110px)" y="calc(var(--top) + 90px)" w="clamp(140px, 12vw, 190px)" rot={12}>
        <Walkman />
      </Prop>

      <Prop at="tl" x="calc(var(--side) * 0.5 - 130px)" y="calc(var(--top) + 90px)" w="clamp(150px, 13vw, 210px)" tier={2}>
        <Waffles />
      </Prop>

      <Prop at="r" x="calc(var(--side) * 0.5 - 90px)" y="120px" w="clamp(150px, 13vw, 220px)" rot={-100} depth={1} tier={3}>
        <Flashlight />
      </Prop>
    </>
  );
}

export const strangerSound = {
  // VHS deck: a clunky key press
  page: ((v) => {
    noiseBurst(v, { f: 1200, q: 2, e: { a: 0.001, d: 0.04, peak: 0.14 } });
    tone(v, { f: 90, type: 'square', lp: 400, e: { a: 0.002, d: 0.08, peak: 0.05 } });
  }) as Recipe,
  egg: {
    radio: ((v) => {
      noiseBurst(v, { f: 1800, q: 0.4, type: 'bandpass', e: { a: 0.01, d: 0.5, peak: 0.14, hold: 0.25 }, rate: 1.4 });
      tone(v, { f: 1400, type: 'square', lp: 2500, e: { a: 0.002, d: 0.06, peak: 0.04 }, at: v.t + 0.82 });
      tone(v, { f: 1800, type: 'square', lp: 2500, e: { a: 0.002, d: 0.06, peak: 0.04 }, at: v.t + 0.92 });
    }) as Recipe,
    lights: ((v) => {
      for (let i = 0; i < 6; i++) noiseBurst(v, { f: 6000, q: 5, e: { a: 0.001, d: 0.02, peak: 0.05 }, at: v.t + i * 0.45 + Math.random() * 0.1 });
      tone(v, { f: 60, type: 'sawtooth', lp: 200, e: { a: 0.2, d: 1.2, peak: 0.05, hold: 1.4 } });
    }) as Recipe,
  },
};

/* ------------------------------------------------------------------ art */

function WalkieTalkie() {
  return (
    <svg viewBox="0 0 120 260" aria-hidden>
      <rect x="84" y="0" width="10" height="70" rx="4" fill="#1c1c1c" />
      <rect x="10" y="56" width="100" height="200" rx="14" fill="#2b2b2b" />
      <rect x="10" y="56" width="100" height="200" rx="14" fill="none" stroke="#111" strokeWidth="2" />
      <rect x="16" y="62" width="10" height="188" rx="4" fill="#3c3c3c" />
      {/* speaker grille */}
      {Array.from({ length: 8 }, (_, i) => (
        <rect key={i} x="30" y={80 + i * 10} width="62" height="4" rx="2" fill="#151515" />
      ))}
      <rect x="30" y="172" width="62" height="30" rx="4" fill="#c5b25a" />
      <text x="61" y="192" textAnchor="middle" fontSize="11" fontFamily="'VT323', monospace" fill="#2b2b2b">
        CH 14
      </text>
      <circle className={s.led} cx="92" cy="228" r="5" fill="#ff3b30" />
      <rect x="30" y="216" width="40" height="22" rx="4" fill="#3a3a3a" />
    </svg>
  );
}

function Walkman() {
  return (
    <svg viewBox="0 0 200 150" aria-hidden>
      <rect x="4" y="4" width="192" height="142" rx="12" fill="#2f5aa8" />
      <rect x="4" y="4" width="192" height="142" rx="12" fill="none" stroke="#1d3a70" strokeWidth="2" />
      <rect x="20" y="22" width="160" height="92" rx="6" fill="#dfe6ef" opacity="0.35" />
      {/* the mixtape inside */}
      <rect x="30" y="30" width="140" height="76" rx="4" fill="#f1ede2" />
      <rect x="40" y="36" width="120" height="16" fill="#ff9500" />
      <text x="100" y="48" textAnchor="middle" fontSize="11" fontFamily="'Special Elite', monospace" fill="#2b2b2b">
        MIX TAPE ’84
      </text>
      <circle cx="72" cy="80" r="12" fill="#2b2b2b" />
      <circle cx="128" cy="80" r="12" fill="#2b2b2b" />
      <circle cx="72" cy="80" r="5" fill="#f1ede2" />
      <circle cx="128" cy="80" r="5" fill="#f1ede2" />
      {['◀◀', '▶', '■', '▶▶'].map((t, i) => (
        <g key={i}>
          <rect x={26 + i * 38} y="122" width="32" height="16" rx="3" fill="#b8c2cf" />
          <text x={42 + i * 38} y="134" textAnchor="middle" fontSize="8" fill="#2b2b2b">
            {t}
          </text>
        </g>
      ))}
      {/* headphone cord */}
      <path d="M196 60 C230 70 220 140 180 160" stroke="#1c1c1c" strokeWidth="3" fill="none" />
    </svg>
  );
}

function Waffles() {
  const waffle = (cx: number, cy: number, r: number) => (
    <g>
      <circle cx={cx} cy={cy} r={r} fill="#e3a24a" />
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#b8752a" strokeWidth="3" />
      {Array.from({ length: 5 }, (_, i) =>
        Array.from({ length: 5 }, (_, j) => (
          <rect key={`${i}${j}`} x={cx - r * 0.72 + i * r * 0.3} y={cy - r * 0.72 + j * r * 0.3} width={r * 0.22} height={r * 0.22} rx="1.5" fill="#c9822f" />
        )),
      )}
    </g>
  );
  return (
    <svg viewBox="0 0 220 180" aria-hidden>
      <ellipse cx="110" cy="92" rx="104" ry="84" fill="#f6f3ec" />
      <ellipse cx="110" cy="92" rx="88" ry="70" fill="none" stroke="#e1dccf" strokeWidth="2" />
      {waffle(92, 84, 46)}
      {waffle(132, 106, 42)}
      <rect x="120" y="92" width="20" height="14" rx="3" fill="#fff4c8" />
      <path d="M40 150 L190 40" stroke="#b9b4aa" strokeWidth="6" strokeLinecap="round" />
    </svg>
  );
}

function Flashlight() {
  return (
    <svg viewBox="0 0 240 70" aria-hidden>
      <path d="M200 35 L240 0 V70 Z" fill="#fff6c8" opacity="0.18" />
      <rect x="40" y="20" width="130" height="30" rx="6" fill="#c33b2a" />
      <rect x="40" y="20" width="130" height="8" rx="4" fill="#fff" opacity="0.18" />
      <path d="M170 14 H200 V56 H170 Z" fill="#b9bec4" />
      <ellipse cx="200" cy="35" rx="4" ry="21" fill="#fff6c8" />
      <rect x="92" y="14" width="16" height="8" rx="2" fill="#2b2b2b" />
      <rect x="30" y="24" width="12" height="22" rx="3" fill="#2b2b2b" />
    </svg>
  );
}
