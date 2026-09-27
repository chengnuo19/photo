import { PokemonScene, pokemonSound } from './scene';
import type { CSSProperties } from 'react';
import { EditableText, ImageSlot } from '../../components/Editor/Editable';
import type { BookDoc } from '../../data/schema';
import { hashId, seeded } from '../context';
import k from '../kit/kit.module.css';
import { Photo } from '../kit/Photo';
import { lineSlots, useBookEdits } from '../shared';
import type { DecorProps, FrameProps, PageProps, ThemeDef } from '../types';
import s from './pokemon.module.css';

const art = (f: string) => `${import.meta.env.BASE_URL}assets/themes/pokemon/${f}.svg`;
type P = { className?: string; style?: CSSProperties };

/* ------------------------------------------------------------------ objects (no characters) */

function Ball({ className, style, top = '#e3350d', band }: P & { top?: string; band?: string }) {
  return (
    <svg className={className} style={style} viewBox="0 0 60 60">
      <circle cx="30" cy="30" r="27" fill="#f6f6f6" stroke="#222" strokeWidth="3" />
      <path d="M3 30 A27 27 0 0 1 57 30Z" fill={top} stroke="#222" strokeWidth="3" />
      {band && <path d="M12 14 L20 22 M48 14 L40 22" stroke={band} strokeWidth="5" strokeLinecap="round" />}
      <rect x="3" y="28" width="54" height="4" fill="#222" />
      <circle cx="30" cy="30" r="8" fill="#f6f6f6" stroke="#222" strokeWidth="3" />
      <circle cx="30" cy="30" r="3" fill="#fff" stroke="#bbb" />
      <path d="M14 18 q6 -8 16 -9" stroke="#fff" strokeWidth="3" fill="none" opacity="0.5" strokeLinecap="round" />
    </svg>
  );
}
const GreatBall = (p: P) => <Ball {...p} top="#2f6fd6" band="#e3350d" />;
const UltraBall = (p: P) => <Ball {...p} top="#2b2b2b" band="#f2c230" />;
const MasterBall = (p: P) => <Ball {...p} top="#7b3fb0" band="#f07ab8" />;

function Badge({ className, style, color = '#8a8f99', shape = 0 }: P & { color?: string; shape?: number }) {
  const shapes = [
    'M30 4 L52 17 L52 43 L30 56 L8 43 L8 17Z', // hexagon
    'M30 4 C44 20 52 32 52 40 A22 22 0 0 1 8 40 C8 32 16 20 30 4Z', // drop
    'M30 4 L37 23 L56 23 L41 35 L47 55 L30 43 L13 55 L19 35 L4 23 L23 23Z', // star
    'M30 6 A24 24 0 1 1 29.9 6Z M30 18 A12 12 0 1 0 30.1 18Z', // ring
  ];
  return (
    <svg className={className} style={style} viewBox="0 0 60 60">
      <path d={shapes[shape % shapes.length]} fill={color} stroke="#3a3a3a" strokeWidth="2.5" fillRule="evenodd" />
      <path d={shapes[shape % shapes.length]} fill="url(#shine)" opacity="0.6" fillRule="evenodd" />
      <defs>
        <linearGradient id="shine" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity="0.9" />
          <stop offset="0.5" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
      </defs>
    </svg>
  );
}
const BADGES = [
  ['#8a8f99', 0],
  ['#4aa3df', 1],
  ['#f2c230', 2],
  ['#5fbf5a', 3],
  ['#e0706a', 0],
  ['#b07ad8', 2],
] as const;

const Potion = ({ className, style }: P) => (
  <svg className={className} style={style} viewBox="0 0 50 80">
    <rect x="16" y="4" width="18" height="10" rx="2" fill="#6b6b6b" />
    <path d="M14 14 H36 V26 C46 32 46 76 25 76 C4 76 4 32 14 26Z" fill="#b76ad8" stroke="#3a3a3a" strokeWidth="2.5" />
    <rect x="12" y="44" width="26" height="14" fill="#fff" opacity="0.85" />
    <path d="M22 51 h6 M25 48 v6" stroke="#e3350d" strokeWidth="2.5" />
  </svg>
);
const Berry = ({ className, style }: P) => (
  <svg className={className} style={style} viewBox="0 0 60 70">
    <path d="M30 20 C8 20 6 52 30 66 C54 52 52 20 30 20Z" fill="#3d6fd6" stroke="#23346b" strokeWidth="2.5" />
    <path d="M30 20 C26 10 18 6 12 8 C18 14 24 16 30 20 C34 10 44 6 50 10 C42 14 36 16 30 20Z" fill="#5fbf5a" stroke="#2f7a2a" strokeWidth="2" />
    <circle cx="22" cy="36" r="4" fill="#fff" opacity="0.5" />
  </svg>
);
const Egg = ({ className, style }: P) => (
  <svg className={className} style={style} viewBox="0 0 50 64">
    <path d="M25 4 C10 4 4 30 4 40 A21 21 0 0 0 46 40 C46 30 40 4 25 4Z" fill="#f4eed8" stroke="#6b6b6b" strokeWidth="2.5" />
    <path d="M10 30 l6 6 l6 -6 l6 6 l6 -6 l6 6" stroke="#5fbf5a" strokeWidth="3" fill="none" />
    <circle cx="18" cy="48" r="3" fill="#5fbf5a" />
    <circle cx="32" cy="18" r="3" fill="#5fbf5a" />
  </svg>
);
const Dex = ({ className, style }: P) => (
  <svg className={className} style={style} viewBox="0 0 70 90">
    <rect x="4" y="4" width="62" height="82" rx="8" fill="#d8262e" stroke="#7a1116" strokeWidth="2.5" />
    <circle cx="18" cy="16" r="7" fill="#7fd4f7" stroke="#fff" strokeWidth="2" />
    <circle cx="32" cy="12" r="2.6" fill="#f25a5a" />
    <circle cx="40" cy="12" r="2.6" fill="#f2c230" />
    <circle cx="48" cy="12" r="2.6" fill="#5fbf5a" />
    <rect x="12" y="28" width="46" height="34" rx="3" fill="#dfe8e0" stroke="#7a1116" strokeWidth="2" />
    <rect x="16" y="32" width="38" height="26" fill="#9bd57a" />
    <path d="M14 70 h12 M20 64 v12" stroke="#2b2b2b" strokeWidth="4" />
    <circle cx="48" cy="72" r="5" fill="#2b2b2b" />
  </svg>
);
const PixelHeart = ({ className, style }: P) => (
  <svg className={className} style={style} viewBox="0 0 9 8" shapeRendering="crispEdges">
    <path d="M1 0h2v1h1v1h1V1h1V0h2v1h1v3H8v1H7v1H6v1H5v1H4V7H3V6H2V5H1V4H0V1h1z" fill="#e3350d" />
    <path d="M1 1h2v1H1z" fill="#fff" />
  </svg>
);
function GrassTuft({ className, style }: P) {
  return (
    <svg className={className} style={style} viewBox="0 0 60 36">
      <path d="M0 36 L8 6 L16 36 L22 0 L30 36 L38 8 L46 36 L52 4 L60 36Z" fill="#3f9a3a" stroke="#2a6b27" strokeWidth="1.5" />
    </svg>
  );
}

/** Pixel dialog box (two-tone border, blinking ▼). */
function Dialog({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`${s.dialog} ${className ?? ''}`}>
      <div className={s.dialogText}>{children}</div>
      <span className={`${s.dialogArrow} mb-anim`}>▼</span>
    </div>
  );
}

/* ------------------------------------------------------------------ frame: dex card */

function DexCard({ image, onChange, page, className, style, emptyLabel }: FrameProps) {
  const no = String(hashId(page.spread?.id) % 999 || 1).padStart(3, '0');
  const place = page.spread?.stamp?.place;
  return (
    <figure className={`${k.photo} ${s.card} ${className ?? ''}`} style={style}>
      <div className={s.cardHead}>
        <span className={s.cardNo}>No.{no}</span>
        <span className={s.cardName}>{place || '发现！'}</span>
      </div>
      <div className={s.cardWindow}>
        <ImageSlot image={image} onChange={onChange} emptyLabel={emptyLabel} />
      </div>
      <div className={s.cardFoot}>
        <span className={s.type} data-t={hashId(page.spread?.id) % 4}>
          {['草', '水', '火', '电'][hashId(page.spread?.id) % 4]}
        </span>
        {page.spread?.stamp?.date && <span className={s.cardDate}>{page.spread.stamp.date}</span>}
      </div>
    </figure>
  );
}

/* ------------------------------------------------------------------ covers */

function BallCover({ book }: PageProps) {
  const e = useBookEdits();
  const [a = ''] = lineSlots(book.meta.coverLines, 1, e.editing);
  return (
    <div className={`${s.board} ${s.dots} paper`}>
      <Ball className={s.coverBall} />
      <p className={s.coverTitle}>{book.meta.title}</p>
      <EditableText className={s.coverLine} value={a} onCommit={e.metaLine('coverLines', 0)} placeholder="一句话" />
    </div>
  );
}

function DexCover({ book, page }: PageProps) {
  const e = useBookEdits();
  const img = book.cover.image ?? book.spreads[0]?.images[0];
  return (
    <div className={`${s.board} ${s.dexBody}`}>
      <span className={s.lens} />
      <span className={`${s.led} ${s.l1}`} />
      <span className={`${s.led} ${s.l2}`} />
      <span className={`${s.led} ${s.l3}`} />
      <div className={s.screen}>
        <Photo image={img} onChange={e.coverImage} page={page} book={book} variant="bleed" className={s.screenPhoto} emptyLabel="放一张封面照片" />
      </div>
      <p className={s.dexTitle}>{book.meta.title}</p>
      <span className={s.dpad} />
      <span className={s.dexBtn} />
    </div>
  );
}

/* ------------------------------------------------------------------ pages */

function Title({ book }: PageProps) {
  const m = book.meta;
  const e = useBookEdits();
  return (
    <div className={`${s.fill} ${s.dots} paper`}>
      <div className={s.titleInner}>
        <EditableText className={s.kicker} value={m.kicker} onCommit={e.meta('kicker')} placeholder="一行小字" />
        <EditableText as="h1" className={s.title} value={m.title} onCommit={e.meta('title')} placeholder="书名" />
        <Ball className={s.titleBall} />
      </div>
      <Dialog className={s.titleDialog}>
        <EditableText as="span" value={m.subtitle} onCommit={e.meta('subtitle')} placeholder="冒险开始了！" />
      </Dialog>
    </div>
  );
}

function Finis() {
  return (
    <div className={`${s.fill} ${s.dots} paper`}>
      <p className={s.theEnd}>THE END</p>
      <Dialog className={s.titleDialog}>冒险还在继续……</Dialog>
    </div>
  );
}

function Back({ book }: PageProps) {
  const e = useBookEdits();
  const lines = lineSlots(book.meta.closingLines, 2, e.editing);
  return (
    <div className={`${s.board} ${s.dots} paper`}>
      <div className={s.badgeCase}>
        {BADGES.map(([c, sh], i) => (
          <Badge key={i} color={c} shape={sh} className={s.caseBadge} />
        ))}
      </div>
      <div className={s.backLines}>
        {lines.map((l, i) => (
          <EditableText key={i} value={l} onCommit={e.metaLine('closingLines', i)} placeholder="封底的话" />
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ decorations */

function GrassDecor({ page, seed }: DecorProps) {
  const r = seeded(seed + (page.side === 'right' ? 5 : 0));
  return (
    <div className={s.grassRow}>
      {Array.from({ length: 7 }, (_, i) => (
        <GrassTuft key={i} className={`${s.tuft} mb-anim`} style={{ left: `${i * 15 + r() * 6}%`, width: `${12 + r() * 6}cqw`, animationDelay: `${-r() * 3}s` }} />
      ))}
    </div>
  );
}

function BallsDecor({ page, seed }: DecorProps) {
  const r = seeded(seed + (page.side === 'right' ? 2 : 0));
  const Cs = [Ball, GreatBall, UltraBall];
  return (
    <>
      {[0, 1].map((i) => {
        const C = Cs[Math.floor(r() * 3)];
        return <C key={i} className={s.decoBall} style={{ [page.side === 'left' ? 'left' : 'right']: `${4 + r() * 6}%`, top: i ? `${80 + r() * 8}%` : `${3 + r() * 5}%`, rotate: `${r() * 60 - 30}deg` }} />;
      })}
    </>
  );
}

function BadgesDecor({ page }: DecorProps) {
  if (page.side === 'right') return null;
  return (
    <div className={s.badgeRow}>
      {BADGES.map(([c, sh], i) => (
        <Badge key={i} color={c} shape={sh} className={s.rowBadge} />
      ))}
    </div>
  );
}

function DialogDecor({ page }: DecorProps) {
  if (page.side === 'left' || !page.spread?.caption) return null;
  return <Dialog className={s.pageDialog}>{page.spread.caption}</Dialog>;
}

/* ------------------------------------------------------------------ sample */

function sample(): BookDoc {
  const img = (f: string, alt: string, x = 0.5) => ({ src: art(f), alt, focal: { x, y: 0.5 } });
  return {
    id: 'sample-pokemon',
    version: 1,
    themeId: 'pokemon',
    coverVariant: 'ball',
    meta: {
      kicker: '真新镇出发',
      title: '我们的冒险笔记',
      subtitle: '冒险开始了！',
      author: '小智的朋友们',
      dateLine: '2024',
      coverLines: ['去见识更大的世界吧！'],
      closingLines: ['旅行不会结束，', '下一站见！'],
      dedication: { to: '给一起收集徽章的你', body: '背包里装满了伤药和树果，\n我们出发吧。' },
      letter: { salutation: '致我的训练家伙伴：', body: '我们走过了 1 号道路，也在道馆里输过好几次。\n\n可每一次，我们都一起站起来了。', signoff: '你的伙伴', date: '收到第八枚徽章的那天' },
    },
    cover: {},
    sound: { flip: true },
    spreads: [
      { id: 'p1', layout: 'full-spread', images: [img('route', '长满高草的 1 号道路，草丛里有一个精灵球')], caption: '1 号道路的草丛里，好像有什么在动。', stamp: { date: '5.1', place: '1号道路' } },
      { id: 'p2', layout: 'photo-text', images: [img('pixel', '像素风格的小镇', 0.45)], title: '出发的小镇', text: '妈妈说：带上跑鞋，\n还有，记得常回家。', caption: '真新镇。', stamp: { date: '5.1', place: '真新镇' }, overrides: { decor: 'dialog' } },
      { id: 'p3', layout: 'full-spread', images: [img('stadium', '傍晚的对战场地')], caption: '第一次站上道馆的场地，手心全是汗。', stamp: { date: '6.18', place: '道馆' }, overrides: { decor: 'badges' } },
      { id: 'p4', layout: 'text', images: [], caption: '想成为最强的训练家，\n就要和伙伴一起变强。', title: '训练日志', text: '今天在草丛里遇见了三只。\n伤药用完了，下次要多带一点。' },
    ],
  };
}

export const pokemonDef: ThemeDef = {
  id: 'pokemon',
  name: '精灵宝可梦',
  group: 'screen',
  blurb: '精灵球、高草丛、图鉴卡片、像素对话框和道馆徽章',
  className: s.theme,
  fonts: ['ZCOOL KuaiLe', 'Fredoka', 'Press Start 2P'],
  photo: 'mount',
  Frame: DexCard,
  palettes: [
    { id: 'classic', name: '红白', swatch: ['#fbf8f2', '#e3350d', '#2f6fd6'], vars: {} },
    {
      id: 'grass',
      name: '草地绿',
      swatch: ['#e9f4d8', '#2f7a2a', '#f2c230'],
      vars: { '--paper': '#e9f4d8', '--paper-deep': '#dcebc6', '--paper-edge': '#c3d9a6', '--board': '#5fbf5a', '--accent': '#2f7a2a', '--dot': 'rgba(47,122,42,0.12)' },
    },
    {
      id: 'gb',
      name: '像素掌机',
      swatch: ['#9bbc0f', '#0f380f', '#306230'],
      vars: {
        '--paper': '#9bbc0f',
        '--paper-deep': '#8bac0f',
        '--paper-edge': '#306230',
        '--board': '#306230',
        '--ink': '#0f380f',
        '--ink-soft': '#306230',
        '--accent': '#0f380f',
        '--dot': 'rgba(15,56,15,0.12)',
        '--card': '#8bac0f',
        '--card-border': '#0f380f',
        '--photo-filter': 'grayscale(1) sepia(1) hue-rotate(35deg) saturate(2.4) contrast(1.15) brightness(0.9)',
        '--room': '#e2ead0',
      },
    },
  ],
  ornaments: {
    divider: () => <Ball style={{ width: '5cqw' }} />,
    titleMark: () => <Ball />,
  },
  decor: [
    { id: 'grass', label: '高草丛', Component: GrassDecor },
    { id: 'balls', label: '精灵球', Component: BallsDecor },
    { id: 'badges', label: '徽章', Component: BadgesDecor },
    { id: 'dialog', label: '对话框', Component: DialogDecor },
  ],
  stickers: {
    ball: { label: '精灵球', Component: (p) => <Ball {...p} /> },
    great: { label: '超级球', Component: GreatBall },
    ultra: { label: '高级球', Component: UltraBall },
    master: { label: '大师球', Component: MasterBall },
    badge1: { label: '灰色徽章', Component: (p) => <Badge {...p} color="#8a8f99" shape={0} /> },
    badge2: { label: '蓝色徽章', Component: (p) => <Badge {...p} color="#4aa3df" shape={1} /> },
    badge3: { label: '金色徽章', Component: (p) => <Badge {...p} color="#f2c230" shape={2} /> },
    potion: { label: '伤药', Component: Potion },
    berry: { label: '树果', Component: Berry },
    egg: { label: '蛋', Component: Egg },
    dex: { label: '图鉴', Component: Dex },
    heart: { label: '像素爱心', Component: PixelHeart },
  },
  covers: [
    { id: 'ball', name: '精灵球', Component: BallCover },
    { id: 'dex', name: '图鉴', Component: DexCover },
  ],
  pages: { title: Title, finis: Finis, 'back-cover': Back },
  photoFilter: { label: '鲜艳', css: 'saturate(1.22) contrast(1.05)' },
  wrap: { kind: 'ball' },
  scene: PokemonScene,
  sound: pokemonSound,
  sample,
};
