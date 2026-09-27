import { WednesdayScene, wednesdaySound } from './scene';
import { EditableText, ImageSlot } from '../../components/Editor/Editable';
import type { PageSpec } from '../../data/buildPages';
import type { BookDoc } from '../../data/schema';
import { seeded } from '../context';
import k from '../kit/kit.module.css';
import { lineSlots, useBookEdits } from '../shared';
import type { DecorProps, FrameProps, PageProps, ThemeDef } from '../types';
import { Candelabra, Cello, Crest, Crow, DeadRose, Drips, RainWindow, Skull, Spider, Typewriter, Umbrella, WebCorner } from './ornaments';
import s from './wednesday.module.css';

const art = (f: string) => `${import.meta.env.BASE_URL}assets/themes/wednesday/${f}.svg`;

/* ------------------------------------------------------------------ photo frame */

/** Black frame, thin inner rule and spider-web lace in two corners. */
function LaceFrame({ image, onChange, page, book, className, style, imprint, emptyLabel }: FrameProps) {
  return (
    <figure className={`${k.photo} ${s.frame} ${className ?? ''}`} style={style}>
      <div className={s.frameWindow}>
        <ImageSlot image={image} onChange={onChange} emptyLabel={emptyLabel} />
        {imprint && <Imprint page={page} book={book} />}
      </div>
      <WebCorner className={`${s.web} ${s.webTL}`} />
      <WebCorner className={`${s.web} ${s.webBR}`} />
    </figure>
  );
}

/** Typed date on a strip of paper, like a label in an old album. */
function Imprint({ page }: { page: PageSpec; book: BookDoc }) {
  const d = page.spread?.stamp?.date;
  if (!d) return null;
  const [m, day] = d.split(/[./-]/);
  const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
  const label = months[Number(m) - 1] ? `${months[Number(m) - 1]}. ${day}` : d;
  return <span className={s.imprint}>{label}</span>;
}

/* ------------------------------------------------------------------ covers */

function CrestCover({ book }: PageProps) {
  const e = useBookEdits();
  const [a = ''] = lineSlots(book.meta.coverLines, 1, e.editing);
  return (
    <div className={`${s.board} paper`}>
      <WebCorner className={`${s.coverWeb} ${s.webTL}`} />
      <WebCorner className={`${s.coverWeb} ${s.webTR}`} />
      <WebCorner className={`${s.coverWeb} ${s.webBL}`} />
      <WebCorner className={`${s.coverWeb} ${s.webBR}`} />
      <p className={s.coverKicker}>{book.meta.kicker}</p>
      <Crest className={s.crest} />
      <p className={s.coverTitle}>{book.meta.title}</p>
      <EditableText className={s.coverLine} value={a} onCommit={e.metaLine('coverLines', 0)} placeholder="一句话" />
    </div>
  );
}

function StripesCover({ book }: PageProps) {
  return (
    <div className={`${s.board} paper`}>
      <div className={s.stripes} />
      <Crow className={s.stripesCrow} />
      <p className={s.stripesTitle}>{book.meta.title}</p>
      <p className={s.stripesKicker}>{book.meta.kicker}</p>
      <DeadRose className={s.stripesRose} />
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
        <Spider className={s.titleSpider} />
        <EditableText className={s.kicker} value={m.kicker} onCommit={e.meta('kicker')} placeholder="一行小字" />
        <EditableText as="h1" className={s.title} value={m.title} onCommit={e.meta('title')} placeholder="书名" />
        <EditableText className={s.subtitle} value={m.subtitle} onCommit={e.meta('subtitle')} placeholder="副标题" />
        <DeadRose className={s.titleRose} />
      </div>
      <EditableText className={s.dateLine} value={m.dateLine} onCommit={e.meta('dateLine')} placeholder="日期" />
    </div>
  );
}

function Dedication({ book }: PageProps) {
  const d = book.meta.dedication;
  const e = useBookEdits();
  if (!d) return <div className={`${s.fill} paper`} />;
  return (
    <div className={`${s.fill} paper`}>
      <div className={s.note}>
        <span className={s.pin} aria-hidden />
        <EditableText className={s.noteTo} value={d.to} onCommit={e.dedication('to')} placeholder="致……" />
        <EditableText className={s.noteBody} value={d.body} onCommit={e.dedication('body')} placeholder="献词" multiline />
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
      <div className={s.letter}>
        <EditableText className={s.lHi} value={l.salutation} onCommit={e.letter('salutation')} placeholder="称呼" />
        <EditableText className={s.lBody} value={l.body} onCommit={e.letter('body')} placeholder="信的内容" multiline />
        <div className={s.lSign}>
          <EditableText value={l.signoff} onCommit={e.letter('signoff')} placeholder="署名" />
          <EditableText className={s.lDate} value={l.date} onCommit={e.letter('date')} placeholder="日期" />
        </div>
        <span className={s.seal} aria-hidden>
          W
        </span>
      </div>
    </div>
  );
}

function Finis() {
  return (
    <div className={`${s.fill} ${s.finis} paper`}>
      <Candelabra className={s.finisCandle} />
      <p>The End</p>
    </div>
  );
}

function Back({ book }: PageProps) {
  const e = useBookEdits();
  const lines = lineSlots(book.meta.closingLines, 2, e.editing);
  return (
    <div className={`${s.board} paper`}>
      <Crest className={s.backCrest} />
      <div className={s.backLines}>
        {lines.map((l, i) => (
          <EditableText key={i} value={l} onCommit={e.metaLine('closingLines', i)} placeholder="封底的话" />
        ))}
      </div>
      <p className={s.backSig}>
        <EditableText as="span" value={book.meta.author} onCommit={e.meta('author')} placeholder="作者" />
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------ decorations */

function StripesDecor({ page }: DecorProps) {
  return <div className={s.edgeStripes} data-side={page.side} />;
}

function LaceDecor({ page }: DecorProps) {
  const outer = page.side === 'left' ? [s.webTL, s.webBL] : page.side === 'right' ? [s.webTR, s.webBR] : [s.webTL, s.webBR];
  return (
    <>
      {outer.map((c) => (
        <WebCorner key={c} className={`${s.pageWeb} ${c}`} />
      ))}
    </>
  );
}

function CrowDecor({ page, seed }: DecorProps) {
  if (page.side === 'left') return null;
  const r = seeded(seed);
  return <Crow className={s.decoCrow} style={{ right: `${6 + r() * 10}%` }} />;
}

function WaxDecor({ page, seed }: DecorProps) {
  return <Drips className={s.drips} seed={seed + (page.side === 'right' ? 7 : 0)} />;
}

/* ------------------------------------------------------------------ sample */

function sample(): BookDoc {
  const img = (f: string, alt: string, x = 0.5) => ({ src: art(f), alt, focal: { x, y: 0.5 } });
  return {
    id: 'sample-wednesday',
    version: 1,
    themeId: 'wednesday',
    coverVariant: 'crest',
    meta: {
      kicker: '奈弗莫尔学院',
      title: '一个下雨的学期',
      subtitle: '写给不喜欢阳光的人',
      author: '星期三',
      dateLine: '十月 · 雨',
      coverLines: ['我不笑，但我记得一切。'],
      closingLines: ['雨还会再下，', '我们下学期见。'],
      dedication: { to: '致乌鸦、雨夜，和我的大提琴', body: '有些人喜欢晴天。\n我更喜欢现在这样。' },
      letter: {
        salutation: '致那个总是太吵的室友：',
        body: '这个学期，钟楼、湖边和你房间里的彩灯都很吵。\n\n但我承认，没有它们，这里会安静得让人不适应。',
        signoff: '—— W.',
        date: '十月末',
      },
    },
    cover: {},
    sound: { flip: true },
    spreads: [
      { id: 'w1', layout: 'full-spread', images: [img('academy', '雨中的哥特学院，尖塔与乌鸦')], caption: '钟楼在雨里敲了十三下。', stamp: { date: '10.13', place: '钟楼' } },
      {
        id: 'w2',
        layout: 'photo-text',
        images: [img('window', '蛛网花窗下的大提琴与烛台', 0.45)],
        title: '午夜练琴',
        text: '窗外的雨像节拍器。\n我拉完最后一个音符，蜡烛刚好燃尽。',
        caption: '宿舍的蛛网花窗。',
        stamp: { date: '10.20', place: '宿舍' },
      },
      { id: 'w3', layout: 'full-spread', images: [img('lake', '雾中的湖、枯树和栈桥', 0.5)], caption: '湖边起雾的下午，一只乌鸦跟了我一路。', stamp: { date: '10.27', place: '湖边' }, overrides: { decor: 'crow' } },
      { id: 'w4', layout: 'text', images: [], caption: '我不喜欢惊喜，\n除非是我准备的。', title: '日记 · 十月', text: '今天有人问我为什么总穿黑色。\n我说，在有人发明更暗的颜色之前，我没有别的选择。' },
    ],
  };
}

export const wednesdayDef: ThemeDef = {
  id: 'wednesday',
  name: '星期三',
  group: 'screen',
  blurb: '哥特寄宿学校：乌鸦、枯玫瑰、大提琴、打字机和黑白条纹',
  className: s.theme,
  fonts: ['UnifrakturMaguntia', 'Special Elite', 'Noto Serif SC'],
  photo: 'mount',
  Frame: LaceFrame,
  Imprint,
  palettes: [
    { id: 'silent', name: '黑白默片', swatch: ['#d9d6d0', '#151515', '#5b1520'], vars: {} },
    {
      id: 'violet',
      name: '暗紫',
      swatch: ['#2a2430', '#e6e0ea', '#9a7fb8'],
      vars: {
        '--paper': '#2a2430',
        '--paper-deep': '#221d27',
        '--paper-edge': '#3a3242',
        '--board': '#1d1822',
        '--ink': '#e6e0ea',
        '--ink-soft': '#b9aec4',
        '--accent': '#9a7fb8',
        '--frame': '#0f0c12',
        '--room': '#e9e6ec',
      },
    },
    {
      id: 'bone',
      name: '骨白',
      swatch: ['#efe9dd', '#1d1b19', '#3a3a3a'],
      vars: { '--paper': '#efe9dd', '--paper-deep': '#e5ddcd', '--paper-edge': '#d3c9b6', '--board': '#e9e2d4', '--room': '#f6f3ee' },
    },
  ],
  ornaments: {
    titleMark: () => <Crest />,
    divider: () => <DeadRose style={{ width: '7cqw', transform: 'rotate(90deg)' }} />,
    finis: () => <Candelabra />,
  },
  decor: [
    { id: 'lace', label: '蛛网蕾丝', Component: LaceDecor },
    { id: 'stripes', label: '黑白条纹', Component: StripesDecor },
    { id: 'crow', label: '乌鸦', Component: CrowDecor },
    { id: 'wax', label: '烛泪', Component: WaxDecor },
    { id: 'mono', label: '黑白照片' },
  ],
  stickers: {
    crow: { label: '乌鸦', Component: Crow },
    rose: { label: '枯玫瑰', Component: DeadRose },
    cello: { label: '大提琴', Component: Cello },
    typewriter: { label: '打字机', Component: Typewriter },
    spider: { label: '蜘蛛', Component: Spider },
    umbrella: { label: '黑伞', Component: Umbrella },
    candelabra: { label: '烛台', Component: Candelabra },
    crest: { label: '学院纹章', Component: Crest },
    skull: { label: '骷髅', Component: Skull },
    window: { label: '雨夜的窗', Component: RainWindow },
  },
  covers: [
    { id: 'crest', name: '学院纹章', Component: CrestCover },
    { id: 'stripes', name: '黑白条纹', Component: StripesCover },
  ],
  pages: {
    title: Title,
    dedication: Dedication,
    letter: Letter,
    finis: Finis,
    'back-cover': Back,
  },
  photoFilter: { label: '黑白高反差', css: 'grayscale(1) contrast(1.28) brightness(0.96)', overlay: 'grain' },
  wrap: { kind: 'envelope', paper: '#1c1c1e', flap: '#29292d', seal: '#5a0f16', mark: 'N', ink: '#d9d4c7' },
  scene: WednesdayScene,
  sound: wednesdaySound,
  sample,
};
