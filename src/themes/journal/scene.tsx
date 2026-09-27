import { Backdrop, Egg, Prop, grain, tile } from '../../components/Scene/Scene';
import { noiseBurst, tone, type Recipe } from '../../sound/engine';
import s from './scene.module.css';

const MAP = tile(
  `<svg xmlns='http://www.w3.org/2000/svg' width='900' height='700' viewBox='0 0 900 700'><g fill='none' stroke='#846a48' stroke-width='1.1' opacity='0.5'>` +
    // contour lines around two hills
    [0, 1, 2, 3, 4, 5].map((i) => `<ellipse cx='210' cy='230' rx='${40 + i * 26}' ry='${28 + i * 19}' transform='rotate(${-12 + i * 3} 210 230)'/>`).join('') +
    [0, 1, 2, 3, 4].map((i) => `<ellipse cx='690' cy='520' rx='${30 + i * 28}' ry='${24 + i * 18}' transform='rotate(${18 - i * 2} 690 520)'/>`).join('') +
    `</g><path d='M0 470 C120 430 200 520 330 480 S560 380 700 330 S860 260 900 280' fill='none' stroke='#6f8fa6' stroke-width='3' opacity='0.35'/>` +
    `<path d='M60 640 C200 600 260 660 420 610 S700 640 900 590' fill='none' stroke='#a06a4a' stroke-width='1.2' stroke-dasharray='8 6' opacity='0.45'/>` +
    `<g stroke='#846a48' stroke-width='0.6' opacity='0.22'><path d='M0 175 H900 M0 350 H900 M0 525 H900 M225 0 V700 M450 0 V700 M675 0 V700'/></g></svg>`,
);

/**
 * An old map spread on the table: a compass (click: the needle swings), a passport,
 * a train ticket, a strip of stamps and a fountain pen.
 */
export function JournalScene() {
  return (
    <>
      <Backdrop className={s.table} style={{ ['--grain' as string]: grain(0.16), ['--map' as string]: MAP }} />

      <Prop at="bl" x="calc(var(--side) * 0.5 - 120px)" y="calc(var(--bottom) + 10px)" w="clamp(150px, 13vw, 220px)" mobile>
        <Egg id="compass" label="看看指南针" duration={2400} className={s.compassEgg}>
          <Compass />
        </Egg>
      </Prop>

      <Prop at="tr" x="calc(var(--side) * 0.5 - 130px)" y="calc(var(--top) + 60px)" w="clamp(150px, 13vw, 220px)" rot={-14}>
        <Passport />
      </Prop>

      <Prop at="tl" x="calc(var(--side) * 0.5 - 140px)" y="calc(var(--top) + 40px)" w="clamp(170px, 15vw, 260px)" rot={9} tier={2}>
        <Ticket />
      </Prop>

      <Prop at="r" x="calc(var(--side) * 0.5 - 70px)" y="90px" w="clamp(110px, 9vw, 150px)" rot={6} tier={2}>
        <Stamps />
      </Prop>

      <Prop at="l" x="calc(var(--side) * 0.5 - 100px)" y="-10px" w="clamp(160px, 14vw, 240px)" rot={-62} depth={1} tier={3}>
        <FountainPen />
      </Prop>
    </>
  );
}

export const journalSound = {
  egg: {
    compass: ((v) => {
      for (let i = 0; i < 6; i++) tone(v, { f: 3200 - i * 120, type: 'triangle', e: { a: 0.001, d: 0.03, peak: 0.04 / (1 + i * 0.3) }, at: v.t + i * 0.12 + (i > 3 ? i * 0.06 : 0) });
      noiseBurst(v, { f: 5000, q: 4, e: { a: 0.001, d: 0.02, peak: 0.05 } });
    }) as Recipe,
  },
};

/* ------------------------------------------------------------------ art */

function Compass() {
  return (
    <svg viewBox="0 0 200 200" aria-hidden>
      <defs>
        <radialGradient id="jn-brass" cx="0.4" cy="0.35" r="0.7">
          <stop offset="0" stopColor="#f3d99a" />
          <stop offset="0.6" stopColor="#c89b4a" />
          <stop offset="1" stopColor="#8a6424" />
        </radialGradient>
        <radialGradient id="jn-face" cx="0.45" cy="0.4" r="0.7">
          <stop offset="0" stopColor="#fbf5e6" />
          <stop offset="1" stopColor="#e8dcc0" />
        </radialGradient>
      </defs>
      <circle cx="100" cy="100" r="94" fill="url(#jn-brass)" />
      <circle cx="100" cy="100" r="80" fill="url(#jn-face)" stroke="#7a5a26" strokeWidth="1.5" />
      {Array.from({ length: 72 }, (_, i) => (
        <rect key={i} x="99.5" y="22" width="1" height={i % 18 === 0 ? 10 : i % 6 === 0 ? 7 : 4} fill="#5a4630" transform={`rotate(${i * 5} 100 100)`} />
      ))}
      {['N', 'E', 'S', 'W'].map((l, i) => (
        <text key={l} x="100" y="46" textAnchor="middle" fontSize="13" fontFamily="'Special Elite', serif" fill={l === 'N' ? '#b3261e' : '#3a2a1a'} transform={`rotate(${i * 90} 100 100)`}>
          {l}
        </text>
      ))}
      {/* rose */}
      <path d="M100 58 L108 100 L100 142 L92 100 Z" fill="#d9c7a0" opacity="0.7" />
      <path d="M58 100 L100 92 L142 100 L100 108 Z" fill="#d9c7a0" opacity="0.7" />
      <g className={s.needle}>
        <path d="M100 40 L108 100 L92 100 Z" fill="#b3261e" />
        <path d="M100 160 L108 100 L92 100 Z" fill="#2f3a42" />
      </g>
      <circle cx="100" cy="100" r="6" fill="url(#jn-brass)" stroke="#6a4c1c" />
      {/* glass glint */}
      <path d="M44 74 A62 62 0 0 1 90 38" stroke="#fff" strokeWidth="6" opacity="0.5" fill="none" strokeLinecap="round" />
      <rect x="92" y="0" width="16" height="12" rx="3" fill="url(#jn-brass)" />
    </svg>
  );
}

function Passport() {
  return (
    <svg viewBox="0 0 200 270" aria-hidden>
      <rect x="6" y="6" width="188" height="258" rx="8" fill="#6b1f24" />
      <rect x="6" y="6" width="188" height="258" rx="8" fill="none" stroke="#4a1418" strokeWidth="2" />
      <rect x="6" y="6" width="14" height="258" fill="#551a1e" />
      <g fill="none" stroke="#d8b25a" strokeWidth="2">
        <circle cx="104" cy="118" r="34" />
        <circle cx="104" cy="118" r="26" />
        <path d="M78 118 H130 M104 92 V144 M86 100 Q104 112 122 100 M86 136 Q104 124 122 136" />
      </g>
      <text x="104" y="60" textAnchor="middle" fontSize="13" letterSpacing="3" fill="#d8b25a" fontFamily="'Special Elite', serif">
        PASSPORT
      </text>
      <text x="104" y="196" textAnchor="middle" fontSize="16" letterSpacing="8" fill="#d8b25a" fontFamily="'Noto Serif SC', serif">
        旅 行 证
      </text>
      <rect x="84" y="226" width="40" height="14" rx="2" fill="none" stroke="#d8b25a" strokeWidth="1.5" />
      {/* a boarding pass tucked inside */}
      <path d="M150 -2 h40 v70 h-40 z" fill="#f4efe2" transform="rotate(10 170 30)" />
      <path d="M156 10 h26 M156 18 h20 M156 26 h24" stroke="#8a7a60" strokeWidth="2" transform="rotate(10 170 30)" />
    </svg>
  );
}

function Ticket() {
  return (
    <svg viewBox="0 0 260 110" aria-hidden>
      <path d="M0 0 H260 V44 a10 10 0 0 0 0 22 V110 H0 V66 a10 10 0 0 0 0 -22 Z" fill="#e9dcc0" />
      <rect x="0" y="0" width="260" height="22" fill="#2f5d7c" />
      <text x="12" y="15.5" fontSize="10" letterSpacing="2" fill="#f4efe2" fontFamily="'Special Elite', monospace">
        RAILWAY · 2ND CLASS
      </text>
      <text x="14" y="56" fontSize="20" fill="#3a2a1a" fontFamily="'Noto Serif SC', serif">
        出发
      </text>
      <text x="100" y="56" fontSize="16" fill="#8a6a44" fontFamily="serif">
        ⟶
      </text>
      <text x="140" y="56" fontSize="20" fill="#3a2a1a" fontFamily="'Noto Serif SC', serif">
        远方
      </text>
      <text x="14" y="84" fontSize="10" fill="#6a5a44" fontFamily="'Special Elite', monospace">
        NO. 0714 · CAR 06 · SEAT 12A
      </text>
      <path d="M212 26 V104" stroke="#8a7a60" strokeWidth="1.2" strokeDasharray="3 4" />
      <text x="236" y="70" fontSize="11" fill="#b3261e" fontFamily="'Special Elite', monospace" transform="rotate(-90 236 70)">
        ¥ 86.00
      </text>
      <circle cx="176" cy="84" r="16" fill="none" stroke="#b3261e" strokeWidth="1.4" opacity="0.6" />
    </svg>
  );
}

function Stamps() {
  const cols = ['#c8452d', '#2f6f8a', '#6c8f3f', '#d9a441'];
  return (
    <svg viewBox="0 0 120 170" aria-hidden>
      {[0, 1].map((r) =>
        [0, 1].map((c) => {
          const x = 4 + c * 58;
          const y = 4 + r * 82;
          const col = cols[r * 2 + c];
          return (
            <g key={`${r}${c}`}>
              <rect x={x} y={y} width="54" height="78" fill="#fbf7ec" />
              {Array.from({ length: 9 }, (_, i) => (
                <g key={i} fill="#e7dcc4">
                  <circle cx={x + 3 + i * 6} cy={y} r="2" />
                  <circle cx={x + 3 + i * 6} cy={y + 78} r="2" />
                </g>
              ))}
              <rect x={x + 6} y={y + 6} width="42" height="56" fill={col} />
              <path d={`M${x + 6} ${y + 48} q10 -14 21 -4 t21 -6 V62 H${x + 6} Z`} fill="#fff" opacity="0.28" />
              <circle cx={x + 36} cy={y + 20} r="6" fill="#fff" opacity="0.45" />
              <text x={x + 27} y={y + 72} fontSize="8" textAnchor="middle" fill="#3a2a1a" fontFamily="'Special Elite', monospace">
                {['80分', '1.20', '50分', '2.00'][r * 2 + c]}
              </text>
            </g>
          );
        }),
      )}
    </svg>
  );
}

function FountainPen() {
  return (
    <svg viewBox="0 0 260 36" aria-hidden>
      <defs>
        <linearGradient id="jn-pen" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#3a5a4a" />
          <stop offset="0.35" stopColor="#6d9280" />
          <stop offset="1" stopColor="#1f352a" />
        </linearGradient>
      </defs>
      <path d="M60 8 H240 a10 10 0 0 1 0 20 H60 Z" fill="url(#jn-pen)" />
      <rect x="150" y="8" width="8" height="20" fill="#d8b25a" />
      <path d="M170 6 H236 v4 H170 Z" fill="#d8b25a" />
      <path d="M60 10 L22 16 Q10 18 22 20 L60 26 Z" fill="#d8b25a" />
      <path d="M22 18 H48" stroke="#6a4c1c" strokeWidth="1" />
      <circle cx="44" cy="18" r="2" fill="#6a4c1c" />
    </svg>
  );
}
