import { MuseumScene, museumSound } from './scene';
import { EditableText, ImageSlot } from '../../components/Editor/Editable';
import { sampleBook } from '../../data/sampleBook';
import type { BookDoc } from '../../data/schema';
import k from '../kit/kit.module.css';
import { Photo } from '../kit/Photo';
import { lineSlots, stampDate, useBookEdits } from '../shared';
import type { DecorProps, FrameProps, PageProps, ThemeDef } from '../types';
import s from './museum.module.css';

/* ------------------------------------------------------------------ ornaments / stickers */

type P = { className?: string };
const RedDot = ({ className }: P) => (
  <svg className={className} viewBox="0 0 40 40">
    <circle cx="20" cy="20" r="16" fill="#d42a1f" />
  </svg>
);
const WallLabel = ({ className }: P) => (
  <svg className={className} viewBox="0 0 120 70">
    <rect width="120" height="70" fill="#fff" stroke="#ddd" />
    <rect x="10" y="12" width="70" height="5" fill="#222" />
    <rect x="10" y="24" width="50" height="3" fill="#888" />
    <rect x="10" y="32" width="84" height="3" fill="#aaa" />
    <rect x="10" y="40" width="60" height="3" fill="#aaa" />
    <circle cx="104" cy="56" r="5" fill="#d42a1f" />
  </svg>
);
const MuseumTicket = ({ className }: P) => (
  <svg className={className} viewBox="0 0 140 60">
    <path d="M0 0 H140 V22 a8 8 0 0 0 0 16 V60 H0 V38 a8 8 0 0 0 0 -16Z" fill="#f2efe8" stroke="#bbb" />
    <text x="14" y="26" fontFamily="Cormorant Garamond, serif" fontSize="14" fill="#222" letterSpacing="3">ADMISSION</text>
    <text x="14" y="44" fontFamily="Cormorant Garamond, serif" fontSize="9" fill="#666" letterSpacing="2">GALLERY · ROOM 3</text>
    <line x1="104" y1="6" x2="104" y2="54" stroke="#bbb" strokeDasharray="3 3" />
  </svg>
);
const Magnifier = ({ className }: P) => (
  <svg className={className} viewBox="0 0 70 70">
    <circle cx="28" cy="28" r="20" fill="#dfe8ec" fillOpacity="0.5" stroke="#222" strokeWidth="4" />
    <path d="M43 43 L64 64" stroke="#222" strokeWidth="7" strokeLinecap="round" />
  </svg>
);
const Pencil = ({ className }: P) => (
  <svg className={className} viewBox="0 0 140 20">
    <path d="M0 10 L20 2 V18Z" fill="#e8c9a0" />
    <path d="M0 10 L7 7 V13Z" fill="#333" />
    <rect x="20" y="2" width="104" height="16" fill="#2f2f2f" />
    <rect x="124" y="2" width="14" height="16" fill="#c9a36b" />
  </svg>
);
const Bust = ({ className }: P) => (
  <svg className={className} viewBox="0 0 80 110">
    <ellipse cx="40" cy="30" rx="18" ry="22" fill="#e9e6df" stroke="#bdb8ad" />
    <path d="M22 44 C22 64 14 70 8 86 H72 C66 70 58 64 58 44Z" fill="#e9e6df" stroke="#bdb8ad" />
    <rect x="16" y="86" width="48" height="10" fill="#d8d3c8" />
    <rect x="24" y="96" width="32" height="12" fill="#cfc9bd" />
  </svg>
);
const Plinth = ({ className }: P) => (
  <svg className={className} viewBox="0 0 70 110">
    <rect x="10" y="10" width="50" height="96" fill="#f4f2ee" stroke="#ccc" />
    <circle cx="35" cy="0" r="14" fill="#1f1f1f" transform="translate(0 14)" />
  </svg>
);
const FrameCorner = ({ className }: P) => (
  <svg className={className} viewBox="0 0 60 60">
    <path d="M4 56 V4 H56" fill="none" stroke="#1f1f1f" strokeWidth="5" />
    <path d="M14 56 V14 H56" fill="none" stroke="#1f1f1f" strokeWidth="1" />
  </svg>
);

/* ------------------------------------------------------------------ frame */

/** Museum mount: a wide passe-partout, a hairline around the window, plate number under it. */
function MatFrame({ image, onChange, page, className, style, imprint, emptyLabel }: FrameProps) {
  const d = stampDate(page.spread?.stamp?.date);
  return (
    <figure className={`${k.photo} ${s.mat} ${className ?? ''}`} style={style}>
      <div className={s.matWindow}>
        <ImageSlot image={image} onChange={onChange} emptyLabel={emptyLabel} />
      </div>
      {imprint && d.ok && (
        <figcaption className={s.plate}>
          Pl. {String(d.m).padStart(2, '0')}·{String(d.d).padStart(2, '0')}
        </figcaption>
      )}
    </figure>
  );
}

/* ------------------------------------------------------------------ covers */

function PlateCover({ book, page }: PageProps) {
  const e = useBookEdits();
  const img = book.cover.image ?? book.spreads[0]?.images[0];
  return (
    <div className={`${s.board} paper`}>
      <Photo image={img} onChange={e.coverImage} page={page} book={book} className={s.coverPlate} emptyLabel="放一张封面作品" />
      <p className={s.coverTitle}>{book.meta.title}</p>
      <p className={s.coverMeta}>
        {book.meta.kicker}
        {book.meta.dateLine ? ` — ${book.meta.dateLine}` : ''}
      </p>
    </div>
  );
}

function TypeCover({ book }: PageProps) {
  const e = useBookEdits();
  const [a = ''] = lineSlots(book.meta.coverLines, 1, e.editing);
  return (
    <div className={`${s.board} paper`}>
      <p className={s.bigNum}>01</p>
      <div className={s.typeBlock}>
        <p className={s.typeTitle}>{book.meta.title}</p>
        <span className={s.hair} />
        <EditableText className={s.typeLine} value={a} onCommit={e.metaLine('coverLines', 0)} placeholder="一句话" />
        <p className={s.typeMeta}>{[book.meta.author, book.meta.dateLine].filter(Boolean).join(' · ')}</p>
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
      <div className={s.catalogue}>
        <EditableText className={s.cKicker} value={m.kicker} onCommit={e.meta('kicker')} placeholder="展览名 / 小字" />
        <EditableText as="h1" className={s.cTitle} value={m.title} onCommit={e.meta('title')} placeholder="书名" />
        <span className={s.hair} />
        <EditableText className={s.cSub} value={m.subtitle} onCommit={e.meta('subtitle')} placeholder="副标题" />
      </div>
      <div className={s.colophon}>
        <EditableText as="span" value={m.author} onCommit={e.meta('author')} placeholder="作者" />
        <EditableText as="span" value={m.dateLine} onCommit={e.meta('dateLine')} placeholder="日期" />
      </div>
    </div>
  );
}

function Finis({ book }: PageProps) {
  return (
    <div className={`${s.fill} ${s.finis} paper`}>
      <p className={s.fin}>Fin.</p>
      <p className={s.finMeta}>
        {book.meta.title}
        <br />
        {book.spreads.length} 件作品 · {book.meta.dateLine}
      </p>
    </div>
  );
}

function Back({ book }: PageProps) {
  const e = useBookEdits();
  const lines = lineSlots(book.meta.closingLines, 2, e.editing);
  return (
    <div className={`${s.board} paper`}>
      <div className={s.backLines}>
        {lines.map((l, i) => (
          <EditableText key={i} value={l} onCommit={e.metaLine('closingLines', i)} placeholder="封底的话" />
        ))}
      </div>
      <p className={s.backMeta}>{[book.meta.author, book.meta.dateLine].filter(Boolean).join(' · ')}</p>
    </div>
  );
}

/* ------------------------------------------------------------------ decorations */

function RunningHead({ page }: DecorProps) {
  const outer = page.side === 'left' ? 'left' : 'right';
  return (
    <>
      <span className={s.running} style={{ [outer]: '8%' }}>
        {page.spread?.caption?.split(/[，。,.]/)[0]?.slice(0, 18)}
      </span>
      <span className={s.folio} style={{ [outer]: '8%' }}>
        {page.spread?.stamp?.date ?? ''}
      </span>
    </>
  );
}

function LabelDecor({ page }: DecorProps) {
  if (page.side === 'left') return null;
  const sp = page.spread;
  return (
    <div className={s.label}>
      <b>{sp?.caption?.split(/[，。,.]/)[0] || '无题'}</b>
      <span>{[sp?.stamp?.place, sp?.stamp?.date].filter(Boolean).join('，')}</span>
      <span>纸本 · 记忆</span>
    </div>
  );
}

function RuleDecor() {
  return <div className={s.inset} />;
}

/* ------------------------------------------------------------------ sample */

function sample(): BookDoc {
  const [a, b, c] = sampleBook.spreads.map((x) => x.images[0]);
  return {
    ...sampleBook,
    id: 'sample-museum',
    themeId: 'museum',
    coverVariant: 'plate',
    meta: {
      ...sampleBook.meta,
      kicker: '南岛 · 春',
      title: '风景十二帧',
      subtitle: '一本安静的小画册',
      dateLine: '2024',
      coverLines: ['观看，比记住更慢一点。'],
      closingLines: ['展览结束了，', '风景还在。'],
    },
    spreads: [
      { id: 'm1', layout: 'photo-text', images: [{ ...a, focal: { x: 0.35, y: 0.5 } }], title: '牧场', text: '丙烯马克笔，纸本。\n画于南岛的第三天。羊群在远处慢慢移动，像没有风的云。', caption: '春天的牧场。', stamp: { date: '9.14', place: '坎特伯雷' } },
      { id: 'm2', layout: 'full-spread', images: [b], caption: '樱花与蓝天。', stamp: { date: '9.18', place: '基督城' } },
      { id: 'm3', layout: 'grid', images: [a, b, c, { ...a, focal: { x: 0.8, y: 0.6 } }], caption: '四个角落。', stamp: { date: '9.20', place: '凯库拉' } },
      { id: 'm4', layout: 'photo-text', images: [{ ...c, focal: { x: 0.6, y: 0.5 } }], title: '码头', text: '黄昏的海面静得像一块玻璃。', caption: '皮克顿码头。', stamp: { date: '9.22', place: '皮克顿' } },
      { id: 'm5', layout: 'text', images: [], caption: '看见，\n是一种很慢的动作。', title: '后记', text: '这些画都很小，画的时候没有想过要给谁看。\n现在把它们装进同一本册子，像一次只有一个观众的展览。' },
    ],
  };
}

export const museumDef: ThemeDef = {
  id: 'museum',
  name: '极简美术馆画册',
  group: 'classic',
  blurb: '大留白、白色卡纸装裱、展品编号和作品标签',
  className: s.theme,
  fonts: ['Cormorant Garamond', 'Noto Serif SC'],
  photo: 'mount',
  Frame: MatFrame,
  palettes: [
    { id: 'white', name: '暖白', swatch: ['#f5f3ee', '#222222', '#d42a1f'], vars: {} },
    {
      id: 'stone',
      name: '石灰',
      swatch: ['#e6e3dc', '#2b2b2b', '#8a7f6a'],
      vars: { '--paper': '#e6e3dc', '--paper-deep': '#dcd8cf', '--paper-edge': '#cbc6bb', '--board': '#e1ddd5', '--mat': '#f4f2ed' },
    },
    {
      id: 'charcoal',
      name: '炭黑',
      swatch: ['#1f1f1f', '#ecebe7', '#b89b6a'],
      vars: {
        '--paper': '#1f1f1f',
        '--paper-deep': '#181818',
        '--paper-edge': '#303030',
        '--board': '#1a1a1a',
        '--ink': '#ecebe7',
        '--ink-soft': '#bdbab3',
        '--mat': '#2a2a2a',
        '--hair': 'rgba(255,255,255,0.25)',
      },
    },
  ],
  decor: [
    { id: 'running', label: '书眉页码', Component: RunningHead },
    { id: 'label', label: '作品标签', Component: LabelDecor },
    { id: 'rule', label: '细线边框', Component: RuleDecor },
  ],
  stickers: {
    reddot: { label: '红点', Component: RedDot },
    label: { label: '展签', Component: WallLabel },
    ticket: { label: '门票', Component: MuseumTicket },
    magnifier: { label: '放大镜', Component: Magnifier },
    pencil: { label: '铅笔', Component: Pencil },
    bust: { label: '石膏像', Component: Bust },
    plinth: { label: '展台', Component: Plinth },
    corner: { label: '画框角', Component: FrameCorner },
  },
  covers: [
    { id: 'plate', name: '一幅作品', Component: PlateCover },
    { id: 'type', name: '纯文字', Component: TypeCover },
  ],
  pages: { title: Title, finis: Finis, 'back-cover': Back },
  wrap: { kind: 'ticket', paper: '#fbfaf6', ink: '#2d2a26', accent: '#c23a2b' },
  scene: MuseumScene,
  sound: museumSound,
  sample,
};

