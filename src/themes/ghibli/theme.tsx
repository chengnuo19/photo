import { GhibliScene, ghibliSound } from './scene';
import { useId } from 'react';
import type { CSSProperties } from 'react';
import { EditableText, ImageSlot } from '../../components/Editor/Editable';
import type { BookDoc } from '../../data/schema';
import { seeded } from '../context';
import k from '../kit/kit.module.css';
import { lineSlots, stampDate, useBookEdits } from '../shared';
import type { DecorProps, FrameProps, PageProps, ThemeDef } from '../types';
import s from './ghibli.module.css';

const art = (f: string) => `${import.meta.env.BASE_URL}assets/themes/ghibli/${f}.svg`;
type P = { className?: string; style?: CSSProperties };

/* ------------------------------------------------------------------ objects & places (no characters) */

const Umbrella = ({ className, style }: P) => (
  <svg className={className} style={style} viewBox="0 0 100 110">
    <path d="M6 44 Q50 -6 94 44 Q83 36 72 44 Q61 36 50 44 Q39 36 28 44 Q17 36 6 44Z" fill="#d2352c" />
    <path d="M50 8 V44 M28 44 Q40 20 50 8 Q60 20 72 44" stroke="#a42620" strokeWidth="1.2" fill="none" />
    <path d="M50 44 V96 q0 10 -10 10 q-8 0 -8 -8" stroke="#6b4a2a" strokeWidth="4" fill="none" strokeLinecap="round" />
  </svg>
);
const BusStop = ({ className, style }: P) => (
  <svg className={className} style={style} viewBox="0 0 60 130">
    <rect x="27" y="40" width="6" height="88" fill="#cfc6ad" />
    <circle cx="30" cy="26" r="22" fill="#e4dac0" stroke="#7a6a48" strokeWidth="3" />
    <text x="30" y="31" textAnchor="middle" fontFamily="Noto Serif SC, serif" fontSize="13" fill="#4a3a28">
      车站
    </text>
    <rect x="20" y="70" width="20" height="26" fill="#f2ecd8" stroke="#7a6a48" />
  </svg>
);
const Seaplane = ({ className, style }: P) => (
  <svg className={className} style={style} viewBox="0 0 140 70">
    <path d="M10 34 C30 22 100 22 124 34 C100 44 30 44 10 34Z" fill="#c8302a" />
    <rect x="40" y="12" width="70" height="7" fill="#c8302a" />
    <rect x="40" y="48" width="70" height="7" fill="#a82420" />
    <line x1="56" y1="19" x2="56" y2="48" stroke="#555" strokeWidth="2" />
    <line x1="94" y1="19" x2="94" y2="48" stroke="#555" strokeWidth="2" />
    <path d="M10 34 l-8 -18 l10 0 l12 14Z" fill="#c8302a" />
    <ellipse cx="127" cy="34" rx="3" ry="20" fill="#ccc" opacity="0.7" />
    <ellipse cx="70" cy="64" rx="36" ry="5" fill="#eee" />
  </svg>
);
const Acorn = ({ className, style }: P) => (
  <svg className={className} style={style} viewBox="0 0 50 64">
    <path d="M8 26 C8 50 18 60 25 62 C32 60 42 50 42 26Z" fill="#b8793e" />
    <path d="M4 26 C4 12 46 12 46 26 C40 30 10 30 4 26Z" fill="#7a5530" />
    <path d="M10 20 l30 0 M8 24 l34 0" stroke="#5e3f22" strokeWidth="1.4" />
    <path d="M25 12 q2 -8 8 -10" stroke="#5e3f22" strokeWidth="3" fill="none" strokeLinecap="round" />
    <ellipse cx="18" cy="40" rx="3" ry="8" fill="#fff" opacity="0.3" />
  </svg>
);
const StrawHat = ({ className, style }: P) => (
  <svg className={className} style={style} viewBox="0 0 120 60">
    <ellipse cx="60" cy="40" rx="56" ry="16" fill="#e9c877" stroke="#b8943f" strokeWidth="2" />
    <path d="M30 38 C30 10 90 10 90 38Z" fill="#f0d58a" stroke="#b8943f" strokeWidth="2" />
    <path d="M31 30 H89 V37 H31Z" fill="#d2352c" />
  </svg>
);
const WindChime = ({ className, style }: P) => (
  <svg className={className} style={style} viewBox="0 0 60 120">
    <line x1="30" y1="0" x2="30" y2="10" stroke="#555" strokeWidth="1.5" />
    <path d="M10 36 C10 12 50 12 50 36Z" fill="#e8f4fa" stroke="#9cc3d6" strokeWidth="2" />
    <path d="M14 30 q6 -8 12 0 M34 30 q6 -8 12 0" stroke="#d2352c" strokeWidth="2" fill="none" />
    <line x1="30" y1="36" x2="30" y2="70" stroke="#555" />
    <rect x="20" y="70" width="20" height="46" fill="#fbf8f0" stroke="#bbb" />
    <path d="M24 80 h12 M24 90 h8" stroke="#6d8fb5" strokeWidth="1.5" />
  </svg>
);
const Watermelon = ({ className, style }: P) => (
  <svg className={className} style={style} viewBox="0 0 100 60">
    <path d="M4 8 A46 46 0 0 0 96 8Z" fill="#3f8f3a" />
    <path d="M10 8 A40 40 0 0 0 90 8Z" fill="#f4f0d8" />
    <path d="M14 8 A36 36 0 0 0 86 8Z" fill="#e8454a" />
    {[[30, 18], [44, 28], [58, 22], [70, 14], [50, 14]].map(([x, y], i) => (
      <ellipse key={i} cx={x} cy={y} rx="2" ry="3.4" fill="#2b2b2b" />
    ))}
  </svg>
);
const Sunflower = ({ className, style }: P) => (
  <svg className={className} style={style} viewBox="0 0 70 120">
    <path d="M35 60 V118" stroke="#4f8f2f" strokeWidth="4" />
    <path d="M35 90 q-18 -10 -24 2 q12 8 24 -2Z" fill="#5fa03a" />
    {Array.from({ length: 14 }, (_, i) => (
      <ellipse key={i} cx="35" cy="14" rx="6" ry="14" fill="#f5c542" transform={`rotate(${i * 26} 35 32)`} />
    ))}
    <circle cx="35" cy="32" r="13" fill="#7a4a1e" />
  </svg>
);
const Dandelion = ({ className, style }: P) => (
  <svg className={className} style={style} viewBox="0 0 60 110">
    <path d="M30 40 C30 70 26 90 30 108" stroke="#7aa05a" strokeWidth="2" fill="none" />
    {Array.from({ length: 22 }, (_, i) => {
      const a = (i / 22) * Math.PI * 2;
      return (
        <g key={i}>
          <line x1="30" y1="28" x2={30 + Math.cos(a) * 20} y2={28 + Math.sin(a) * 20} stroke="#f6f6f0" strokeWidth="0.8" />
          <circle cx={30 + Math.cos(a) * 21} cy={28 + Math.sin(a) * 21} r="2" fill="#fff" />
        </g>
      );
    })}
    <circle cx="30" cy="28" r="3" fill="#cfc8a8" />
  </svg>
);
const PaperPlane = ({ className, style }: P) => (
  <svg className={className} style={style} viewBox="0 0 100 60">
    <path d="M4 30 L96 6 L60 54 L46 38Z" fill="#fbfbf6" stroke="#9aa3ad" strokeWidth="1.5" />
    <path d="M46 38 L96 6 L40 30Z" fill="#e6ebef" stroke="#9aa3ad" strokeWidth="1.2" />
    <path d="M4 30 q-20 10 -30 30" stroke="#9aa3ad" strokeDasharray="3 4" fill="none" />
  </svg>
);
/** A summer cumulus: bright billowing top, lavender-blue shade underneath, a flat base. */
const BILLOWS: [number, number, number][] = [
  [46, 70, 24], [70, 52, 30], [100, 36, 38], [136, 44, 32], [162, 60, 24], [118, 62, 30], [84, 68, 26], [150, 72, 18], [30, 78, 14],
];
const Cloud = ({ className, style }: P) => {
  // unique ids: pages hidden by the flip engine would otherwise break shared gradient refs
  const id = useId().replace(/:/g, '');
  return (
  <svg className={className} style={style} viewBox="0 0 200 100" aria-hidden>
    <defs>
      <linearGradient id={`${id}g`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#ffffff" />
        <stop offset="0.55" stopColor="#f6f9fd" />
        <stop offset="0.8" stopColor="#d9e3f2" />
        <stop offset="1" stopColor="#bccbe4" />
      </linearGradient>
      <clipPath id={`${id}c`}>
        <rect x="0" y="0" width="200" height="88" />
      </clipPath>
    </defs>
    <g clipPath={`url(#${id}c)`}>
      {BILLOWS.map(([x, y, r], i) => (
        <circle key={i} cx={x} cy={y} r={r} fill={`url(#${id}g)`} />
      ))}
      {/* sunlit rims on the upper billows */}
      {BILLOWS.slice(1, 5).map(([x, y, r], i) => (
        <path key={i} d={`M${x - r * 0.7} ${y - r * 0.55} A${r} ${r} 0 0 1 ${x + r * 0.5} ${y - r * 0.8}`} stroke="#fff" strokeWidth="3" fill="none" opacity="0.9" />
      ))}
      {/* soft shade band along the base */}
      <rect x="10" y="76" width="180" height="14" fill="#b3c3de" opacity="0.45" />
    </g>
    <path d="M18 88 H182" stroke="#aebfdc" strokeWidth="1.2" opacity="0.6" />
  </svg>
  );
};

/* ------------------------------------------------------------------ frame */

function CelFrame({ image, onChange, page, className, style, imprint, emptyLabel }: FrameProps) {
  const d = stampDate(page.spread?.stamp?.date);
  return (
    <figure className={`${k.photo} ${s.cel} ${className ?? ''}`} style={style}>
      <div className={s.celWindow}>
        <ImageSlot image={image} onChange={onChange} emptyLabel={emptyLabel} />
      </div>
      {imprint && d.ok && <figcaption className={s.celDate}>{`${d.m}月${d.d}日`}</figcaption>}
    </figure>
  );
}

/* ------------------------------------------------------------------ covers */

function SkyCover({ book }: PageProps) {
  const e = useBookEdits();
  const [a = ''] = lineSlots(book.meta.coverLines, 1, e.editing);
  return (
    <div className={`${s.board} ${s.skyCover}`}>
      <Cloud className={s.coverCloud1} />
      <Cloud className={s.coverCloud2} />
      <span className={s.hill1} />
      <span className={s.hill2} />
      <p className={s.skyTitle}>{book.meta.title}</p>
      <EditableText className={s.skyLine} value={a} onCommit={e.metaLine('coverLines', 0)} placeholder="一句话" />
    </div>
  );
}

function RainCover({ book }: PageProps) {
  return (
    <div className={`${s.board} ${s.rainCover}`}>
      <span className={s.rain} />
      <BusStop className={s.coverStop} />
      <Umbrella className={s.coverUmbrella} />
      <p className={s.rainTitle}>{book.meta.title}</p>
      <p className={s.rainKicker}>{book.meta.kicker}</p>
    </div>
  );
}

/* ------------------------------------------------------------------ pages */

function Title({ book }: PageProps) {
  const m = book.meta;
  const e = useBookEdits();
  return (
    <div className={`${s.fill} paper`}>
      <Cloud className={s.titleCloud} />
      <div className={s.titleInner}>
        <EditableText className={s.kicker} value={m.kicker} onCommit={e.meta('kicker')} placeholder="一行小字" />
        <EditableText as="h1" className={s.title} value={m.title} onCommit={e.meta('title')} placeholder="书名" />
        <EditableText className={s.subtitle} value={m.subtitle} onCommit={e.meta('subtitle')} placeholder="副标题" />
      </div>
      <Acorn className={s.titleAcorn} />
      <EditableText className={s.dateLine} value={m.dateLine} onCommit={e.meta('dateLine')} placeholder="日期" />
    </div>
  );
}

function Finis() {
  return (
    <div className={`${s.fill} ${s.finis} paper`}>
      <Dandelion className={s.finisDandelion} />
      <p>夏天还没有结束。</p>
    </div>
  );
}

/* ------------------------------------------------------------------ decorations */

function CloudsDecor({ page, seed }: DecorProps) {
  const r = seeded(seed + (page.side === 'right' ? 3 : 0));
  return (
    <>
      <Cloud
        className={`${s.decoCloud} mb-anim`}
        style={{ [page.side === 'left' ? 'left' : 'right']: `${-14 + r() * 4}%`, top: `${-3 + r() * 2}%`, width: `${30 + r() * 6}cqw`, animationDelay: `${-r() * 18}s` }}
      />
    </>
  );
}

function WiresDecor({ page }: DecorProps) {
  const right = page.side !== 'left';
  return (
    <svg className={s.wires} viewBox="0 0 100 40" preserveAspectRatio="none">
      {right ? (
        <>
          <rect x="84" y="0" width="2" height="40" fill="#4a3f36" />
          <rect x="78" y="6" width="14" height="1.2" fill="#4a3f36" />
          <rect x="80" y="11" width="10" height="1" fill="#4a3f36" />
        </>
      ) : null}
      <path d="M-2 10 Q40 22 86 7" stroke="#3b342e" strokeWidth="0.35" fill="none" />
      <path d="M-2 14 Q40 26 86 12" stroke="#3b342e" strokeWidth="0.3" fill="none" />
      <path d="M86 7 Q95 11 102 9" stroke="#3b342e" strokeWidth="0.35" fill="none" />
    </svg>
  );
}

function MeadowDecor({ page, seed }: DecorProps) {
  const r = seeded(seed + (page.side === 'right' ? 7 : 0));
  const flip = page.side === 'left';
  const blades = Array.from({ length: 34 }, (_, i) => {
    const x = 4 + (i / 34) * 92 + (r() - 0.5) * 4;
    // taller in the corner, fading towards the middle of the page
    const h = (1 - i / 40) * (26 + r() * 22) + 6;
    const lean = (r() - 0.35) * 10;
    const w = 1.2 + r() * 1.3;
    return { x, h, lean, w, c: ['#4f8f2f', '#6aaa3f', '#3c7a24', '#86bb52'][Math.floor(r() * 4)] };
  });
  const flowers = Array.from({ length: 5 }, (_, i) => ({ x: 8 + i * 13 + r() * 6, y: 24 + r() * 16, c: ['#fff', '#f5c542', '#f2a0b8', '#fff'][i % 4] }));
  return (
    <svg className={s.meadow} viewBox="0 0 100 60" preserveAspectRatio="xMinYMax meet" style={flip ? undefined : { transform: 'scaleX(-1)', left: 'auto', right: 0 }} aria-hidden>
      {blades.map((b, i) => (
        <path key={i} d={`M${b.x - b.w} 60 Q${b.x + b.lean * 0.3} ${60 - b.h * 0.6} ${b.x + b.lean} ${60 - b.h} Q${b.x + b.lean * 0.3 + b.w * 0.4} ${60 - b.h * 0.55} ${b.x + b.w} 60 Z`} fill={b.c} />
      ))}
      {flowers.map((f, i) => (
        <g key={i} transform={`translate(${f.x} ${f.y})`}>
          <path d={`M0 0 Q1 ${(60 - f.y) / 2} 0 ${60 - f.y}`} stroke="#4f8f2f" strokeWidth="0.6" fill="none" />
          {[0, 72, 144, 216, 288].map((a) => (
            <ellipse key={a} cx="0" cy="-1.6" rx="1" ry="1.7" fill={f.c} transform={`rotate(${a})`} />
          ))}
          <circle r="0.9" fill="#e0a41c" />
        </g>
      ))}
    </svg>
  );
}

function RainDecor() {
  return <span className={`${s.rainDecor} mb-anim`} />;
}

/* ------------------------------------------------------------------ sample */

function sample(): BookDoc {
  const img = (f: string, alt: string, x = 0.5) => ({ src: art(f), alt, focal: { x, y: 0.5 } });
  return {
    id: 'sample-ghibli',
    version: 1,
    themeId: 'ghibli',
    coverVariant: 'sky',
    meta: {
      kicker: '乡下的夏天',
      title: '风吹过的那个夏天',
      subtitle: '云很高，路很长',
      author: '阿葵',
      dateLine: '七月 · 蝉鸣',
      coverLines: ['那年夏天，风是绿色的。'],
      closingLines: ['下一个夏天，', '我们还在这里等风。'],
      dedication: { to: '给外婆家门口的那棵大树', body: '你在的地方，\n夏天总是很长很长。' },
      letter: { salutation: '亲爱的你：', body: '还记得那个下雨的车站吗？我们等了很久的车，却一点也不觉得无聊。\n\n今年夏天，我们再去一次海边的小镇吧。', signoff: '阿葵', date: '立秋前一天' },
    },
    cover: {},
    sound: { flip: true },
    spreads: [
      { id: 'g1', layout: 'full-spread', images: [img('clouds', '巨大的积雨云和绿色山坡上的大树')], caption: '云长得比山还高。', stamp: { date: '7.21', place: '外婆家' } },
      { id: 'g2', layout: 'photo-text', images: [img('busstop', '下雨的乡间车站和一把红伞', 0.6)], title: '雨中的车站', text: '雨下得很大，车迟迟不来。\n我们数着伞上的雨点，谁也没有抱怨。', caption: '雨天的车站。', stamp: { date: '7.26', place: '稻田边' }, overrides: { decor: 'rain' } },
      { id: 'g3', layout: 'full-spread', images: [img('seaplane', '红色水上飞机飞过海边小镇')], caption: '一架红色的飞机从海面上掠过。', stamp: { date: '8.2', place: '海边小镇' }, overrides: { decor: 'wires' } },
      { id: 'g4', layout: 'text', images: [], caption: '风吹过来的时候，\n要闭上眼睛。', title: '夏日笔记', text: '西瓜要泡在井水里。\n风铃响的时候，就是有风来了。' },
    ],
  };
}

export const ghibliDef: ThemeDef = {
  id: 'ghibli',
  name: '吉卜力夏日',
  group: 'screen',
  blurb: '巨大的积云、绿色山坡、雨中车站、红色飞机和夏日电线杆',
  className: s.theme,
  fonts: ['LXGW WenKai', 'Noto Serif SC'],
  photo: 'mount',
  Frame: CelFrame,
  palettes: [
    { id: 'sky', name: '晴空蓝', swatch: ['#f6f3ea', '#3d8ed1', '#6aaa3f'], vars: {} },
    {
      id: 'rain',
      name: '雨天灰',
      swatch: ['#e9ebe8', '#5d7a8a', '#d2352c'],
      vars: { '--paper': '#e9ebe8', '--paper-deep': '#dee2df', '--paper-edge': '#c9cfcb', '--accent': '#5d7a8a', '--sky-top': '#8a989e', '--sky-bottom': '#c3ccd0' },
    },
    {
      id: 'dusk',
      name: '黄昏橙',
      swatch: ['#f7ecde', '#c0632a', '#8a5a9a'],
      vars: { '--paper': '#f7ecde', '--paper-deep': '#efdfcc', '--paper-edge': '#dcc6ab', '--accent': '#b85c24', '--sky-top': '#f08a4b', '--sky-bottom': '#f9d49a' },
    },
  ],
  ornaments: {
    divider: () => <Acorn style={{ width: '4.5cqw' }} />,
  },
  decor: [
    { id: 'clouds', label: '积云', Component: CloudsDecor },
    { id: 'wires', label: '电线杆', Component: WiresDecor },
    { id: 'meadow', label: '草地', Component: MeadowDecor },
    { id: 'rain', label: '雨', Component: RainDecor },
  ],
  stickers: {
    umbrella: { label: '红伞', Component: Umbrella },
    busstop: { label: '车站牌', Component: BusStop },
    seaplane: { label: '红色飞机', Component: Seaplane },
    acorn: { label: '橡果', Component: Acorn },
    hat: { label: '草帽', Component: StrawHat },
    chime: { label: '风铃', Component: WindChime },
    melon: { label: '西瓜', Component: Watermelon },
    sunflower: { label: '向日葵', Component: Sunflower },
    dandelion: { label: '蒲公英', Component: Dandelion },
    plane: { label: '纸飞机', Component: PaperPlane },
    cloud: { label: '云', Component: Cloud },
  },
  covers: [
    { id: 'sky', name: '晴空', Component: SkyCover },
    { id: 'rain', name: '雨中车站', Component: RainCover },
  ],
  pages: { title: Title, finis: Finis },
  photoFilter: { label: '夏日通透', css: 'saturate(1.2) brightness(1.05) contrast(0.96)', overlay: 'light' },
  wrap: { kind: 'ribbon', paper: '#3a6fa8', pattern: 'dots', ribbon: '#2d5a8c', ink: '#fff' },
  scene: GhibliScene,
  sound: ghibliSound,
  sample,
};
