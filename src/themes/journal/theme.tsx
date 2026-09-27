import { JournalScene, journalSound } from './scene';
import { EditableText } from '../../components/Editor/Editable';
import type { PageSpec } from '../../data/buildPages';
import { sampleBook } from '../../data/sampleBook';
import type { BookDoc } from '../../data/schema';
import { seeded } from '../context';
import { Photo } from '../kit/Photo';
import { lineSlots, useBookEdits } from '../shared';
import type { DecorProps, PageProps, ThemeDef } from '../types';
import {
  AIRMAIL,
  AirmailStamp,
  BoardingPass,
  CoffeeCup,
  Compass,
  EntryStamp,
  LuggageTag,
  MapPin,
  OldCamera,
  Postcard,
  Postmark,
  TrainTicket,
  Washi,
} from './ornaments';
import s from './journal.module.css';

/* ------------------------------------------------------------------ covers */

function TagCover({ book }: PageProps) {
  const e = useBookEdits();
  const [a = ''] = lineSlots(book.meta.coverLines, 1, e.editing);
  return (
    <div className={`${s.board} paper`}>
      <span className={s.twine} aria-hidden />
      <div className={s.tag}>
        <span className={s.tagHole} aria-hidden />
        <p className={s.tagKicker}>TRAVEL JOURNAL</p>
        <p className={s.tagTitle}>{book.meta.title}</p>
        <EditableText className={s.tagLine} value={a} onCommit={e.metaLine('coverLines', 0)} placeholder="一句话" />
        <p className={s.tagDate}>{book.meta.dateLine}</p>
      </div>
      <Postmark className={s.coverPostmark} date={book.meta.dateLine?.slice(0, 10)} />
    </div>
  );
}

function StampsCover({ book, page }: PageProps) {
  const e = useBookEdits();
  const imgs = book.spreads.flatMap((x) => x.images);
  const cover = book.cover.image ?? imgs[0];
  return (
    <div className={`${s.board} ${s.airmail} paper`}>
      <div className={s.airmailInner}>
        <Photo image={cover} onChange={e.coverImage} page={page} book={book} variant="stamp" className={s.stampBig} />
        {imgs[1] && <Photo image={imgs[1]} page={page} book={book} variant="stamp" className={s.stampSmall1} />}
        {imgs[2] && <Photo image={imgs[2]} page={page} book={book} variant="stamp" className={s.stampSmall2} />}
        <Postmark className={s.stampsPostmark} date={book.meta.dateLine?.slice(0, 10)} />
        <p className={s.stampsTitle}>{book.meta.title}</p>
        <p className={s.stampsKicker}>{book.meta.kicker}</p>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ pages */

function Endpaper() {
  return <div className={`${s.fill} ${s.map} paper`} />;
}

function Title({ book }: PageProps) {
  const m = book.meta;
  const e = useBookEdits();
  return (
    <div className={`${s.fill} paper`}>
      <div className={s.ticket}>
        <div className={s.ticketMain}>
          <p className={s.ticketHead}>ADMIT ONE · 旅行手账</p>
          <EditableText className={s.ticketFrom} value={m.kicker} onCommit={e.meta('kicker')} placeholder="出发地 / 一行小字" />
          <EditableText as="h1" className={s.ticketTitle} value={m.title} onCommit={e.meta('title')} placeholder="书名" />
          <EditableText className={s.ticketSub} value={m.subtitle} onCommit={e.meta('subtitle')} placeholder="副标题" />
        </div>
        <div className={s.ticketStub}>
          <span>DATE</span>
          <EditableText className={s.ticketDate} value={m.dateLine} onCommit={e.meta('dateLine')} placeholder="日期" />
          <span>No. 0914</span>
        </div>
      </div>
      <Compass className={s.titleCompass} />
    </div>
  );
}

function Dedication({ book }: PageProps) {
  const d = book.meta.dedication;
  const e = useBookEdits();
  if (!d) return <div className={`${s.fill} paper`} />;
  return (
    <div className={`${s.fill} paper`}>
      <div className={s.postcard}>
        <div className={s.pcLeft}>
          <p className={s.pcHead}>POST CARD</p>
          <EditableText className={s.pcBody} value={d.body} onCommit={e.dedication('body')} placeholder="献词" multiline />
        </div>
        <div className={s.pcRight}>
          <AirmailStamp className={s.pcStamp} />
          <Postmark className={s.pcPostmark} />
          <EditableText className={s.pcTo} value={d.to} onCommit={e.dedication('to')} placeholder="寄给……" />
          <i />
          <i />
        </div>
      </div>
    </div>
  );
}

function Letter({ book }: PageProps) {
  const l = book.meta.letter;
  const e = useBookEdits();
  if (!l) return <div className={`${s.fill} paper`} />;
  return (
    <div className={`${s.fill} paper`}>
      <div className={s.airLetter}>
        <div className={s.airLetterInner}>
          <EditableText className={s.lHi} value={l.salutation} onCommit={e.letter('salutation')} placeholder="称呼" />
          <EditableText className={s.lBody} value={l.body} onCommit={e.letter('body')} placeholder="信的内容" multiline />
          <div className={s.lSign}>
            <EditableText value={l.signoff} onCommit={e.letter('signoff')} placeholder="署名" />
            <EditableText className={s.lDate} value={l.date} onCommit={e.letter('date')} placeholder="日期" />
          </div>
        </div>
      </div>
    </div>
  );
}

function Finis({ book }: PageProps) {
  return (
    <div className={`${s.fill} paper`}>
      <EntryStamp className={s.finisStamp} text="THE END" date={book.meta.dateLine} />
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
      <div className={s.backAddress}>
        <span>FROM</span>
        <EditableText as="span" value={book.meta.author} onCommit={e.meta('author')} placeholder="作者" />
      </div>
      <Postmark className={s.backPostmark} date={book.meta.dateLine?.slice(0, 10)} />
    </div>
  );
}

/* ------------------------------------------------------------------ decorations */

function TapeDecor({ page, seed }: DecorProps) {
  const r = seeded(seed + (page.side === 'right' ? 3 : 0));
  const colors = ['#d98f76', '#8fb1a4', '#e2c26a', '#a9a0cf'];
  const spots = page.side === 'left' ? [[8, 6, -18], [88, 90, -12]] : page.side === 'right' ? [[90, 7, 16], [14, 92, 10]] : [[10, 6, -16], [90, 92, -10]];
  return (
    <>
      {spots.map(([x, y, rot], i) => (
        <Washi
          key={i}
          className={s.decoAbs}
          color={colors[Math.floor(r() * colors.length)]}
          style={{ left: `${x}%`, top: `${y}%`, width: '24cqw', transform: `translate(-50%,-50%) rotate(${rot + (r() - 0.5) * 8}deg)` }}
        />
      ))}
    </>
  );
}

function PostmarkDecor({ page, seed }: DecorProps) {
  if (page.side === 'left') return null;
  const r = seeded(seed);
  return (
    <Postmark
      className={s.decoAbs}
      date={page.spread?.stamp?.date}
      text={(page.spread?.stamp?.place || 'TRAVEL POST').toUpperCase()}
      style={{ right: '4%', top: '4%', width: '38cqw', transform: `rotate(${-8 + r() * 10}deg)` }}
    />
  );
}

function TicketDecor({ page, seed }: DecorProps) {
  if (page.side === 'left') return null;
  const r = seeded(seed);
  return (
    <TrainTicket
      className={s.decoAbs}
      from="出发"
      to={page.spread?.stamp?.place || '远方'}
      date={page.spread?.stamp?.date}
      style={{ right: '-6%', bottom: '5%', width: '46cqw', transform: `rotate(${-6 + r() * 4}deg)` }}
    />
  );
}

function AirmailDecor() {
  return <div className={s.airmailEdge} />;
}

/** Date on a photo = a little postmark in the corner. */
function Imprint({ page }: { page: PageSpec; book: BookDoc }) {
  const d = page.spread?.stamp?.date;
  if (!d) return null;
  return <Postmark className={s.imprint} date={d} text={(page.spread?.stamp?.place || 'POST').toUpperCase()} />;
}

/* ------------------------------------------------------------------ sample */

function sample(): BookDoc {
  const [a, b, c] = sampleBook.spreads.map((x) => x.images[0]);
  const at = (img: typeof a, x: number) => ({ ...img, focal: { x, y: 0.55 } });
  return {
    ...sampleBook,
    id: 'sample-journal',
    themeId: 'journal',
    coverVariant: 'tag',
    meta: {
      ...sampleBook.meta,
      kicker: '基督城',
      title: '新西兰',
      subtitle: '南岛十四天手账',
      dateLine: '2024.09',
      coverLines: ['风、羊群和很长的路'],
      closingLines: ['下一站，', '我们还要一起出发。'],
      dedication: { to: '寄给一起出发的你', body: '车票、登机牌、在路边买的明信片……\n这一次都好好收起来了。' },
    },
    spreads: [
      { id: 'j1', layout: 'collage', images: [at(a, 0.3), at(b, 0.6), at(c, 0.5)], caption: '第一天，把行李箱装满。', stamp: { date: '9.14', place: '基督城' }, stickers: [{ id: 'st1', src: 'theme:ticket', x: 0.5, y: 0.86, rot: -6, scale: 0.16 }] },
      { id: 'j2', layout: 'photo-text', images: [at(b, 0.55)], title: '樱花季', text: '街角的樱花开得正好。\n我们在公园坐了一下午，喝完两杯咖啡。', caption: '樱花开在明亮的春日蓝天里。', stamp: { date: '9.18', place: '基督城' } },
      { ...sampleBook.spreads[0], id: 'j3' },
      { id: 'j4', layout: 'grid', images: [at(a, 0.2), at(c, 0.3), at(b, 0.7), at(c, 0.8)], caption: '一路上的小角落。', stamp: { date: '9.20', place: '凯库拉' } },
      { id: 'j5', layout: 'hero-small', images: [at(c, 0.4), at(a, 0.8), at(b, 0.3)], caption: '傍晚的码头，海面像玻璃。', stamp: { date: '9.22', place: '皮克顿' } },
    ],
  };
}

export const journalDef: ThemeDef = {
  id: 'journal',
  name: '复古旅行手账',
  group: 'classic',
  blurb: '牛皮纸、齿边邮票、邮戳、车票和纸胶带',
  className: s.theme,
  fonts: ['Special Elite', 'LXGW WenKai', 'Noto Serif SC'],
  photo: 'stamp',
  Imprint,
  palettes: [
    { id: 'kraft', name: '牛皮纸', swatch: ['#c9a97a', '#2e241b', '#b5402f'], vars: {} },
    {
      id: 'map',
      name: '旧地图蓝',
      swatch: ['#dcd6c4', '#1f2e3d', '#2f5d86'],
      vars: {
        '--paper': '#dcd6c4',
        '--paper-deep': '#cfc8b2',
        '--paper-edge': '#bdb59c',
        '--board': '#2f4a63',
        '--board-ink': '#efe8d6',
        '--ink': '#1f2e3d',
        '--ink-soft': '#40546a',
        '--accent': '#2f5d86',
        '--paper-pattern': 'var(--pattern-map)',
      },
    },
    {
      id: 'notebook',
      name: '米白笔记本',
      swatch: ['#f4efe3', '#2d2a26', '#d0674a'],
      vars: {
        '--paper': '#f4efe3',
        '--paper-deep': '#ebe4d4',
        '--paper-edge': '#d9d0bc',
        '--board': '#3d3a35',
        '--board-ink': '#f1ebdd',
        '--ink': '#2d2a26',
        '--ink-soft': '#5d574e',
        '--accent': '#d0674a',
        '--paper-pattern': 'var(--pattern-dots)',
        '--room': '#faf8f3',
      },
    },
  ],
  ornaments: {
    titleMark: () => <Compass />,
    divider: () => <Washi color="#d98f76" />,
  },
  decor: [
    { id: 'tape', label: '纸胶带', Component: TapeDecor },
    { id: 'postmark', label: '邮戳', Component: PostmarkDecor },
    { id: 'ticket', label: '车票', Component: TicketDecor },
    { id: 'airmail', label: '航空信封边', Component: AirmailDecor },
  ],
  stickers: {
    tag: { label: '行李牌', Component: LuggageTag },
    compass: { label: '指南针', Component: Compass },
    stamp: { label: '航空邮票', Component: AirmailStamp },
    pin: { label: '大头针', Component: MapPin },
    camera: { label: '老相机', Component: OldCamera },
    ticket: { label: '火车票', Component: (p) => <TrainTicket {...p} from="北京" to="远方" /> },
    boarding: { label: '登机牌', Component: BoardingPass },
    entry: { label: '入境章', Component: (p) => <EntryStamp {...p} /> },
    postcard: { label: '明信片', Component: Postcard },
    coffee: { label: '咖啡', Component: CoffeeCup },
    washi: { label: '纸胶带', Component: Washi },
  },
  covers: [
    { id: 'tag', name: '行李牌', Component: TagCover },
    { id: 'stamps', name: '邮票拼贴', Component: StampsCover },
  ],
  pages: {
    endpaper: Endpaper,
    title: Title,
    dedication: Dedication,
    letter: Letter,
    finis: Finis,
    'back-cover': Back,
  },
  photoFilter: { label: '旧照片', css: 'sepia(0.24) saturate(0.9) contrast(1.03)', overlay: 'paper' },
  wrap: { kind: 'ribbon', paper: '#c9a878', pattern: 'none', ribbon: '#efe3c6', ink: '#3a2a1a', thin: true, stamps: true },
  scene: JournalScene,
  sound: journalSound,
  sample,
};

export { AIRMAIL };
