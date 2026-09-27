import { useMemo } from 'react';
import { Backdrop, Egg, Prop, grain } from '../../components/Scene/Scene';
import { bell, type Recipe } from '../../sound/engine';
import s from './scene.module.css';

/**
 * An astronomer's desk: a faint celestial chart across the table with twinkling points,
 * a brass planisphere, dividers, an hourglass. Click the chart's little constellation:
 * its lines draw themselves, with a chime. A shooting star crosses now and then.
 */
export function StarryScene() {
  const stars = useMemo(() => {
    let seed = 17;
    const r = () => ((seed = (seed * 9301 + 49297) % 233280) / 233280);
    return Array.from({ length: 70 }, () => ({ x: r() * 100, y: r() * 100, s: 1 + r() * 2.2, d: r() * 6, t: 3 + r() * 5 }));
  }, []);
  return (
    <>
      <Backdrop className={s.chart} style={{ ['--grain' as string]: grain(0.1) }}>
        <svg className={s.grid} viewBox="0 0 1000 600" preserveAspectRatio="xMidYMid slice" aria-hidden>
          <g fill="none" stroke="currentColor" strokeWidth="0.8">
            {[120, 220, 320, 420, 520].map((r) => (
              <circle key={r} cx="500" cy="300" r={r} />
            ))}
            {Array.from({ length: 12 }, (_, i) => (
              <path key={i} d={`M500 300 L${500 + Math.cos((i * Math.PI) / 6) * 700} ${300 + Math.sin((i * Math.PI) / 6) * 700}`} />
            ))}
            <ellipse cx="500" cy="300" rx="560" ry="210" transform="rotate(-18 500 300)" strokeDasharray="6 8" />
          </g>
        </svg>
        {stars.map((st, i) => (
          <i key={i} className={`${s.star} sc-anim`} style={{ left: `${st.x}%`, top: `${st.y}%`, width: st.s, height: st.s, animationDelay: `${-st.d}s`, animationDuration: `${st.t}s` }} />
        ))}
        <i className={`${s.shooting} sc-anim`} />
      </Backdrop>

      <Prop at="bl" x="calc(var(--side) * 0.5 - 150px)" y="calc(var(--bottom) - 10px)" w="clamp(190px, 17vw, 290px)" rot={-12} mobile>
        <Planisphere />
      </Prop>

      <Prop at="tr" x="calc(var(--side) * 0.5 - 110px)" y="calc(var(--top) + 60px)" w="clamp(150px, 13vw, 210px)">
        <Egg id="constellation" label="连起这些星星" duration={2600} className={s.conEgg}>
          <Constellation />
        </Egg>
      </Prop>

      <Prop at="tl" x="calc(var(--side) * 0.5 - 70px)" y="calc(var(--top) + 40px)" w="clamp(70px, 6vw, 100px)" rot={-20} tier={2}>
        <Dividers />
      </Prop>

      <Prop at="r" x="calc(var(--side) * 0.5 - 60px)" y="120px" w="clamp(80px, 7vw, 110px)" rot={0} depth={1} tier={2}>
        <Hourglass />
      </Prop>
    </>
  );
}

export const starrySound = {
  page: ((v) => bell(v, { f: 2093, peak: 0.018, d: 1.2 })) as Recipe,
  egg: {
    constellation: ((v) => {
      [1568, 1760, 2093, 2349, 2637].forEach((f, i) => bell(v, { f, peak: 0.04, d: 1.6, at: v.t + i * 0.22 }));
    }) as Recipe,
  },
};

/* ------------------------------------------------------------------ art */

function Planisphere() {
  return (
    <svg viewBox="0 0 240 240" aria-hidden>
      <defs>
        <radialGradient id="st-brass" cx="0.4" cy="0.35" r="0.75">
          <stop offset="0" stopColor="#f0d58e" />
          <stop offset="0.6" stopColor="#c19a45" />
          <stop offset="1" stopColor="#7d5e22" />
        </radialGradient>
      </defs>
      <circle cx="120" cy="120" r="114" fill="url(#st-brass)" />
      <circle cx="120" cy="120" r="100" fill="#1b2a4a" />
      {Array.from({ length: 36 }, (_, i) => (
        <rect key={i} x="119.5" y="8" width="1" height={i % 3 ? 5 : 10} fill="#5a4418" transform={`rotate(${i * 10} 120 120)`} />
      ))}
      {/* the sky window */}
      <ellipse cx="120" cy="112" rx="74" ry="62" fill="#243a64" stroke="#e8d6a0" strokeWidth="1.2" />
      {[
        [96, 90],
        [110, 84],
        [128, 88],
        [142, 98],
        [150, 116],
        [88, 132],
        [120, 140],
        [160, 138],
      ].map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={i % 3 ? 1.6 : 2.4} fill="#fff6d8" />
      ))}
      <path d="M96 90 L110 84 L128 88 L142 98 L150 116" stroke="#e8d6a0" strokeWidth="0.8" fill="none" opacity="0.7" />
      {/* rete arm */}
      <path d="M120 120 L206 80" stroke="url(#st-brass)" strokeWidth="5" strokeLinecap="round" />
      <circle cx="120" cy="120" r="7" fill="url(#st-brass)" stroke="#5a4418" />
      <text x="120" y="210" fontSize="9" letterSpacing="3" textAnchor="middle" fill="#e8d6a0" fontFamily="'Cormorant Garamond', serif">
        PLANISPHAERIUM
      </text>
    </svg>
  );
}

function Constellation() {
  const pts: [number, number][] = [
    [20, 110],
    [52, 86],
    [86, 94],
    [118, 70],
    [150, 40],
    [176, 58],
    [160, 92],
  ];
  const d = `M${pts.map(([x, y]) => `${x} ${y}`).join(' L')} L118 70`;
  return (
    <svg viewBox="0 0 200 140" aria-hidden>
      <rect x="2" y="2" width="196" height="136" rx="4" fill="#f6f0dc" />
      <rect x="8" y="8" width="184" height="124" rx="2" fill="none" stroke="#b69a5a" strokeWidth="0.8" />
      <path className={s.conLine} d={d} fill="none" stroke="#b69a5a" strokeWidth="1.2" strokeDasharray="300" />
      {pts.map(([x, y], i) => (
        <g key={i}>
          <circle cx={x} cy={y} r={i === 4 ? 4.5 : 3} fill="#2a3a64" />
          <circle className={s.conGlow} cx={x} cy={y} r="8" fill="#ffd66a" style={{ animationDelay: `${i * 0.12}s` }} />
        </g>
      ))}
      <text x="100" y="128" fontSize="9" letterSpacing="3" textAnchor="middle" fill="#8a7440" fontFamily="'Cormorant Garamond', serif">
        URSA MAJOR
      </text>
    </svg>
  );
}

function Dividers() {
  return (
    <svg viewBox="0 0 80 200" aria-hidden>
      <circle cx="40" cy="20" r="12" fill="#c19a45" stroke="#7d5e22" strokeWidth="2" />
      <circle cx="40" cy="20" r="4" fill="#7d5e22" />
      <path d="M36 28 L12 194 L18 194 L42 30 Z" fill="#b9bec4" />
      <path d="M44 28 L68 194 L62 194 L38 30 Z" fill="#9aa0a7" />
      <rect x="18" y="104" width="44" height="4" rx="2" fill="#c19a45" transform="rotate(0)" />
    </svg>
  );
}

function Hourglass() {
  return (
    <svg viewBox="0 0 110 200" aria-hidden>
      <rect x="6" y="4" width="98" height="14" rx="4" fill="#6b4a2a" />
      <rect x="6" y="182" width="98" height="14" rx="4" fill="#6b4a2a" />
      <rect x="10" y="18" width="6" height="164" fill="#8a6440" />
      <rect x="94" y="18" width="6" height="164" fill="#8a6440" />
      <path d="M24 20 H86 C86 70 60 86 58 100 C60 114 86 130 86 180 H24 C24 130 50 114 52 100 C50 86 24 70 24 20 Z" fill="#e6eef4" opacity="0.55" stroke="#c8d4de" />
      <path d="M34 44 H76 C72 70 58 84 55 96 C52 84 38 70 34 44 Z" fill="#e3c88a" />
      <path d="M55 102 V150" stroke="#e3c88a" strokeWidth="1.5" className={s.sand} />
      <path d="M30 178 C40 150 70 150 80 178 Z" fill="#e3c88a" />
      <path d="M30 26 Q28 60 44 80" stroke="#fff" strokeWidth="3" opacity="0.6" fill="none" />
    </svg>
  );
}
