import { Backdrop, Egg, Prop, grain, mottle } from '../../components/Scene/Scene';
import { bell, noiseBurst, type Recipe } from '../../sound/engine';
import s from './scene.module.css';

/**
 * A pale stone reading table under a gallery spotlight: a ticket stub, a pencil
 * (the only pen allowed in museums), a folded floor plan and an exhibit label
 * (click: it turns over — "请勿触摸").
 */
export function MuseumScene() {
  return (
    <>
      <Backdrop className={s.stone} style={{ ['--grain' as string]: grain(0.1), ['--mottle' as string]: mottle(0.05, 0.006, 900, 11) }}>
        <div className={s.spot} />
      </Backdrop>

      <Prop at="bl" x="calc(var(--side) * 0.5 - 150px)" y="calc(var(--bottom) + 30px)" w="clamp(170px, 15vw, 250px)" rot={-7} mobile>
        <TicketStub />
      </Prop>

      <Prop at="tr" x="calc(var(--side) * 0.5 - 110px)" y="calc(var(--top) + 90px)" w="clamp(150px, 13vw, 210px)" rot={4}>
        <Egg id="label" label="翻开展签" duration={3200} className={s.labelEgg}>
          <Label />
        </Egg>
      </Prop>

      <Prop at="r" x="calc(var(--side) * 0.5 - 80px)" y="80px" w="clamp(150px, 13vw, 210px)" rot={-76} tier={2}>
        <Pencil />
      </Prop>

      <Prop at="tl" x="calc(var(--side) * 0.5 - 150px)" y="calc(var(--top) + 30px)" w="clamp(160px, 14vw, 230px)" rot={-10} tier={2}>
        <FloorPlan />
      </Prop>
    </>
  );
}

export const museumSound = {
  // a hushed gallery: pages barely whisper
  page: ((v) => noiseBurst(v, { f: 3200, f2: 1400, q: 0.6, e: { a: 0.06, d: 0.5, peak: 0.08 } })) as Recipe,
  egg: {
    label: ((v) => {
      noiseBurst(v, { f: 2600, q: 1, e: { a: 0.01, d: 0.12, peak: 0.08 } });
      bell(v, { f: 1318, peak: 0.035, d: 1.4, at: v.t + 0.12 });
    }) as Recipe,
  },
};

/* ------------------------------------------------------------------ art */

function TicketStub() {
  return (
    <svg viewBox="0 0 250 120" aria-hidden>
      <path d="M0 0 H250 V120 H0 Z" fill="#fbfaf6" />
      <path d="M196 0 V120" stroke="#cfcac0" strokeWidth="1" strokeDasharray="2 4" />
      {/* torn edge of the stub */}
      <path d="M250 0 L246 8 L250 16 L245 26 L250 36 L246 46 L250 58 L245 70 L250 82 L246 94 L250 106 L246 114 L250 120" fill="none" stroke="#e4e0d8" strokeWidth="2" />
      <rect x="14" y="16" width="6" height="88" fill="#c23a2b" />
      <text x="32" y="36" fontSize="10" letterSpacing="3" fill="#8b857a" fontFamily="'Cormorant Garamond', serif">
        ADMIT ONE
      </text>
      <text x="32" y="66" fontSize="22" letterSpacing="2" fill="#2d2a26" fontFamily="'Noto Serif SC', serif" fontWeight="300">
        光与记忆
      </text>
      <text x="32" y="88" fontSize="9.5" letterSpacing="1.5" fill="#6b665e" fontFamily="'Cormorant Garamond', serif">
        SPECIAL EXHIBITION · HALL 3
      </text>
      <text x="224" y="64" fontSize="10" letterSpacing="2" fill="#8b857a" textAnchor="middle" fontFamily="'Cormorant Garamond', serif" transform="rotate(-90 224 64)">
        Nº 00127
      </text>
    </svg>
  );
}

function Label() {
  return (
    <svg viewBox="0 0 210 130" aria-hidden>
      <g className={s.labelFront}>
        <rect width="210" height="130" fill="#fdfcf9" />
        <rect width="210" height="130" fill="none" stroke="#e2ded6" />
        <text x="16" y="30" fontSize="13" fill="#2d2a26" fontFamily="'Noto Serif SC', serif">
          无题 · 夏天
        </text>
        <text x="16" y="50" fontSize="10" fontStyle="italic" fill="#6b665e" fontFamily="'Cormorant Garamond', serif">
          Untitled (Summer), 2024
        </text>
        <text x="16" y="74" fontSize="9" fill="#8b857a" fontFamily="'Noto Serif SC', serif">
          纸本照片、记忆
        </text>
        <text x="16" y="90" fontSize="9" fill="#8b857a" fontFamily="'Noto Serif SC', serif">
          私人收藏
        </text>
        <circle cx="190" cy="112" r="6" fill="#c23a2b" />
      </g>
      <g className={s.labelBack}>
        <rect width="210" height="130" fill="#2d2a26" />
        <text x="105" y="62" fontSize="15" letterSpacing="4" textAnchor="middle" fill="#f4f1ea" fontFamily="'Noto Serif SC', serif" fontWeight="300">
          请勿触摸
        </text>
        <text x="105" y="84" fontSize="10" letterSpacing="3" textAnchor="middle" fill="#bdb6aa" fontFamily="'Cormorant Garamond', serif">
          PLEASE DO NOT TOUCH
        </text>
      </g>
    </svg>
  );
}

function Pencil() {
  return (
    <svg viewBox="0 0 230 20" aria-hidden>
      <rect x="26" y="3" width="190" height="14" fill="#2d2a26" />
      <rect x="26" y="3" width="190" height="4.5" fill="#fff" opacity="0.14" />
      <text x="80" y="13.5" fontSize="7" letterSpacing="2" fill="#c9b27a" fontFamily="'Cormorant Garamond', serif">
        MUSEUM SHOP · HB
      </text>
      <rect x="216" y="3" width="10" height="14" fill="#b9b4aa" />
      <path d="M26 3 L4 10 L26 17 Z" fill="#e8d3ad" />
      <path d="M11 7.8 L4 10 L11 12.2 Z" fill="#2d2a26" />
    </svg>
  );
}

function FloorPlan() {
  return (
    <svg viewBox="0 0 230 170" aria-hidden>
      <path d="M0 0 H115 V170 H0 Z" fill="#fbfaf6" />
      <path d="M115 0 H230 V170 H115 Z" fill="#f1efe9" />
      <g fill="none" stroke="#9a948a" strokeWidth="1.3">
        <rect x="18" y="30" width="80" height="54" />
        <rect x="18" y="84" width="40" height="60" />
        <rect x="58" y="84" width="40" height="60" />
        <rect x="132" y="30" width="80" height="114" />
        <path d="M98 60 H132 M98 110 H132" strokeDasharray="3 3" />
      </g>
      <rect x="58" y="84" width="40" height="60" fill="#c23a2b" opacity="0.14" />
      <circle cx="78" cy="112" r="4" fill="#c23a2b" />
      <text x="18" y="20" fontSize="9" letterSpacing="2" fill="#6b665e" fontFamily="'Cormorant Garamond', serif">
        FLOOR 2
      </text>
      <text x="136" y="160" fontSize="8" letterSpacing="1" fill="#8b857a" fontFamily="'Noto Serif SC', serif">
        您在这里 · 3号厅
      </text>
    </svg>
  );
}
