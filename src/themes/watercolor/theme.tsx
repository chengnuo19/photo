import { WatercolorScene, watercolorSound } from './scene';
import type { CSSProperties } from 'react';
import { EditableText, ImageSlot } from '../../components/Editor/Editable';
import type { BookDoc } from '../../data/schema';
import { seeded } from '../context';
import k from '../kit/kit.module.css';
import { lineSlots, stampDate, useBookEdits } from '../shared';
import type { DecorProps, FrameProps, PageProps, ThemeDef } from '../types';
import s from './watercolor.module.css';

const art = (f: string) => `${import.meta.env.BASE_URL}assets/themes/watercolor/${f}.svg`;
type P = { className?: string; style?: CSSProperties };

/* ------------------------------------------------------------------ ornaments (soft, translucent) */

const Daisy = ({ className, style, color = '#f2b5c4' }: P & { color?: string }) => (
  <svg className={className} style={style} viewBox="0 0 80 110">
    <path d="M40 60 C38 80 44 94 40 108" stroke="#8fae78" strokeWidth="2.5" fill="none" />
    <path d="M41 86 q12 -8 18 -2 q-8 8 -18 2Z" fill="#9dbd85" opacity="0.8" />
    {Array.from({ length: 8 }, (_, i) => (
      <ellipse key={i} cx="40" cy="22" rx="7" ry="17" fill={color} opacity="0.75" transform={`rotate(${i * 45} 40 38)`} />
    ))}
    <circle cx="40" cy="38" r="7" fill="#f2c45a" opacity="0.9" />
  </svg>
);
const Cosmos = ({ className, style }: P) => <Daisy className={className} style={style} color="#c9a5e0" />;
const Buttercup = ({ className, style }: P) => <Daisy className={className} style={style} color="#f6d67a" />;
const Leaf = ({ className, style }: P) => (
  <svg className={className} style={style} viewBox="0 0 60 100">
    <path d="M30 96 C8 70 6 30 30 4 C54 30 52 70 30 96Z" fill="#9dbd85" opacity="0.7" />
    <path d="M30 96 V10 M30 40 l-12 -10 M30 56 l14 -12 M30 72 l-12 -8" stroke="#6f9a52" strokeWidth="1.5" fill="none" opacity="0.8" />
  </svg>
);
const Fern = ({ className, style }: P) => (
  <svg className={className} style={style} viewBox="0 0 60 130">
    <path d="M30 128 C28 90 32 40 30 4" stroke="#6f9a52" strokeWidth="2" fill="none" />
    {Array.from({ length: 11 }, (_, i) => (
      <g key={i} fill="#8fb77a" opacity="0.7">
        <ellipse cx={20} cy={20 + i * 10} rx={10 - i * 0.4} ry="3.4" transform={`rotate(-25 20 ${20 + i * 10})`} />
        <ellipse cx={40} cy={20 + i * 10} rx={10 - i * 0.4} ry="3.4" transform={`rotate(25 40 ${20 + i * 10})`} />
      </g>
    ))}
  </svg>
);
const Brush = ({ className, style }: P) => (
  <svg className={className} style={style} viewBox="0 0 160 30">
    <rect x="40" y="11" width="110" height="8" rx="4" fill="#b88a5a" />
    <rect x="26" y="10" width="18" height="10" fill="#c9c9c9" />
    <path d="M26 15 C14 6 4 12 2 15 C4 18 14 24 26 15Z" fill="#6e8fb5" />
  </svg>
);
const PaintTube = ({ className, style }: P) => (
  <svg className={className} style={style} viewBox="0 0 120 50">
    <path d="M10 8 H86 L100 18 V32 L86 42 H10 Q4 25 10 8Z" fill="#eee9e0" stroke="#bbb" />
    <rect x="30" y="14" width="40" height="22" fill="#e98aa0" opacity="0.85" />
    <rect x="100" y="19" width="14" height="12" rx="2" fill="#666" />
  </svg>
);
const Palette = ({ className, style }: P) => (
  <svg className={className} style={style} viewBox="0 0 100 80">
    <path d="M50 6 C88 6 98 36 90 54 C84 66 70 58 64 66 C58 76 40 78 24 70 C4 60 2 30 16 18 C26 10 38 6 50 6Z" fill="#f4ede0" stroke="#c8b99c" />
    <circle cx="30" cy="30" r="7" fill="#e98aa0" opacity="0.85" />
    <circle cx="50" cy="22" r="7" fill="#f6d67a" opacity="0.85" />
    <circle cx="70" cy="28" r="7" fill="#8fc3dd" opacity="0.85" />
    <circle cx="26" cy="50" r="7" fill="#9dbd85" opacity="0.85" />
    <ellipse cx="52" cy="52" rx="8" ry="6" fill="#fff" stroke="#c8b99c" />
  </svg>
);
const Teacup = ({ className, style }: P) => (
  <svg className={className} style={style} viewBox="0 0 100 70">
    <ellipse cx="46" cy="60" rx="42" ry="8" fill="#e7eef2" />
    <path d="M14 24 H78 Q76 56 46 58 Q16 56 14 24Z" fill="#fbf8f2" stroke="#b9c8d0" />
    <ellipse cx="46" cy="24" rx="32" ry="6" fill="#c98a5a" opacity="0.8" />
    <path d="M78 30 q16 0 12 14 q-4 8 -16 6" stroke="#b9c8d0" strokeWidth="3" fill="none" />
    <path d="M30 40 q8 6 16 0 q8 -6 16 0" stroke="#8fc3dd" strokeWidth="2" fill="none" opacity="0.8" />
  </svg>
);
const Butterfly = ({ className, style }: P) => (
  <svg className={className} style={style} viewBox="0 0 90 70">
    <path d="M45 35 C30 5 8 8 10 28 C12 40 30 42 45 35Z" fill="#8fc3dd" opacity="0.75" />
    <path d="M45 35 C60 5 82 8 80 28 C78 40 60 42 45 35Z" fill="#8fc3dd" opacity="0.75" />
    <path d="M45 37 C32 50 20 62 30 64 C38 66 44 52 45 37Z" fill="#c9a5e0" opacity="0.7" />
    <path d="M45 37 C58 50 70 62 60 64 C52 66 46 52 45 37Z" fill="#c9a5e0" opacity="0.7" />
    <path d="M45 22 V52 M45 22 l-6 -10 M45 22 l6 -10" stroke="#5a5a5a" strokeWidth="1.6" fill="none" />
  </svg>
);
const Ribbon = ({ className, style }: P) => (
  <svg className={className} style={style} viewBox="0 0 90 60">
    <path d="M45 26 C30 8 8 8 10 22 C12 34 32 32 45 26Z M45 26 C60 8 82 8 80 22 C78 34 58 32 45 26Z" fill="#f2b5c4" opacity="0.85" />
    <path d="M42 28 L30 58 L38 54 L44 58 Z M48 28 L60 58 L52 54 L46 58Z" fill="#e98aa0" opacity="0.85" />
    <circle cx="45" cy="27" r="5" fill="#e98aa0" />
  </svg>
);

/* ------------------------------------------------------------------ frame */

/** The photo sits on a wash of colour and its own edges bleed like wet paint. */
function WashFrame({ image, onChange, page, className, style, imprint, emptyLabel }: FrameProps) {
  const d = stampDate(page.spread?.stamp?.date);
  return (
    <figure className={`${k.photo} ${s.washFrame} ${className ?? ''}`} style={style}>
      <span className={s.washBehind} aria-hidden />
      <div className={s.washWindow}>
        <ImageSlot image={image} onChange={onChange} emptyLabel={emptyLabel} />
      </div>
      {imprint && d.ok && <figcaption className={s.handDate}>{`${d.m}/${d.d}`}</figcaption>}
    </figure>
  );
}

/* ------------------------------------------------------------------ covers */

function WashCover({ book }: PageProps) {
  const e = useBookEdits();
  const [a = ''] = lineSlots(book.meta.coverLines, 1, e.editing);
  return (
    <div className={`${s.board} paper`}>
      <span className={s.bigWash1} />
      <span className={s.bigWash2} />
      <span className={s.bigWash3} />
      <p className={s.coverTitle}>{book.meta.title}</p>
      <EditableText className={s.coverLine} value={a} onCommit={e.metaLine('coverLines', 0)} placeholder="一句话" />
      <p className={s.coverDate}>{book.meta.dateLine}</p>
    </div>
  );
}

function WreathCover({ book }: PageProps) {
  const leaves = Array.from({ length: 16 }, (_, i) => i);
  return (
    <div className={`${s.board} paper`}>
      <div className={s.wreath}>
        {leaves.map((i) => {
          const a = (i / leaves.length) * 360;
          const C = [Leaf, Daisy, Leaf, Fern, Cosmos, Leaf, Buttercup, Leaf][i % 8];
          return <C key={i} className={s.wreathItem} style={{ transform: `rotate(${a}deg) translateY(-30cqw) rotate(${i % 2 ? 20 : -20}deg)` }} />;
        })}
      </div>
      <p className={s.wreathTitle}>{book.meta.title}</p>
      <p className={s.wreathKicker}>{book.meta.kicker}</p>
    </div>
  );
}

/* ------------------------------------------------------------------ pages */

function Title({ book }: PageProps) {
  const m = book.meta;
  const e = useBookEdits();
  return (
    <div className={`${s.fill} paper`}>
      <span className={s.titleWash} />
      <div className={s.titleInner}>
        <EditableText className={s.kicker} value={m.kicker} onCommit={e.meta('kicker')} placeholder="一行小字" />
        <EditableText as="h1" className={s.title} value={m.title} onCommit={e.meta('title')} placeholder="书名" />
        <EditableText className={s.subtitle} value={m.subtitle} onCommit={e.meta('subtitle')} placeholder="副标题" />
      </div>
      <Daisy className={s.titleDaisy} />
      <EditableText className={s.dateLine} value={m.dateLine} onCommit={e.meta('dateLine')} placeholder="日期" />
    </div>
  );
}

function Finis() {
  return (
    <div className={`${s.fill} ${s.finis} paper`}>
      <Fern className={s.finisFern} />
      <p>the end</p>
    </div>
  );
}

/* ------------------------------------------------------------------ decorations */

function SplashDecor({ page, seed }: DecorProps) {
  const r = seeded(seed + (page.side === 'right' ? 9 : 0));
  // tucked into the corners so the paint never sits on a photo
  const spots = [
    [-2 + r() * 8, -2 + r() * 6],
    [94 + r() * 8, 96 + r() * 6],
  ];
  return (
    <>
      {spots.map(([x, y], i) => (
        <span key={i} className={s.splash} data-i={i} style={{ left: `${x}%`, top: `${y}%` }} />
      ))}
    </>
  );
}

function FlowersDecor({ page, seed }: DecorProps) {
  const r = seeded(seed);
  const C = [Daisy, Cosmos, Buttercup][Math.floor(r() * 3)];
  const right = page.side !== 'left';
  return (
    <>
      <C className={s.pressed} style={{ [right ? 'right' : 'left']: '5%', bottom: '4%', rotate: `${right ? 25 : -25}deg` }} />
      <Leaf className={s.pressedLeaf} style={{ [right ? 'right' : 'left']: '16%', bottom: '3%', rotate: `${right ? 60 : -60}deg` }} />
    </>
  );
}

function SwatchesDecor({ page }: DecorProps) {
  if (page.side === 'right') return null;
  return (
    <div className={s.swatches}>
      {['var(--wash-1)', 'var(--wash-2)', 'var(--wash-3)', '#f6d67a'].map((c, i) => (
        <span key={i} style={{ background: c }} />
      ))}
    </div>
  );
}

/** Pencil sketches in the margins: a little sun at the outer top corner, a looping arrow below. */
function PencilDecor({ page, seed }: DecorProps) {
  const r = seeded(seed + (page.side === 'right' ? 4 : 0));
  const outer = page.side === 'left' ? 'left' : 'right';
  const rays = Array.from({ length: 9 }, (_, i) => {
    const a = (i / 9) * Math.PI * 2 + r() * 0.2;
    const r0 = 13 + r() * 2;
    const r1 = 19 + r() * 4;
    return `M${(30 + Math.cos(a) * r0).toFixed(1)} ${(30 + Math.sin(a) * r0).toFixed(1)} L${(30 + Math.cos(a) * r1).toFixed(1)} ${(30 + Math.sin(a) * r1).toFixed(1)}`;
  });
  return (
    <>
      <svg className={s.pencilSun} viewBox="0 0 60 60" style={{ [outer]: '3%' }} aria-hidden>
        {/* sketched twice, slightly off, like a real pencil */}
        <path d="M30 19 C37 18.5 41.5 24 41 30.5 C40.5 37 35 41.2 29 40.8 C22.5 40.2 18.6 35 19.2 29 C19.8 23 24 19.3 30.6 19.6" />
        <path d="M30.6 19.2 C36.8 20 40.6 25.5 40.2 31" opacity="0.5" />
        {rays.map((d, i) => (
          <path key={i} d={d} />
        ))}
        <path d="M26 28 q1 -1.4 2 0 M32 28 q1 -1.4 2 0 M26.5 33 q3.5 3 7 0" />
      </svg>
      <svg className={s.pencilArrow} viewBox="0 0 120 40" style={{ [outer]: '5%', scale: page.side === 'left' ? undefined : '-1 1' }} aria-hidden>
        <path d="M4 30 C24 32 30 8 44 12 C56 16 46 32 36 26 C28 20 50 6 72 16 C88 23 100 22 112 14" />
        <path d="M104 11.5 L112.5 13.6 L107 20.5" />
      </svg>
    </>
  );
}

/* ------------------------------------------------------------------ sample */

function sample(): BookDoc {
  const img = (f: string, alt: string, x = 0.5) => ({ src: art(f), alt, focal: { x, y: 0.5 } });
  return {
    id: 'sample-watercolor',
    version: 1,
    themeId: 'watercolor',
    coverVariant: 'wash',
    meta: {
      kicker: '四月 · 小镇',
      title: '慢慢的春天',
      subtitle: '用水彩记下的一个月',
      author: '小满',
      dateLine: '2024 · 春',
      coverLines: ['把颜色留给记忆，把轮廓留给时间。'],
      closingLines: ['颜色会淡，', '但那天的风还在。'],
      dedication: { to: '给喜欢慢一点的你', body: '水彩要等它自己干，\n日子也是。' },
      letter: { salutation: '亲爱的你：', body: '这一个月，我画了很多花，也喝了很多茶。\n\n等你来的时候，我们去那家海边的小咖啡馆吧。', signoff: '小满', date: '四月末' },
    },
    cover: {},
    sound: { flip: true },
    spreads: [
      { id: 'c1', layout: 'full-spread', images: [img('flowers', '开满野花的山坡')], caption: '山坡上的花，一夜之间全开了。', stamp: { date: '4.3', place: '后山' } },
      { id: 'c2', layout: 'photo-text', images: [img('cafe', '海边的小咖啡馆', 0.35)], title: '海边咖啡馆', text: '条纹遮阳棚，蓝色的窗。\n老板说，下雨天的咖啡最好喝。', caption: '海边的小咖啡馆。', stamp: { date: '4.12', place: '港口' } },
      { id: 'c3', layout: 'photo-text', images: [img('tea', '一杯茶和几朵压花', 0.4)], title: '下午四点', text: '把路边捡的花夹进书里，\n等它们变成薄薄的一片春天。', caption: '一杯茶，几朵花。', stamp: { date: '4.20', place: '窗边' }, overrides: { decor: 'flowers' } },
      { id: 'c4', layout: 'text', images: [], caption: '慢一点，\n颜色才来得及晕开。', title: '四月的日记', text: '今天什么也没做。\n画了一张不太满意的画，然后睡了一个很长的午觉。' },
    ],
  };
}

export const watercolorDef: ThemeDef = {
  id: 'watercolor',
  name: '水彩日记',
  group: 'classic',
  blurb: '晕染的边缘、铅笔手写、压花和颜料色卡',
  className: s.theme,
  fonts: ['LXGW WenKai', 'Caveat'],
  photo: 'mount',
  Frame: WashFrame,
  palettes: [
    { id: 'mist', name: '晨雾', swatch: ['#f8f5ef', '#a9c7de', '#e98aa0'], vars: {} },
    {
      id: 'mint',
      name: '薄荷',
      swatch: ['#f2f6f0', '#9fcfb8', '#f6c56a'],
      vars: { '--paper': '#f2f6f0', '--paper-deep': '#e7eee4', '--paper-edge': '#d4ddd0', '--board': '#eef3eb', '--wash-1': '#9fcfb8', '--wash-2': '#c7e1a8', '--wash-3': '#f6d67a' },
    },
    {
      id: 'blossom',
      name: '樱粉',
      swatch: ['#fbf2f1', '#f2b5c4', '#c9a5e0'],
      vars: { '--paper': '#fbf2f1', '--paper-deep': '#f4e6e4', '--paper-edge': '#e6d2cf', '--board': '#f8ecea', '--wash-1': '#f2b5c4', '--wash-2': '#c9a5e0', '--wash-3': '#f7d2a8' },
    },
  ],
  ornaments: {
    divider: () => <Leaf style={{ width: '6cqw', rotate: '90deg' }} />,
    titleMark: () => <Butterfly />,
  },
  decor: [
    { id: 'splash', label: '水彩晕染', Component: SplashDecor },
    { id: 'flowers', label: '压花', Component: FlowersDecor },
    { id: 'swatches', label: '颜料色卡', Component: SwatchesDecor },
    { id: 'pencil', label: '铅笔涂鸦', Component: PencilDecor },
  ],
  stickers: {
    daisy: { label: '雏菊', Component: Daisy },
    cosmos: { label: '波斯菊', Component: Cosmos },
    buttercup: { label: '毛茛', Component: Buttercup },
    leaf: { label: '叶子', Component: Leaf },
    fern: { label: '蕨', Component: Fern },
    brush: { label: '画笔', Component: Brush },
    tube: { label: '颜料管', Component: PaintTube },
    palette: { label: '调色盘', Component: Palette },
    teacup: { label: '茶杯', Component: Teacup },
    butterfly: { label: '蝴蝶', Component: Butterfly },
    ribbon: { label: '蝴蝶结', Component: Ribbon },
  },
  covers: [
    { id: 'wash', name: '水彩晕染', Component: WashCover },
    { id: 'wreath', name: '花环', Component: WreathCover },
  ],
  pages: { title: Title, finis: Finis },
  photoFilter: { label: '水彩柔化', css: 'saturate(0.86) brightness(1.06) contrast(0.92)', overlay: 'paper' },
  wrap: { kind: 'ribbon', paper: '#f5f0e8', pattern: 'wash', ribbon: '#e9a7c0', ink: '#5a5048' },
  scene: WatercolorScene,
  sound: watercolorSound,
  sample,
};
