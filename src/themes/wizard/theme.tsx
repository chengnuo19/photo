import { WizardScene, wizardSound } from './scene';
import type { CSSProperties } from 'react';
import { EditableText, ImageSlot } from '../../components/Editor/Editable';
import type { BookDoc } from '../../data/schema';
import { seeded } from '../context';
import k from '../kit/kit.module.css';
import { lineSlots, stampDate, useBookEdits } from '../shared';
import type { DecorProps, FrameProps, PageProps, ThemeDef } from '../types';
import s from './wizard.module.css';

const art = (f: string) => `${import.meta.env.BASE_URL}assets/themes/wizard/${f}.svg`;
type P = { className?: string; style?: CSSProperties };
const HOUSES = ['#7a1b1b', '#1f4f2f', '#1d2f6b', '#b8912a'];

/* ------------------------------------------------------------------ objects */

const Owl = ({ className, style }: P) => (
  <svg className={className} style={style} viewBox="0 0 70 90">
    <ellipse cx="35" cy="52" rx="26" ry="32" fill="#8a6a4a" />
    <ellipse cx="35" cy="60" rx="17" ry="22" fill="#e6d4b4" />
    {[0, 1, 2].map((i) => (
      <path key={i} d={`M24 ${56 + i * 8} q4 3 8 0 q4 3 8 0 q4 3 8 0`} stroke="#b89b74" fill="none" />
    ))}
    <path d="M12 26 L20 12 L28 24 M58 26 L50 12 L42 24" fill="#8a6a4a" />
    <circle cx="25" cy="34" r="9" fill="#f6ecd2" />
    <circle cx="45" cy="34" r="9" fill="#f6ecd2" />
    <circle cx="25" cy="34" r="4.5" fill="#2b1f14" />
    <circle cx="45" cy="34" r="4.5" fill="#2b1f14" />
    <path d="M32 40 L35 46 L38 40Z" fill="#d9a24a" />
    <path d="M26 84 l-3 5 M31 84 l0 5 M39 84 l0 5 M44 84 l3 5" stroke="#d9a24a" strokeWidth="2" />
  </svg>
);
export const WaxSeal = ({ className, style, letter = 'M', color = '#8c1d1d' }: P & { letter?: string; color?: string }) => (
  <svg className={className} style={style} viewBox="0 0 70 70">
    <path d="M35 3 C44 5 50 2 56 9 C63 14 66 22 66 30 C69 40 64 48 60 55 C54 62 46 67 35 66 C24 68 14 63 9 55 C3 48 2 40 4 30 C4 20 9 12 16 8 C22 4 28 5 35 3Z" fill={color} />
    <circle cx="35" cy="35" r="21" fill="none" stroke="rgba(0,0,0,0.25)" strokeWidth="2.5" />
    <circle cx="35" cy="35" r="21" fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth="1" transform="translate(-1 -1)" />
    <text x="35" y="44" textAnchor="middle" fontFamily="Cinzel Decorative, serif" fontWeight="700" fontSize="24" fill="rgba(0,0,0,0.3)">
      {letter}
    </text>
  </svg>
);
const Quill = ({ className, style }: P) => (
  <svg className={className} style={style} viewBox="0 0 60 140">
    <path d="M44 4 C20 30 10 70 14 110 L20 110 C22 70 34 34 44 4Z" fill="#f2ead8" stroke="#b8a888" />
    {Array.from({ length: 12 }, (_, i) => (
      <path key={i} d={`M${40 - i * 2.2} ${10 + i * 8} l-10 6`} stroke="#c8b898" />
    ))}
    <path d="M16 108 L14 136" stroke="#3a2a1a" strokeWidth="2" />
    <path d="M36 120 h20 v16 h-20Z" fill="#1d2f5b" />
    <rect x="38" y="114" width="16" height="7" fill="#2b2b2b" />
  </svg>
);
const Wand = ({ className, style }: P) => (
  <svg className={className} style={style} viewBox="0 0 150 30">
    <path d="M6 16 L120 12 L124 18 L8 20Z" fill="#5a3a22" />
    <path d="M100 11 h26 v10 h-26Z" fill="#3a2414" />
    {[104, 110, 116].map((x) => (
      <rect key={x} x={x} y="11" width="2" height="10" fill="#b8912a" />
    ))}
    <path d="M140 6 l2 6 l6 2 l-6 2 l-2 6 l-2 -6 l-6 -2 l6 -2z" fill="#ffe59a" />
  </svg>
);
const Broom = ({ className, style }: P) => (
  <svg className={className} style={style} viewBox="0 0 160 50">
    <path d="M4 22 L110 18 L110 26 L4 28Z" fill="#7a5530" />
    <path d="M110 16 C130 6 150 8 158 4 C150 20 150 30 158 46 C150 42 130 44 110 32Z" fill="#c9a064" />
    {Array.from({ length: 7 }, (_, i) => (
      <path key={i} d={`M114 ${20 + i * 1.6} Q136 ${12 + i * 4} 156 ${6 + i * 6}`} stroke="#9a7a44" strokeWidth="0.8" fill="none" />
    ))}
    <rect x="106" y="15" width="6" height="18" fill="#6b4a2a" />
  </svg>
);
const WingedBall = ({ className, style }: P) => (
  <svg className={className} style={style} viewBox="0 0 110 50">
    <path d="M42 24 C30 8 8 4 2 10 C12 14 20 20 26 28 C20 26 12 28 6 32 C20 34 32 32 42 28Z" fill="#f4efe0" stroke="#c8bfa4" />
    <path d="M68 24 C80 8 102 4 108 10 C98 14 90 20 84 28 C90 26 98 28 104 32 C90 34 78 32 68 28Z" fill="#f4efe0" stroke="#c8bfa4" />
    <circle cx="55" cy="26" r="13" fill="#e9c14a" stroke="#b8912a" strokeWidth="1.5" />
    <path d="M44 22 q11 6 22 0" stroke="#b8912a" fill="none" />
    <circle cx="50" cy="21" r="3" fill="#fff" opacity="0.6" />
  </svg>
);
const PotionBottle = ({ className, style }: P) => (
  <svg className={className} style={style} viewBox="0 0 60 90">
    <rect x="22" y="4" width="16" height="12" fill="#8a6a4a" />
    <path d="M24 16 H36 V30 C52 38 54 84 30 86 C6 84 8 38 24 30Z" fill="#4aa37a" fillOpacity="0.8" stroke="#2a5a44" strokeWidth="2" />
    <path d="M12 58 C20 54 40 62 48 56 V80 H12Z" fill="#2f7a55" opacity="0.7" />
    <circle cx="24" cy="66" r="3" fill="#bff5d8" />
    <circle cx="34" cy="72" r="2" fill="#bff5d8" />
    <rect x="16" y="40" width="28" height="12" fill="#efe0bd" stroke="#8a6a4a" />
  </svg>
);
const WizardHat = ({ className, style }: P) => (
  <svg className={className} style={style} viewBox="0 0 100 90">
    <ellipse cx="50" cy="78" rx="46" ry="10" fill="#4a3a2a" />
    <path d="M24 76 C30 50 38 30 52 6 C58 20 62 30 70 38 C66 48 70 60 76 76Z" fill="#5a4630" />
    <path d="M28 70 C44 74 60 74 74 70 L75 76 C60 80 42 80 26 76Z" fill="#3a2a1a" />
    <path d="M36 54 q10 -6 22 -2" stroke="#3a2a1a" strokeWidth="2" fill="none" />
  </svg>
);
const Ticket934 = ({ className, style }: P) => (
  <svg className={className} style={style} viewBox="0 0 150 70">
    <rect width="150" height="70" rx="3" fill="#efe0bd" stroke="#8a6a4a" />
    <rect x="6" y="6" width="138" height="58" rx="2" fill="none" stroke="#8a6a4a" strokeDasharray="3 2" />
    <text x="14" y="26" fontFamily="Cinzel, serif" fontSize="10" fill="#7a1b1b" letterSpacing="1.5">
      EXPRESS · PLATFORM
    </text>
    <text x="14" y="54" fontFamily="Cinzel Decorative, serif" fontWeight="700" fontSize="24" fill="#3a2614">
      9¾
    </text>
    <text x="86" y="54" fontFamily="Cinzel, serif" fontSize="9" fill="#3a2614">
      11 O’CLOCK
    </text>
  </svg>
);
const Spellbook = ({ className, style }: P) => (
  <svg className={className} style={style} viewBox="0 0 90 80">
    <path d="M6 14 L44 8 L44 72 L6 76Z" fill="#6b1d1d" />
    <path d="M44 8 L84 14 L84 76 L44 72Z" fill="#7a2424" />
    <path d="M44 8 V72" stroke="#3a0e0e" strokeWidth="3" />
    <path d="M58 30 l6 -10 l6 10 l-6 10Z" fill="#b8912a" />
    <path d="M14 26 h22 M14 34 h18" stroke="#b8912a" strokeWidth="2" />
  </svg>
);
const Candle = ({ className, style }: P) => (
  <svg className={className} style={style} viewBox="0 0 20 70" aria-hidden>
    {/* halo, flame (outer, inner), wick */}
    <circle cx="10" cy="11" r="9" fill="#ffcf5a" opacity="0.18" />
    <path d="M10 1 C14 7 14.5 12 10 17 C5.5 12 6 7 10 1 Z" fill="#ffb640" />
    <path d="M10 6 C12.2 9.5 12.2 12.5 10 15.5 C7.8 12.5 7.8 9.5 10 6 Z" fill="#fff4c8" />
    <rect x="9.5" y="15.5" width="1" height="4" fill="#3a2a1a" />
    {/* wax body with a shaded side and drips */}
    <path d="M4.5 21 Q10 18.5 15.5 21 V66 Q10 68 4.5 66 Z" fill="#f5eedc" />
    <path d="M12.5 20 Q14.5 20.5 15.5 21 V66 Q14 66.8 12.5 67 Z" fill="#ddd2b8" />
    <path d="M4.5 21 Q5 28 6.2 30 Q7.4 31 7.2 26 Q7 22 8 20" fill="#fffaf0" />
    <path d="M13 20.4 Q13.4 26 12.4 34 Q11.6 36 11.4 32 Q11.6 25 11 20" fill="#e6dcc4" />
    <ellipse cx="10" cy="21" rx="5.5" ry="1.4" fill="#fffdf6" />
  </svg>
);

/** Heraldic shield in four house colours with simple charges (no official crest). */
function Crest({ className, style, title }: P & { title?: string }) {
  return (
    <svg className={className} style={style} viewBox="0 0 120 150">
      <defs>
        <clipPath id="shield">
          <path d="M10 10 H110 V70 C110 110 84 132 60 144 C36 132 10 110 10 70Z" />
        </clipPath>
      </defs>
      <g clipPath="url(#shield)">
        <rect x="10" y="10" width="50" height="67" fill={HOUSES[0]} />
        <rect x="60" y="10" width="50" height="67" fill={HOUSES[1]} />
        <rect x="10" y="77" width="50" height="70" fill={HOUSES[3]} />
        <rect x="60" y="77" width="50" height="70" fill={HOUSES[2]} />
        <path d="M35 34 l6 12 h-12Z M31 50 h8 v10 h-8Z" fill="#e9c14a" />
        <path d="M76 36 q10 -10 18 0 q-8 10 0 20 q-10 8 -18 -2" stroke="#c9d2c9" strokeWidth="3" fill="none" />
        <circle cx="35" cy="108" r="10" fill="#2b2b2b" />
        <path d="M76 104 l9 -12 l9 12 l-9 14Z" fill="#c8a24a" />
      </g>
      <path d="M10 10 H110 V70 C110 110 84 132 60 144 C36 132 10 110 10 70Z" fill="none" stroke="#b8912a" strokeWidth="4" />
      <path d="M60 10 V144 M10 77 H110" stroke="#b8912a" strokeWidth="3" />
      {title && (
        <text x="60" y="8" textAnchor="middle" fontFamily="Cinzel, serif" fontSize="6" fill="#b8912a">
          {title}
        </text>
      )}
    </svg>
  );
}

/* ------------------------------------------------------------------ frame */

function OrnateFrame({ image, onChange, page, className, style, imprint, emptyLabel }: FrameProps) {
  const d = stampDate(page.spread?.stamp?.date);
  return (
    <figure className={`${k.photo} ${s.ornate} ${className ?? ''}`} style={style}>
      <div className={s.ornateWindow}>
        <ImageSlot image={image} onChange={onChange} emptyLabel={emptyLabel} />
      </div>
      {['tl', 'tr', 'bl', 'br'].map((c) => (
        <svg key={c} className={`${s.flourish} ${s[c]}`} viewBox="0 0 40 40">
          <path d="M4 36 C4 16 16 4 36 4 M10 36 C10 22 22 10 36 10" fill="none" stroke="#e7cd7a" strokeWidth="2.2" />
          <circle cx="8" cy="8" r="4" fill="#e7cd7a" />
        </svg>
      ))}
      {imprint && d.ok && <figcaption className={s.plaque}>{`${d.mon} ${d.d}`}</figcaption>}
    </figure>
  );
}

/* ------------------------------------------------------------------ covers */

function CrestCover({ book }: PageProps) {
  const e = useBookEdits();
  const [a = ''] = lineSlots(book.meta.coverLines, 1, e.editing);
  return (
    <div className={`${s.board} ${s.leather}`}>
      <span className={s.goldBorder} />
      <Crest className={s.crest} />
      <p className={s.coverTitle}>{book.meta.title}</p>
      <EditableText className={s.coverLine} value={a} onCommit={e.metaLine('coverLines', 0)} placeholder="一句话" />
    </div>
  );
}

function LetterCover({ book }: PageProps) {
  return (
    <div className={`${s.board} ${s.table}`}>
      <div className={s.envelope}>
        <span className={s.flap} />
        <WaxSeal className={s.envSeal} />
        <div className={s.address}>
          <p>{book.meta.author ? `致 ${book.meta.author}` : '致 收信人'}</p>
          <p>{book.meta.kicker}</p>
          <p className={s.addrTitle}>{book.meta.title}</p>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ pages */

function Title({ book }: PageProps) {
  const m = book.meta;
  const e = useBookEdits();
  return (
    <div className={`${s.fill} paper`}>
      <div className={s.titleInner}>
        <Crest className={s.titleCrest} />
        <EditableText className={s.kicker} value={m.kicker} onCommit={e.meta('kicker')} placeholder="一行小字" />
        <EditableText as="h1" className={s.title} value={m.title} onCommit={e.meta('title')} placeholder="书名" />
        <EditableText className={s.subtitle} value={m.subtitle} onCommit={e.meta('subtitle')} placeholder="副标题" />
      </div>
      <EditableText className={s.dateLine} value={m.dateLine} onCommit={e.meta('dateLine')} placeholder="日期" />
    </div>
  );
}

function Letter({ book }: PageProps) {
  const l = book.meta.letter;
  const e = useBookEdits();
  if (!l) return <div className={`${s.fill} paper`} />;
  return (
    <div className={`${s.fill} paper`}>
      <div className={s.letter}>
        <p className={s.letterHead}>ACADEMY OF MAGIC</p>
        <EditableText className={s.lHi} value={l.salutation} onCommit={e.letter('salutation')} placeholder="称呼" />
        <EditableText className={s.lBody} value={l.body} onCommit={e.letter('body')} placeholder="信的内容" multiline />
        <div className={s.lSign}>
          <EditableText value={l.signoff} onCommit={e.letter('signoff')} placeholder="署名" />
          <EditableText className={s.lDate} value={l.date} onCommit={e.letter('date')} placeholder="日期" />
        </div>
      </div>
      <WaxSeal className={s.letterSeal} />
    </div>
  );
}

function Finis() {
  return (
    <div className={`${s.fill} ${s.finis} paper`}>
      <Wand className={s.finisWand} />
      <p>恶作剧完毕。</p>
    </div>
  );
}

/* ------------------------------------------------------------------ decorations */

function CandlesDecor({ page, seed }: DecorProps) {
  const r = seeded(seed + (page.side === 'right' ? 11 : 0));
  return (
    <>
      {/* floating in the top margin, a few nearer (bigger, brighter) than others */}
      {Array.from({ length: 5 }, (_, i) => {
        const near = r() > 0.6;
        return (
          <Candle
            key={i}
            className={`${s.candle} mb-anim`}
            style={{
              left: `${6 + i * 19 + r() * 7}%`,
              top: `${-3 + r() * 3}%`,
              width: `${near ? 2.6 : 1.8}cqw`,
              opacity: near ? 1 : 0.8,
              animationDelay: `${-r() * 5}s`,
            }}
          />
        );
      })}
    </>
  );
}

function FootprintsDecor({ page, seed }: DecorProps) {
  const r = seeded(seed + (page.side === 'right' ? 5 : 0));
  const steps = 9;
  const start = { x: 6 + r() * 10, y: 88 };
  return (
    <svg className={s.steps} viewBox="0 0 100 122" preserveAspectRatio="none">
      {Array.from({ length: steps }, (_, i) => {
        const t = i / (steps - 1);
        const x = start.x + t * 80 + Math.sin(t * 5) * 4;
        const y = start.y - t * 70 + (i % 2 ? 2.4 : -2.4);
        return <ellipse key={i} cx={x} cy={y} rx="1.2" ry="2" transform={`rotate(${40 - t * 10} ${x} ${y})`} />;
      })}
      <text x={start.x + 70} y={start.y - 76} fontFamily="LXGW WenKai, serif" fontSize="3">
        ……有人来过
      </text>
    </svg>
  );
}

function StripesDecor({ page, seed }: DecorProps) {
  const c = HOUSES[seed % 4];
  return <div className={s.scarf} data-side={page.side} style={{ ['--house' as string]: c }} />;
}

function SealDecor({ page, seed }: DecorProps) {
  if (page.side === 'left') return null;
  return <WaxSeal className={s.decoSeal} color={HOUSES[seed % 4]} />;
}

/* ------------------------------------------------------------------ sample */

function sample(): BookDoc {
  const img = (f: string, alt: string, x = 0.5) => ({ src: art(f), alt, focal: { x, y: 0.5 } });
  return {
    id: 'sample-wizard',
    version: 1,
    themeId: 'wizard',
    coverVariant: 'crest',
    meta: {
      kicker: '魔法学院 · 第一学年',
      title: '我的魔法学年',
      subtitle: '一本会动的相册',
      author: '一年级新生',
      dateLine: 'ANNO MMXXIV',
      coverLines: ['我庄严宣誓我不怀好意。'],
      closingLines: ['城堡的灯还亮着，', '下学年见。'],
      dedication: { to: '给我在城堡里的朋友们', body: '我们一起迷过路，\n也一起在走廊里被抓到过。' },
      letter: { salutation: '亲爱的同学：', body: '我们很高兴地通知你，你已经被学院录取。\n\n请于九月一日上午十一点前往站台，火车会准时出发。', signoff: '副校长', date: '七月三十一日' },
    },
    cover: {},
    sound: { flip: true },
    spreads: [
      { id: 'z1', layout: 'full-spread', images: [img('platform', '冒着蒸汽的红色列车停在 9¾ 站台')], caption: '十一点整，列车鸣笛出发。', stamp: { date: '9.1', place: '9¾ 站台' } },
      { id: 'z2', layout: 'full-spread', images: [img('castle', '湖边悬崖上的城堡，窗户里亮着灯')], caption: '第一次看见城堡，是在湖上的小船里。', stamp: { date: '9.1', place: '黑湖' }, overrides: { decor: 'footprints' } },
      { id: 'z3', layout: 'photo-text', images: [img('hall', '漂浮着蜡烛的大礼堂', 0.5)], title: '开学宴会', text: '天花板上是真正的星空。\n几百根蜡烛就这样飘在半空里。', caption: '礼堂里的蜡烛。', stamp: { date: '9.1', place: '礼堂' } },
      { id: 'z4', layout: 'text', images: [], caption: '幸福的时光，\n也要记得把灯打开。', title: '魔药课笔记', text: '顺时针搅拌七次，逆时针一次。\n千万不要在课上打瞌睡。' },
    ],
  };
}

export const wizardDef: ThemeDef = {
  id: 'wizard',
  name: '魔法学院',
  group: 'screen',
  blurb: '羊皮纸、火漆印、猫头鹰、漂浮蜡烛、学院围巾条纹和 9¾ 车票',
  className: s.theme,
  fonts: ['Cinzel Decorative', 'Cinzel', 'Ma Shan Zheng', 'LXGW WenKai'],
  photo: 'mount',
  Frame: OrnateFrame,
  palettes: [
    { id: 'parchment', name: '羊皮纸', swatch: ['#efe0bd', '#3a2614', '#7a1b1b'], vars: {} },
    {
      id: 'crimson',
      name: '深红金',
      swatch: ['#5a1818', '#f1e2b8', '#d9b04a'],
      vars: {
        '--paper': '#5a1818',
        '--paper-deep': '#4a1212',
        '--paper-edge': '#6e2424',
        '--board': '#3a0e0e',
        '--ink': '#f1e2b8',
        '--ink-soft': '#d9c79a',
        '--accent': '#d9b04a',
        '--paper-pattern': 'none',
        '--letter-ink': '#f1e2b8',
      },
    },
    {
      id: 'night',
      name: '夜间城堡',
      swatch: ['#15192b', '#efe0bd', '#b8912a'],
      vars: {
        '--paper': '#15192b',
        '--paper-deep': '#10131f',
        '--paper-edge': '#262b42',
        '--board': '#0f1220',
        '--ink': '#efe0bd',
        '--ink-soft': '#c9bb98',
        '--accent': '#d9b04a',
        '--paper-pattern': 'none',
        '--letter-ink': '#cfe8d4',
        '--room': '#e9e8ee',
      },
    },
  ],
  ornaments: {
    divider: () => <Wand style={{ width: '16cqw' }} />,
  },
  decor: [
    { id: 'candles', label: '漂浮蜡烛', Component: CandlesDecor },
    { id: 'footprints', label: '脚印地图', Component: FootprintsDecor },
    { id: 'stripes', label: '学院围巾', Component: StripesDecor },
    { id: 'seal', label: '火漆印', Component: SealDecor },
  ],
  stickers: {
    owl: { label: '猫头鹰', Component: Owl },
    seal: { label: '火漆印', Component: (p) => <WaxSeal {...p} /> },
    quill: { label: '羽毛笔', Component: Quill },
    wand: { label: '魔杖', Component: Wand },
    broom: { label: '飞天扫帚', Component: Broom },
    winged: { label: '金色飞球', Component: WingedBall },
    potion: { label: '魔药', Component: PotionBottle },
    hat: { label: '巫师帽', Component: WizardHat },
    ticket: { label: '9¾ 车票', Component: Ticket934 },
    book: { label: '魔法书', Component: Spellbook },
    candle: { label: '蜡烛', Component: Candle },
  },
  covers: [
    { id: 'crest', name: '学院纹章', Component: CrestCover },
    { id: 'letter', name: '录取信', Component: LetterCover },
  ],
  pages: { title: Title, letter: Letter, finis: Finis },
  photoFilter: { label: '古旧棕褐', css: 'sepia(0.36) saturate(0.92) contrast(1.05)', overlay: 'paper' },
  wrap: { kind: 'envelope', paper: '#efe2c2', flap: '#e6d6b0', seal: '#8e1f1f', mark: 'M', ink: '#3a5a3a' },
  scene: WizardScene,
  sound: wizardSound,
  sample,
};
