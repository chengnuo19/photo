import { Backdrop, Egg, Prop, grain } from '../../components/Scene/Scene';
import { noiseBurst, tone, type Recipe } from '../../sound/engine';
import s from './scene.module.css';

/**
 * A darkroom desk: a glowing light table in one corner with negatives on it, a loupe,
 * a 35mm canister (click: it rolls, film advance ratchet) and a few loose prints.
 */
export function FilmScene() {
  return (
    <>
      <Backdrop className={s.desk} style={{ ['--grain' as string]: grain(0.18, 0.8) }}>
        <div className={`${s.lightTable} sc-anim`} />
      </Backdrop>

      <Prop at="bl" x="calc(var(--side) * 0.5 - 170px)" y="calc(var(--bottom) - 10px)" w="clamp(200px, 19vw, 330px)" rot={-8} mobile>
        <Negatives />
      </Prop>

      <Prop at="bl" x="calc(var(--side) * 0.5 - 20px)" y="calc(var(--bottom) + 90px)" w="clamp(80px, 7vw, 120px)" rot={0} tier={2}>
        <Loupe />
      </Prop>

      <Prop at="tr" x="calc(var(--side) * 0.5 - 80px)" y="calc(var(--top) + 70px)" w="clamp(90px, 8vw, 140px)" rot={-24}>
        <Egg id="roll" label="转一下胶卷" duration={1400} className={s.canEgg}>
          <Canister />
        </Egg>
      </Prop>

      <Prop at="tl" x="calc(var(--side) * 0.4 - 90px)" y="calc(var(--top) + 30px)" w="clamp(130px, 11vw, 190px)" rot={12} tier={2}>
        <LoosePrint />
      </Prop>

      <Prop at="r" x="calc(var(--side) * 0.5 - 60px)" y="40px" w="clamp(110px, 10vw, 170px)" rot={78} depth={1} tier={3}>
        <GreasePencil />
      </Prop>
    </>
  );
}

export const filmSound = {
  // a camera shutter for pages, a heavier clack for the covers
  page: ((v) => {
    noiseBurst(v, { f: 3200, q: 1.4, e: { a: 0.001, d: 0.035, peak: 0.16 } });
    noiseBurst(v, { f: 1800, q: 1.2, e: { a: 0.001, d: 0.06, peak: 0.12 }, at: v.t + 0.07 });
    noiseBurst(v, { f: 2400, f2: 900, q: 0.7, e: { a: 0.04, d: 0.4, peak: 0.07 }, at: v.t + 0.05 });
  }) as Recipe,
  egg: {
    // film advance: a ratchet of small clicks
    roll: ((v) => {
      for (let i = 0; i < 9; i++) noiseBurst(v, { f: 2600 + (i % 2) * 500, q: 3, e: { a: 0.001, d: 0.02, peak: 0.1 }, at: v.t + i * 0.07 });
      tone(v, { f: 180, type: 'triangle', e: { a: 0.002, d: 0.05, peak: 0.06 }, at: v.t + 0.66 });
    }) as Recipe,
  },
};

/* ------------------------------------------------------------------ art (seen from above) */

function Negatives() {
  const frames = [0, 1, 2, 3];
  const hues = ['#c7a27a', '#8fa6b8', '#b98f6a', '#a4b48c'];
  return (
    <svg viewBox="0 0 320 170" aria-hidden>
      {[0, 1].map((row) => (
        <g key={row} transform={`translate(${row * 14} ${row * 78}) rotate(${row ? 3 : -2} 160 40)`}>
          <rect x="0" y="0" width="300" height="72" rx="2" fill="#3a2a1e" opacity="0.88" />
          {Array.from({ length: 22 }, (_, i) => (
            <g key={i}>
              <rect x={6 + i * 13.4} y="4" width="6" height="6" rx="1" fill="#f2e6cf" opacity="0.7" />
              <rect x={6 + i * 13.4} y="62" width="6" height="6" rx="1" fill="#f2e6cf" opacity="0.7" />
            </g>
          ))}
          {frames.map((f) => (
            <g key={f}>
              <rect x={8 + f * 72} y="14" width="66" height="44" fill={hues[(f + row) % 4]} opacity="0.55" />
              {/* inverted, faint shapes of a scene */}
              <path d={`M${8 + f * 72} ${48} q16 -${10 + f * 3} 33 -2 t33 -4 V58 H${8 + f * 72} Z`} fill="#2a4a5c" opacity="0.35" />
              <circle cx={50 + f * 72} cy={26} r={5} fill="#1d2c3a" opacity="0.4" />
            </g>
          ))}
          <text x="10" y="70.5" fontSize="5" fill="#e8a94a" fontFamily="monospace" opacity="0.8">
            {row ? '→ 13  → 14  KODAK 400' : '→ 11  → 12  KODAK 400'}
          </text>
        </g>
      ))}
    </svg>
  );
}

function Loupe() {
  return (
    <svg viewBox="0 0 120 120" aria-hidden>
      <defs>
        <radialGradient id="fl-lens" cx="0.35" cy="0.3" r="0.8">
          <stop offset="0" stopColor="#ffffff" stopOpacity="0.9" />
          <stop offset="0.35" stopColor="#dfe8ec" stopOpacity="0.35" />
          <stop offset="1" stopColor="#9fb0b8" stopOpacity="0.2" />
        </radialGradient>
      </defs>
      <circle cx="60" cy="60" r="54" fill="#1e1a17" />
      <circle cx="60" cy="60" r="48" fill="#2f2924" />
      <circle cx="60" cy="60" r="40" fill="url(#fl-lens)" stroke="#6b625a" strokeWidth="2" />
      <path d="M34 44 A30 30 0 0 1 56 26" stroke="#fff" strokeWidth="4" fill="none" strokeLinecap="round" opacity="0.7" />
      {Array.from({ length: 24 }, (_, i) => (
        <rect key={i} x="59" y="4" width="2" height="5" fill="#4a423b" transform={`rotate(${i * 15} 60 60)`} />
      ))}
    </svg>
  );
}

function Canister() {
  return (
    <svg viewBox="0 0 120 200" aria-hidden>
      <defs>
        <linearGradient id="fl-can" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#1c1c1c" />
          <stop offset="0.35" stopColor="#4a4a4a" />
          <stop offset="0.55" stopColor="#2a2a2a" />
          <stop offset="1" stopColor="#111" />
        </linearGradient>
        <linearGradient id="fl-label" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#c98a12" />
          <stop offset="0.4" stopColor="#f7c23a" />
          <stop offset="1" stopColor="#b8780c" />
        </linearGradient>
      </defs>
      {/* film leader sticking out */}
      <path d="M92 60 H116 V120 H92 Z" fill="#6b4a2a" />
      {[66, 80, 94, 108].map((y) => (
        <rect key={y} x="108" y={y} width="5" height="6" fill="#2a1a10" />
      ))}
      <rect x="10" y="26" width="84" height="150" rx="6" fill="url(#fl-can)" />
      <rect x="10" y="48" width="84" height="106" fill="url(#fl-label)" />
      <rect x="10" y="62" width="84" height="16" fill="#d62718" />
      <text x="52" y="120" fontSize="15" fontWeight="700" textAnchor="middle" fill="#2a1a08" fontFamily="sans-serif">
        400
      </text>
      <text x="52" y="138" fontSize="7" textAnchor="middle" fill="#2a1a08" fontFamily="sans-serif" letterSpacing="1">
        36 EXP
      </text>
      {/* spool ends */}
      <rect x="36" y="10" width="32" height="18" rx="3" fill="#2b2b2b" />
      <rect x="40" y="174" width="24" height="12" rx="3" fill="#2b2b2b" />
      <path d="M20 30 V172" stroke="#fff" strokeOpacity="0.14" strokeWidth="6" />
    </svg>
  );
}

function LoosePrint() {
  return (
    <svg viewBox="0 0 180 150" aria-hidden>
      <rect x="0" y="0" width="180" height="150" fill="#fbf8f1" />
      <rect x="10" y="10" width="160" height="112" fill="#8fa6b8" />
      <rect x="10" y="74" width="160" height="48" fill="#6f8a5a" />
      <path d="M10 76 q40 -26 80 -8 t80 -6 V122 H10 Z" fill="#5a744a" />
      <circle cx="136" cy="36" r="10" fill="#f3ddb0" opacity="0.9" />
      <text x="162" y="118" fontSize="9" textAnchor="end" fill="#ff8a1e" fontFamily="monospace" opacity="0.9">
        ’24 7 14
      </text>
      <text x="14" y="140" fontSize="10" fill="#6d5d48" fontFamily="'LXGW WenKai', serif">
        海边那天
      </text>
    </svg>
  );
}

function GreasePencil() {
  return (
    <svg viewBox="0 0 220 24" aria-hidden>
      <rect x="26" y="4" width="184" height="16" rx="2" fill="#c72c20" />
      <rect x="26" y="4" width="184" height="5" fill="#fff" opacity="0.18" />
      {[60, 96, 132, 168].map((x) => (
        <path key={x} d={`M${x} 4 l6 16`} stroke="#8a1a12" strokeWidth="1.2" />
      ))}
      <path d="M26 4 L4 12 L26 20 Z" fill="#c72c20" />
      <path d="M12 9 L4 12 L12 15 Z" fill="#6e160f" />
    </svg>
  );
}
