import { StrangerScene, strangerSound } from './scene';
import { EditableText } from '../../components/Editor/Editable';
import type { PageSpec } from '../../data/buildPages';
import type { BookDoc } from '../../data/schema';
import { seeded } from '../context';
import { lineSlots, useBookEdits } from '../shared';
import type { DecorProps, PageProps, ThemeDef } from '../types';
import {
  BULB_COLORS,
  Bicycle,
  Boombox,
  Bulb,
  D20,
  Flashlight,
  Lightning,
  OldTV,
  Token,
  TownSign,
  Vines,
  WalkieTalkie,
  Waffle,
} from './ornaments';
import s from './stranger.module.css';

const art = (f: string) => `${import.meta.env.BASE_URL}assets/themes/stranger/${f}.svg`;
const LETTERS = ['ABCDEFG', 'HIJKLMN', 'OPQRST', 'UVWXYZ'];

/** Floating spores (paused while a page turns, off for reduced motion). */
function Spores({ seed, n = 18 }: { seed: number; n?: number }) {
  const r = seeded(seed);
  return (
    <div className={s.spores} aria-hidden>
      {Array.from({ length: n }, (_, i) => (
        <i
          key={i}
          className="mb-anim"
          style={{
            left: `${r() * 100}%`,
            top: `${r() * 100}%`,
            width: `${0.4 + r() * 0.9}cqw`,
            animationDelay: `${-r() * 12}s`,
            animationDuration: `${9 + r() * 8}s`,
          }}
        />
      ))}
    </div>
  );
}

/** The alphabet wall: painted letters with a fairy-light bulb above each. */
function AlphabetWall({ seed = 5, lit }: { seed?: number; lit?: string }) {
  const r = seeded(seed);
  const on = (ch: string) => (lit ? lit.toUpperCase().includes(ch) : r() > 0.35);
  return (
    <div className={s.wall}>
      {LETTERS.map((row, ri) => (
        <div key={ri} className={s.wallRow}>
          <span className={s.wire} aria-hidden />
          {[...row].map((ch, i) => (
            <span key={ch} className={s.cell}>
              <Bulb className={`${s.wallBulb} ${on(ch) ? 'mb-anim' : ''}`} color={BULB_COLORS[(i + ri * 2) % BULB_COLORS.length]} lit={on(ch)} style={{ rotate: `${(r() - 0.5) * 30}deg` }} />
              <span className={s.letter} style={{ rotate: `${(r() - 0.5) * 10}deg` }}>
                {ch}
              </span>
            </span>
          ))}
        </div>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ covers */

function GlowCover({ book }: PageProps) {
  const e = useBookEdits();
  const [a = ''] = lineSlots(book.meta.coverLines, 1, e.editing);
  return (
    <div className={`${s.board} ${s.dark} paper`}>
      <Spores seed={3} n={22} />
      <div className={s.glowBlock}>
        <span className={s.rule} />
        <p className={s.glowTitle}>{book.meta.title}</p>
        <span className={s.rule} />
        <p className={s.glowKicker}>{book.meta.kicker}</p>
      </div>
      <EditableText className={s.coverLine} value={a} onCommit={e.metaLine('coverLines', 0)} placeholder="一句话" />
    </div>
  );
}

function WallCover({ book }: PageProps) {
  const initials = (book.meta.title.match(/[A-Za-z]/g) ?? []).join('') || 'HELLO';
  return (
    <div className={`${s.board} ${s.wallpaper} paper`}>
      <div className={s.coverWall}>
        <AlphabetWall seed={9} lit={initials} />
      </div>
      <p className={s.wallTitle}>{book.meta.title}</p>
    </div>
  );
}

/* ------------------------------------------------------------------ pages */

function Endpaper() {
  return (
    <div className={`${s.fill} ${s.wallpaper} paper`}>
      <AlphabetWall />
    </div>
  );
}

function Title({ book }: PageProps) {
  const m = book.meta;
  const e = useBookEdits();
  return (
    <div className={`${s.fill} paper`}>
      <Spores seed={7} />
      <div className={s.titleInner}>
        <EditableText className={s.chapter} value={m.kicker} onCommit={e.meta('kicker')} placeholder="第一章" />
        <span className={s.rule} />
        <EditableText as="h1" className={s.glowTitle} value={m.title} onCommit={e.meta('title')} placeholder="书名" />
        <span className={s.rule} />
        <EditableText className={s.subtitle} value={m.subtitle} onCommit={e.meta('subtitle')} placeholder="副标题" />
      </div>
      <EditableText className={s.dateLine} value={m.dateLine} onCommit={e.meta('dateLine')} placeholder="日期" />
    </div>
  );
}

function Notebook({ children }: { children: React.ReactNode }) {
  return (
    <div className={s.notebook}>
      <span className={s.holes} aria-hidden />
      <div className={s.notebookInner}>{children}</div>
    </div>
  );
}

function Dedication({ book }: PageProps) {
  const d = book.meta.dedication;
  const e = useBookEdits();
  if (!d) return <div className={`${s.fill} paper`} />;
  return (
    <div className={`${s.fill} paper`}>
      <Notebook>
        <EditableText className={s.nbTo} value={d.to} onCommit={e.dedication('to')} placeholder="写给……" />
        <EditableText className={s.nbBody} value={d.body} onCommit={e.dedication('body')} placeholder="献词" multiline />
      </Notebook>
    </div>
  );
}

function Letter({ book }: PageProps) {
  const l = book.meta.letter;
  const e = useBookEdits();
  if (!l) return <div className={`${s.fill} paper`} />;
  return (
    <div className={`${s.fill} paper`}>
      <Notebook>
        <EditableText className={s.nbTo} value={l.salutation} onCommit={e.letter('salutation')} placeholder="称呼" />
        <EditableText className={s.nbBody} value={l.body} onCommit={e.letter('body')} placeholder="信的内容" multiline />
        <div className={s.nbSign}>
          <EditableText value={l.signoff} onCommit={e.letter('signoff')} placeholder="署名" />
          <EditableText value={l.date} onCommit={e.letter('date')} placeholder="日期" />
        </div>
      </Notebook>
      <WalkieTalkie className={s.letterWalkie} />
    </div>
  );
}

function Finis() {
  return (
    <div className={`${s.fill} ${s.finis} paper`}>
      <Bulb className={`${s.finisBulb} mb-anim`} color="#ff3b30" />
      <p>To be continued…</p>
    </div>
  );
}

function Back({ book }: PageProps) {
  const e = useBookEdits();
  const lines = lineSlots(book.meta.closingLines, 2, e.editing);
  return (
    <div className={`${s.board} ${s.dark} paper`}>
      <Spores seed={11} />
      <div className={s.backLines}>
        {lines.map((l, i) => (
          <EditableText key={i} value={l} onCommit={e.metaLine('closingLines', i)} placeholder="封底的话" />
        ))}
      </div>
      <div className={s.streetlight} aria-hidden />
      <Bicycle className={s.backBike} />
    </div>
  );
}

/* ------------------------------------------------------------------ decorations */

function LightsDecor({ page, seed }: DecorProps) {
  const r = seeded(seed + (page.side === 'right' ? 13 : 0));
  const n = 7;
  return (
    <div className={s.lightString}>
      <svg className={s.lightWire} viewBox="0 0 100 20" preserveAspectRatio="none" aria-hidden>
        <path d="M-2 4 Q25 16 50 8 T102 6" stroke="#1d2a1d" strokeWidth="0.6" fill="none" />
      </svg>
      {Array.from({ length: n }, (_, i) => {
        const x = 6 + (i * 88) / (n - 1);
        const y = 20 + Math.sin((i / (n - 1)) * Math.PI) * 18 - (i % 2) * 6;
        const lit = r() > 0.2;
        return (
          <Bulb
            key={i}
            className={lit ? 'mb-anim' : undefined}
            color={BULB_COLORS[Math.floor(r() * BULB_COLORS.length)]}
            lit={lit}
            style={{ position: 'absolute', left: `${x}%`, top: `${y}%`, width: '4.5cqw', rotate: `${(r() - 0.5) * 40}deg`, animationDelay: `${-r() * 4}s` }}
          />
        );
      })}
    </div>
  );
}

function VhsDecor({ page }: DecorProps) {
  return (
    <div className={s.vhs}>
      <span className={`${s.tracking} mb-anim`} />
      {page.side !== 'right' && <span className={s.play}>▶ PLAY</span>}
    </div>
  );
}

function VinesDecor({ page, seed }: DecorProps) {
  return (
    <>
      <Vines className={page.side === 'left' ? s.vinesBL : s.vinesBR} seed={seed + (page.side === 'left' ? 0 : 3)} />
      <Spores seed={seed} n={12} />
    </>
  );
}

function LightningDecor({ page, seed }: DecorProps) {
  return <Lightning className={s.bolt} seed={seed + (page.side === 'right' ? 1 : 0)} style={{ [page.side === 'left' ? 'left' : 'right']: '2%', scale: page.side === 'left' ? '-1 1' : undefined }} />;
}

/** VHS-style REC stamp in the corner of photos. */
function Imprint({ page, book }: { page: PageSpec; book: BookDoc }) {
  const d = page.spread?.stamp?.date;
  if (!d) return null;
  const [m, day] = d.split(/[./-]/);
  const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
  const year = book.meta.dateLine?.match(/(19|20)\d{2}/)?.[0] ?? '1984';
  return (
    <span className={s.rec}>
      <b>●</b> REC&nbsp;&nbsp;{months[Number(m) - 1] ?? m} {day?.padStart(2, '0')} {year}
    </span>
  );
}

/* ------------------------------------------------------------------ sample */

function sample(): BookDoc {
  const img = (f: string, alt: string, x = 0.5, y = 0.5) => ({ src: art(f), alt, focal: { x, y } });
  return {
    id: 'sample-stranger',
    version: 1,
    themeId: 'stranger',
    coverVariant: 'glow',
    meta: {
      kicker: '第一章',
      title: '1984 年的夏天',
      subtitle: '骑车、对讲机和一面会发光的墙',
      author: '小镇四人组',
      dateLine: '1984 · 夏',
      coverLines: ['有些夏天，永远不会结束。'],
      closingLines: ['灯还亮着。', '我们还会回来。'],
      dedication: { to: '给这个夏天的队友们', body: '收到请回答。\n收到请回答。\n我们一直都在。' },
      letter: {
        salutation: '致最好的朋友：',
        body: '那个夏天，我们骑车穿过整片树林，躲在地下室打了一整晚的游戏。\n\n如果你想我了，就把灯打开。',
        signoff: '—— 你的队友',
        date: '1984 年 11 月',
      },
    },
    cover: {},
    sound: { flip: true },
    spreads: [
      { id: 's1', layout: 'full-spread', images: [img('lights', '墙上的字母和圣诞灯')], caption: '墙上的字母，一盏一盏亮起来。', stamp: { date: '11.6', place: '客厅' }, overrides: { decor: 'none' } },
      { id: 's2', layout: 'full-spread', images: [img('forest', '夜里的林间小路，三辆自行车和手电筒')], caption: '天黑以前一定要骑回家。', stamp: { date: '7.4', place: '镜湖路' }, overrides: { decor: 'vines' } },
      {
        id: 's3',
        layout: 'photo-text',
        images: [img('arcade', '霓虹街机厅', 0.5)],
        title: '街机厅',
        text: '口袋里只剩三枚硬币。\n最高分的名字，今晚要换成我们的。',
        caption: '霓虹灯下的街机厅。',
        stamp: { date: '7.12', place: '商场' },
        overrides: { decor: 'vhs' },
        stickers: [{ id: 'k1', src: 'theme:token', x: 0.84, y: 0.8, rot: 12, scale: 0.06 }],
      },
      { id: 's4', layout: 'full-spread', images: [img('upside', '颠倒世界：红色闪电和漂浮的孢子')], caption: '另一边的世界，一切都是颠倒的。', stamp: { date: '11.12', place: '？？？' }, overrides: { decor: 'lightning' } },
    ],
  };
}

export const strangerDef: ThemeDef = {
  id: 'stranger',
  name: '怪奇物语',
  group: 'screen',
  blurb: '80 年代小镇：圣诞灯字母墙、对讲机、自行车和颠倒世界',
  className: s.theme,
  fonts: ['VT323', 'Noto Serif SC', 'LXGW WenKai'],
  photo: 'print',
  Imprint,
  palettes: [
    { id: 'upside', name: '颠倒世界', swatch: ['#14141c', '#e8e2d6', '#e3261b'], vars: {} },
    {
      id: 'hawkins',
      name: '霍金斯小镇',
      swatch: ['#efe3c8', '#3a2a1e', '#c8452d'],
      vars: {
        '--paper': '#efe3c8',
        '--paper-deep': '#e4d4b0',
        '--paper-edge': '#cdb991',
        '--board': '#1b1a22',
        '--ink': '#3a2a1e',
        '--ink-soft': '#6a5240',
        '--accent': '#c8452d',
        '--room': '#f4ede0',
        '--room-strong': '#3a2a1e',
        '--room-soft': '#6a5240',
        '--paper-pattern': 'var(--pattern-floral)',
      },
    },
    {
      id: 'arcade',
      name: '霓虹街机',
      swatch: ['#1a1033', '#f2e9ff', '#ff3fa4'],
      vars: {
        '--paper': '#1a1033',
        '--paper-deep': '#140c28',
        '--paper-edge': '#2c1d52',
        '--board': '#12092a',
        '--ink': '#f2e9ff',
        '--ink-soft': '#c9b8ec',
        '--accent': '#ff3fa4',
        '--glow-2': '#34e0ff',
        '--room': '#221638',
        '--room-strong': '#f2e9ff',
        '--room-soft': '#c9b8ec',
      },
    },
  ],
  ornaments: {
    divider: () => <span className={s.rule} style={{ width: '22cqw' }} />,
  },
  decor: [
    { id: 'lights', label: '圣诞灯串', Component: LightsDecor },
    { id: 'vhs', label: '录像带', Component: VhsDecor },
    { id: 'vines', label: '颠倒世界藤蔓', Component: VinesDecor },
    { id: 'lightning', label: '红色闪电', Component: LightningDecor },
  ],
  stickers: {
    walkie: { label: '对讲机', Component: WalkieTalkie },
    bike: { label: '自行车', Component: Bicycle },
    waffle: { label: '华夫饼', Component: Waffle },
    boombox: { label: '录音机', Component: Boombox },
    flashlight: { label: '手电筒', Component: Flashlight },
    token: { label: '游戏币', Component: Token },
    d20: { label: '二十面骰', Component: D20 },
    bulb: { label: '圣诞灯泡', Component: Bulb },
    sign: { label: '小镇路牌', Component: TownSign },
    tv: { label: '老电视', Component: OldTV },
  },
  covers: [
    { id: 'glow', name: '发光片名', Component: GlowCover },
    { id: 'wall', name: '字母墙', Component: WallCover },
  ],
  pages: {
    endpaper: Endpaper,
    title: Title,
    dedication: Dedication,
    letter: Letter,
    finis: Finis,
    'back-cover': Back,
  },
  photoFilter: { label: 'VHS 录像带', css: 'saturate(1.25) contrast(1.1) hue-rotate(-6deg)', overlay: 'vhs' },
  wrap: { kind: 'tape' },
  scene: StrangerScene,
  sound: strangerSound,
  sample,
};
