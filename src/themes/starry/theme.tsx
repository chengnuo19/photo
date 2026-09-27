import { StarryScene, starrySound } from './scene';
import type { CSSProperties } from 'react';
import { EditableText, ImageSlot } from '../../components/Editor/Editable';
import type { BookDoc } from '../../data/schema';
import { seeded } from '../context';
import k from '../kit/kit.module.css';
import { lineSlots, stampDate, useBookEdits } from '../shared';
import type { DecorProps, FrameProps, PageProps, ThemeDef } from '../types';
import s from './starry.module.css';

const art = (f: string) => `${import.meta.env.BASE_URL}assets/themes/starry/${f}.svg`;
type P = { className?: string; style?: CSSProperties };
const GOLD = 'var(--gold, #d4b26a)';

/* ------------------------------------------------------------------ ornaments */

export const Star = ({ className, style }: P) => (
  <svg className={className} style={style} viewBox="0 0 40 40">
    <path d="M20 2 L24 16 L38 20 L24 24 L20 38 L16 24 L2 20 L16 16Z" fill={GOLD} />
  </svg>
);
const Crescent = ({ className, style }: P) => (
  <svg className={className} style={style} viewBox="0 0 60 60">
    <path d="M40 6 A26 26 0 1 0 54 44 A22 22 0 1 1 40 6Z" fill="#f3e6b8" />
  </svg>
);
const FullMoon = ({ className, style }: P) => (
  <svg className={className} style={style} viewBox="0 0 60 60">
    <circle cx="30" cy="30" r="26" fill="#f3e6b8" />
    <circle cx="22" cy="22" r="5" fill="#e1d09a" />
    <circle cx="36" cy="36" r="7" fill="#e1d09a" />
    <circle cx="38" cy="18" r="3" fill="#e1d09a" />
  </svg>
);
const ShootingStar = ({ className, style }: P) => (
  <svg className={className} style={style} viewBox="0 0 120 50">
    <path d="M4 46 L96 12" stroke="url(#ss)" strokeWidth="3" strokeLinecap="round" />
    <defs>
      <linearGradient id="ss" x1="0" x2="1">
        <stop offset="0" stopColor="#f3e6b8" stopOpacity="0" />
        <stop offset="1" stopColor="#f3e6b8" />
      </linearGradient>
    </defs>
    <path d="M100 10 l3 -8 l3 8 l8 3 l-8 3 l-3 8 l-3 -8 l-8 -3z" fill="#f3e6b8" />
  </svg>
);
const Saturn = ({ className, style }: P) => (
  <svg className={className} style={style} viewBox="0 0 100 60">
    <circle cx="50" cy="30" r="18" fill="#d9b77a" />
    <ellipse cx="50" cy="30" rx="44" ry="10" fill="none" stroke="#efdcae" strokeWidth="4" transform="rotate(-14 50 30)" />
    <path d="M32 26 A18 18 0 0 1 68 26" fill="#d9b77a" />
  </svg>
);
const Telescope = ({ className, style }: P) => (
  <svg className={className} style={style} viewBox="0 0 100 100">
    <g transform="rotate(-30 50 40)">
      <rect x="14" y="30" width="60" height="16" rx="3" fill="#6b4f8a" />
      <rect x="70" y="27" width="14" height="22" rx="2" fill={GOLD} />
      <rect x="4" y="34" width="12" height="8" fill="#4a3566" />
    </g>
    <path d="M48 52 L30 96 M52 52 L70 96 M50 52 L50 96" stroke="#8a7a5a" strokeWidth="3" />
  </svg>
);
const Dipper = ({ className, style }: P) => {
  const pts = [
    [8, 30],
    [26, 26],
    [42, 32],
    [58, 40],
    [66, 58],
    [88, 60],
    [92, 40],
  ];
  return (
    <svg className={className} style={style} viewBox="0 0 100 70">
      <polyline points={pts.map((p) => p.join(',')).join(' ') + ' 58,40'} fill="none" stroke={GOLD} strokeWidth="1" opacity="0.8" />
      {pts.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r="2.6" fill="#fff6d6" />
      ))}
    </svg>
  );
};
const CompassRose = ({ className, style }: P) => (
  <svg className={className} style={style} viewBox="0 0 100 100">
    <circle cx="50" cy="50" r="44" fill="none" stroke={GOLD} strokeWidth="1" />
    <circle cx="50" cy="50" r="36" fill="none" stroke={GOLD} strokeWidth="0.6" strokeDasharray="2 3" />
    <path d="M50 4 L56 44 L96 50 L56 56 L50 96 L44 56 L4 50 L44 44Z" fill={GOLD} opacity="0.9" />
    <path d="M50 22 L53 47 L78 50 L53 53 L50 78 L47 53 L22 50 L47 47Z" fill="#fff6d6" opacity="0.8" transform="rotate(45 50 50)" />
  </svg>
);
const Comet = ({ className, style }: P) => (
  <svg className={className} style={style} viewBox="0 0 110 60">
    <path d="M10 10 Q60 30 88 40" stroke="#bcd4ff" strokeWidth="10" strokeLinecap="round" opacity="0.3" />
    <path d="M20 16 Q60 32 88 40" stroke="#e4eeff" strokeWidth="4" strokeLinecap="round" opacity="0.6" />
    <circle cx="90" cy="41" r="8" fill="#f7fbff" />
  </svg>
);
const Sun = ({ className, style }: P) => (
  <svg className={className} style={style} viewBox="0 0 80 80">
    {Array.from({ length: 12 }, (_, i) => (
      <path key={i} d="M40 4 L43 18 L37 18Z" fill={GOLD} transform={`rotate(${i * 30} 40 40)`} />
    ))}
    <circle cx="40" cy="40" r="18" fill={GOLD} />
    <circle cx="40" cy="40" r="12" fill="none" stroke="#fff3c8" strokeWidth="1" />
  </svg>
);

/** Moon phases in a row. */
function Phases({ className }: P) {
  return (
    <svg className={className} viewBox="0 0 280 40">
      {[0, 1, 2, 3, 4, 5, 6].map((i) => {
        const x = 20 + i * 40;
        const f = i / 6; // 0 new → 1 full → but we show new→full→new
        const phase = i <= 3 ? i / 3 : (6 - i) / 3;
        return (
          <g key={i}>
            <circle cx={x} cy="20" r="12" fill="none" stroke={GOLD} strokeWidth="1" />
            <ellipse cx={x} cy="20" rx={12 * phase} ry="12" fill="#f3e6b8" opacity={f >= 0 ? 0.9 : 0} />
          </g>
        );
      })}
    </svg>
  );
}

/** A few real-ish constellations, chosen by seed. */
const CONSTELLATIONS: number[][][] = [
  // dipper
  [[10, 40], [24, 34], [38, 38], [52, 46], [56, 62], [76, 64], [80, 48], [52, 46]],
  // cassiopeia
  [[10, 30], [30, 50], [48, 34], [66, 54], [86, 36]],
  // orion
  [[30, 10], [60, 14], [40, 40], [48, 42], [56, 44], [28, 74], [68, 72], [40, 40], [30, 10], [60, 14], [56, 44]],
  // cygnus
  [[50, 8], [50, 40], [50, 72], [20, 36], [50, 40], [80, 44]],
];
function Constellation({ seed, className, style }: P & { seed: number }) {
  const pts = CONSTELLATIONS[seed % CONSTELLATIONS.length];
  const uniq = pts.filter((p, i) => pts.findIndex((q) => q[0] === p[0] && q[1] === p[1]) === i);
  return (
    <svg className={className} style={style} viewBox="0 0 90 84">
      <polyline points={pts.map((p) => p.join(',')).join(' ')} fill="none" stroke={GOLD} strokeWidth="0.7" opacity="0.75" />
      {uniq.map(([x, y], i) => (
        <g key={i}>
          <circle cx={x} cy={y} r={i % 3 ? 1.6 : 2.4} fill="#fff6d6" />
          <circle cx={x} cy={y} r="5" fill="#fff6d6" opacity="0.12" />
        </g>
      ))}
    </svg>
  );
}

/* ------------------------------------------------------------------ frame */

function GoldFrame({ image, onChange, page, className, style, imprint, emptyLabel }: FrameProps) {
  const d = stampDate(page.spread?.stamp?.date);
  return (
    <figure className={`${k.photo} ${s.gold} ${className ?? ''}`} style={style}>
      <div className={s.goldWindow}>
        <ImageSlot image={image} onChange={onChange} emptyLabel={emptyLabel} />
      </div>
      {['tl', 'tr', 'bl', 'br'].map((c) => (
        <Star key={c} className={`${s.corner} ${s[c]}`} />
      ))}
      {imprint && d.ok && <figcaption className={s.goldDate}>{`${d.mon} ${String(d.d).padStart(2, '0')}`}</figcaption>}
    </figure>
  );
}

/* ------------------------------------------------------------------ covers */

function ChartCover({ book }: PageProps) {
  const r = seeded(7);
  return (
    <div className={`${s.board} paper`}>
      <svg className={s.chart} viewBox="0 0 200 200">
        {[96, 80, 60, 40].map((rr) => (
          <circle key={rr} cx="100" cy="100" r={rr} fill="none" stroke={GOLD} strokeWidth={rr === 96 ? 1.2 : 0.5} opacity="0.8" />
        ))}
        {Array.from({ length: 24 }, (_, i) => (
          <line key={i} x1="100" y1="100" x2={100 + 96 * Math.cos((i * Math.PI) / 12)} y2={100 + 96 * Math.sin((i * Math.PI) / 12)} stroke={GOLD} strokeWidth="0.3" opacity="0.5" />
        ))}
        {Array.from({ length: 72 }, (_, i) => (
          <line key={`t${i}`} x1={100 + 96 * Math.cos((i * Math.PI) / 36)} y1={100 + 96 * Math.sin((i * Math.PI) / 36)} x2={100 + (i % 3 ? 93 : 90) * Math.cos((i * Math.PI) / 36)} y2={100 + (i % 3 ? 93 : 90) * Math.sin((i * Math.PI) / 36)} stroke={GOLD} strokeWidth="0.6" />
        ))}
        {Array.from({ length: 90 }, (_, i) => {
          const a = r() * Math.PI * 2;
          const d = Math.sqrt(r()) * 92;
          return <circle key={`s${i}`} cx={100 + d * Math.cos(a)} cy={100 + d * Math.sin(a)} r={r() * 1.1 + 0.3} fill="#fff6d6" opacity={0.5 + r() * 0.5} />;
        })}
      </svg>
      <div className={s.chartCenter}>
        <p className={s.chartTitle}>{book.meta.title}</p>
        <p className={s.chartKicker}>{book.meta.kicker}</p>
      </div>
      <p className={s.chartDate}>{book.meta.dateLine}</p>
    </div>
  );
}

function MoonCover({ book }: PageProps) {
  const e = useBookEdits();
  const [a = ''] = lineSlots(book.meta.coverLines, 1, e.editing);
  return (
    <div className={`${s.board} paper`}>
      <Phases className={s.phasesTop} />
      <FullMoon className={s.bigMoon} />
      <p className={s.moonTitle}>{book.meta.title}</p>
      <EditableText className={s.moonLine} value={a} onCommit={e.metaLine('coverLines', 0)} placeholder="一句话" />
    </div>
  );
}

/* ------------------------------------------------------------------ pages */

function Endpaper() {
  return (
    <div className={`${s.fill} ${s.starfield} paper`}>
      <Constellation seed={2} className={s.endConst} />
    </div>
  );
}

function Title({ book }: PageProps) {
  const m = book.meta;
  const e = useBookEdits();
  return (
    <div className={`${s.fill} paper`}>
      <div className={s.titleInner}>
        <CompassRose className={s.titleRose} />
        <EditableText className={s.kicker} value={m.kicker} onCommit={e.meta('kicker')} placeholder="一行小字" />
        <EditableText as="h1" className={s.title} value={m.title} onCommit={e.meta('title')} placeholder="书名" />
        <EditableText className={s.subtitle} value={m.subtitle} onCommit={e.meta('subtitle')} placeholder="副标题" />
      </div>
      <EditableText className={s.dateLine} value={m.dateLine} onCommit={e.meta('dateLine')} placeholder="日期" />
    </div>
  );
}

function Finis() {
  return (
    <div className={`${s.fill} ${s.finis} paper`}>
      <Crescent className={s.finisMoon} />
      <p>晚安</p>
    </div>
  );
}

/* ------------------------------------------------------------------ decorations */

function ConstDecor({ page, seed }: DecorProps) {
  const right = page.side !== 'left';
  return <Constellation seed={seed + (right ? 1 : 0)} className={s.decoConst} style={{ [right ? 'right' : 'left']: '5%' }} />;
}

function MoonsDecor({ page }: DecorProps) {
  if (page.side === 'right') return null;
  return <Phases className={s.decoPhases} />;
}

function StarsDecor({ page, seed }: DecorProps) {
  const r = seeded(seed + (page.side === 'right' ? 3 : 0));
  return (
    <>
      {Array.from({ length: 9 }, (_, i) => {
        const edge = r() > 0.5;
        return (
          <Star
            key={i}
            className={s.twinkle}
            style={{ left: `${edge ? r() * 100 : r() > 0.5 ? 3 + r() * 6 : 91 + r() * 6}%`, top: `${edge ? (r() > 0.5 ? 2 + r() * 5 : 93 + r() * 5) : r() * 100}%`, width: `${1.4 + r() * 2}cqw`, opacity: 0.5 + r() * 0.5 }}
          />
        );
      })}
    </>
  );
}

function OrbitDecor({ page }: DecorProps) {
  const right = page.side !== 'left';
  return (
    <svg className={s.orbit} style={{ [right ? 'right' : 'left']: '-18%' }} viewBox="0 0 100 100">
      <ellipse cx="50" cy="50" rx="48" ry="20" transform="rotate(-20 50 50)" />
      <ellipse cx="50" cy="50" rx="36" ry="14" transform="rotate(-20 50 50)" />
      <circle cx="50" cy="50" r="5" />
      <circle cx="90" cy="36" r="2" />
    </svg>
  );
}

/* ------------------------------------------------------------------ sample */

function sample(): BookDoc {
  const img = (f: string, alt: string, x = 0.5) => ({ src: art(f), alt, focal: { x, y: 0.5 } });
  return {
    id: 'sample-starry',
    version: 1,
    themeId: 'starry',
    coverVariant: 'chart',
    meta: {
      kicker: '八月 · 高原',
      title: '我们看过的星星',
      subtitle: '一张写给你的星图',
      author: '阿遥',
      dateLine: 'MMXXIV',
      coverLines: ['那天晚上，银河离我们很近。'],
      closingLines: ['每一颗星星', '都记得那天晚上。'],
      dedication: { to: '给和我一起数星星的人', body: '我们数到第一百颗的时候，\n你睡着了。' },
      letter: { salutation: '亲爱的你：', body: '后来每次抬头，我都会先找北斗七星。\n\n然后沿着它，找到那天晚上我们在的地方。', signoff: '阿遥', date: '八月十二日 · 英仙座流星雨' },
    },
    cover: {},
    sound: { flip: true },
    spreads: [
      { id: 'n1', layout: 'full-spread', images: [img('milky', '横跨夜空的银河')], caption: '银河从山的这头，一直流到那头。', stamp: { date: '8.12', place: '高原营地' } },
      { id: 'n2', layout: 'photo-text', images: [img('tent', '星空下亮着灯的帐篷', 0.5)], title: '营地', text: '帐篷里的灯只开了一会儿。\n关掉以后，星星就一颗一颗亮起来了。', caption: '星空下的帐篷。', stamp: { date: '8.12', place: '营地' }, overrides: { decor: 'stars' } },
      { id: 'n3', layout: 'full-spread', images: [img('moonsea', '月亮照在海面上')], caption: '回程的那晚，月亮在海上铺了一条路。', stamp: { date: '8.15', place: '海边' }, overrides: { decor: 'moons' } },
      { id: 'n4', layout: 'text', images: [], caption: '光从很远的地方来，\n只为了被我们看见。', title: '观星笔记', text: '北斗七星：勺口两颗星连线延长五倍，就是北极星。\n仙后座：一个歪歪的 W。' },
    ],
  };
}

export const starryDef: ThemeDef = {
  id: 'starry',
  name: '夜空 · 星图',
  group: 'classic',
  blurb: '深蓝夜空、烫金细线、星座连线和月相',
  className: s.theme,
  fonts: ['Cinzel', 'Noto Serif SC'],
  photo: 'mount',
  Frame: GoldFrame,
  palettes: [
    { id: 'navy', name: '深夜蓝', swatch: ['#0f1a33', '#e9e3d2', '#d4b26a'], vars: {} },
    {
      id: 'violet',
      name: '午夜紫',
      swatch: ['#1c1433', '#ece4f4', '#e0b86e'],
      vars: { '--paper': '#1c1433', '--paper-deep': '#150f28', '--paper-edge': '#2c2247', '--board': '#170f2b', '--gold': '#e0b86e' },
    },
    {
      id: 'chart',
      name: '羊皮纸星图',
      swatch: ['#efe4c8', '#2a2440', '#9a7a3a'],
      vars: {
        '--paper': '#efe4c8',
        '--paper-deep': '#e4d6b4',
        '--paper-edge': '#cdbd94',
        '--board': '#1c2440',
        '--ink': '#2a2440',
        '--ink-soft': '#554c6a',
        '--gold': '#9a7a3a',
        '--room': '#f6f1e6',
      },
    },
  ],
  ornaments: {
    divider: () => <Star style={{ width: '4cqw' }} />,
  },
  decor: [
    { id: 'constellation', label: '星座连线', Component: ConstDecor },
    { id: 'moons', label: '月相', Component: MoonsDecor },
    { id: 'stars', label: '星点', Component: StarsDecor },
    { id: 'orbit', label: '轨道', Component: OrbitDecor },
  ],
  stickers: {
    crescent: { label: '弯月', Component: Crescent },
    moon: { label: '满月', Component: FullMoon },
    star: { label: '星星', Component: Star },
    shooting: { label: '流星', Component: ShootingStar },
    saturn: { label: '土星', Component: Saturn },
    telescope: { label: '望远镜', Component: Telescope },
    dipper: { label: '北斗七星', Component: Dipper },
    rose: { label: '罗盘', Component: CompassRose },
    comet: { label: '彗星', Component: Comet },
    sun: { label: '太阳', Component: Sun },
  },
  covers: [
    { id: 'chart', name: '星图', Component: ChartCover },
    { id: 'moon', name: '月相', Component: MoonCover },
  ],
  pages: { endpaper: Endpaper, title: Title, finis: Finis },
  photoFilter: { label: '夜色', css: 'saturate(0.88) contrast(1.06) brightness(0.96) hue-rotate(-6deg)', overlay: 'grain' },
  wrap: { kind: 'envelope', paper: '#1b2a4a', flap: '#22345a', seal: '#c6a14e', mark: '★', ink: '#e8d6a0' },
  scene: StarryScene,
  sound: starrySound,
  sample,
};
