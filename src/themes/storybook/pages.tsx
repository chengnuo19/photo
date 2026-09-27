import { StorybookScene, storybookSound } from './scene';
import { EditableText, ImageSlot } from '../../components/Editor/Editable';
import { lineSlots, useBookEdits } from '../shared';
import { sampleBook } from '../../data/sampleBook';
import { seeded } from '../context';
import type { DecorProps, PageProps, ThemeDef } from '../types';
import { BeadString, Bloom, Burst, FlightDoodle, Plane, Sparkle, Star, TornEdge } from './Ornaments';
import s from './storybook.module.css';

/* ------------------------------------------------------------------ covers */

function Cover({ book }: PageProps) {
  const e = useBookEdits();
  const [a = '', b = '', c = ''] = lineSlots(book.meta.coverLines, 3, e.editing);
  const img = book.cover.image;
  return (
    <div className={`${s.board} ${s.cover} paper`} data-photo={img ? '' : undefined}>
      <EditableText className={`${s.coverLine} ${s.coverA}`} value={a} onCommit={e.metaLine('coverLines', 0)} placeholder="第一行" />
      {img ? (
        <div className={s.coverWindow}>
          <ImageSlot image={img} onChange={e.coverImage} />
          {e.editing && (
            <button type="button" className={s.coverSwap} onClick={() => e.coverImage?.(undefined)}>
              换回花朵
            </button>
          )}
        </div>
      ) : (
        <>
          <Bloom className={s.coverBloom} size={200} />
          {e.editing && (
            <div className={s.coverWindowEmpty}>
              <ImageSlot onChange={e.coverImage} emptyLabel="用一张照片代替花朵" />
            </div>
          )}
        </>
      )}
      <Star className={s.coverStar1} color="#e8453c" />
      <Star className={s.coverStar2} color="#ef6a3a" />
      <EditableText className={`${s.coverLine} ${s.coverB}`} value={b} onCommit={e.metaLine('coverLines', 1)} placeholder="第二行" />
      <BeadString className={s.coverBeads} width={320} />
      <Burst className={s.coverBurst} />
      <EditableText className={`${s.coverLine} ${s.coverC}`} value={c} onCommit={e.metaLine('coverLines', 2)} placeholder="第三行" />
      <p className={s.coverSig}>
        {book.meta.kicker}
        {book.meta.kicker && book.meta.title ? ' · ' : ''}
        {book.meta.title}
      </p>
    </div>
  );
}

function BackCover({ book }: PageProps) {
  const e = useBookEdits();
  const lines = lineSlots(book.meta.closingLines, 2, e.editing);
  return (
    <div className={`${s.board} ${s.back} paper`}>
      <Burst className={s.backBurst} color="#f07a8a" size={16} />
      <Star className={s.backStar} color="#f2c230" size={12} />
      <BeadString className={s.backBeads} width={260} seed={3} />
      <div className={s.backLines}>
        {lines.map((l, i) => (
          <EditableText key={i} value={l} onCommit={e.metaLine('closingLines', i)} placeholder="封底的话" />
        ))}
      </div>
      <Sparkle className={s.backSparkle} color="#8a6fd6" size={11} />
      <p className={s.backSig}>
        <EditableText as="span" value={book.meta.author} onCommit={e.meta('author')} placeholder="作者" />
        {(book.meta.author || e.editing) && (book.meta.dateLine || e.editing) ? '  ·  ' : ''}
        <EditableText as="span" value={book.meta.dateLine} onCommit={e.meta('dateLine')} placeholder="日期" />
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------ front matter */

function Endpaper() {
  return <div className={`${s.fill} ${s.endpaper} paper`} />;
}

function Blank() {
  return (
    <div className={`${s.fill} paper`}>
      <Sparkle className={s.blankSparkle} color="#d9c9a6" size={10} />
    </div>
  );
}

function Title({ book }: PageProps) {
  const m = book.meta;
  const e = useBookEdits();
  return (
    <div className={`${s.fill} paper`}>
      <div className={`${s.inner} ${s.title}`}>
        <div className={s.titleOrn}>
          <Sparkle color="#f2c230" size={11} />
          <Plane size={22} />
          <Star color="#e8453c" size={10} />
        </div>
        <EditableText className={s.kicker} value={m.kicker} onCommit={e.meta('kicker')} placeholder="一行小字" />
        <EditableText as="h1" className={s.titleMain} value={m.title} onCommit={e.meta('title')} placeholder="书名" />
        <EditableText className={s.subtitle} value={m.subtitle} onCommit={e.meta('subtitle')} placeholder="副标题" />
      </div>
      <EditableText className={s.dateLine} value={m.dateLine} onCommit={e.meta('dateLine')} placeholder="日期" />
    </div>
  );
}

function Dedication({ book }: PageProps) {
  const d = book.meta.dedication;
  const e = useBookEdits();
  if (!d) return <Blank />;
  return (
    <div className={`${s.fill} paper`}>
      <div className={`${s.inner} ${s.dedication}`}>
        <EditableText className={s.dedTo} value={d.to} onCommit={e.dedication('to')} placeholder="献给……" />
        <EditableText className={s.dedBody} value={d.body} onCommit={e.dedication('body')} placeholder="献词" multiline />
        <Sparkle color="#f09aa8" size={10} />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ story */

function ImagePageView({ page }: PageProps) {
  const e = useBookEdits();
  const img = page.images?.[0];
  const idx = page.imageIndexes?.[0] ?? 0;
  const d = page.spread?.overrides?.decor;
  const decor = !d || d === 'theme' || d === 'torn';
  return (
    <div className={`${s.fill} paper`}>
      <ImageSlot
        image={img}
        half={page.half}
        decorative={page.half === 'right'}
        onChange={e.spreadImage(page.spread?.id, idx)}
        emptyLabel="放一张图片"
      />
      {decor && (img || e.editing) && (
        <div className={s.torn} data-half={page.half}>
          <div className={s.tornInner}>
            <TornEdge seed={(page.spread?.id.length ?? 1) + 1} />
            <div className={s.doodle}>
              <FlightDoodle />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function PolaroidPage({ page }: PageProps) {
  const e = useBookEdits();
  const imgs = page.images ?? [];
  return (
    <div className={`${s.fill} ${s.polaroidPage} paper`} data-count={imgs.length}>
      {imgs.map((img, i) => (
        <figure key={i} className={s.print} data-i={i}>
          <div className={s.printPhoto}>
            <ImageSlot image={img} onChange={e.spreadImage(page.spread?.id, page.imageIndexes?.[i] ?? i)} />
          </div>
          <span className={s.tape} />
        </figure>
      ))}
    </div>
  );
}

function Note({ page }: PageProps) {
  const e = useBookEdits();
  const sp = page.spread;
  const stamp = [sp?.stamp?.date, sp?.stamp?.place].filter(Boolean).join(' · ');
  return (
    <div className={`${s.fill} paper`}>
      <div className={`${s.inner} ${s.note}`}>
        <EditableText
          className={s.noteText}
          value={sp?.caption}
          onCommit={(v) => e.spread(sp?.id, (x) => void (x.caption = v))}
          placeholder="写几句话"
          multiline
        />
        {stamp && !e.editing && <p className={s.noteStamp}>{stamp}</p>}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ back matter */

function Letter({ book }: PageProps) {
  const l = book.meta.letter;
  const e = useBookEdits();
  if (!l) return <Blank />;
  return (
    <div className={`${s.fill} paper`}>
      <div className={`${s.inner} ${s.letter}`}>
        <EditableText className={s.letterHi} value={l.salutation} onCommit={e.letter('salutation')} placeholder="称呼" />
        {e.editing ? (
          <EditableText className={`${s.letterBody} ${s.letterBodyEdit}`} value={l.body} onCommit={e.letter('body')} placeholder="信的内容" multiline />
        ) : (
          <div className={s.letterBody}>
            {l.body.split(/\n{2,}/).map((para, i) => (
              <p key={i}>{para}</p>
            ))}
          </div>
        )}
        <div className={s.letterSign}>
          <EditableText value={l.signoff} onCommit={e.letter('signoff')} placeholder="署名" />
          <EditableText className={s.letterDate} value={l.date} onCommit={e.letter('date')} placeholder="日期" />
        </div>
      </div>
    </div>
  );
}

function Finis() {
  return (
    <div className={`${s.fill} ${s.finis} paper`}>
      <p>— 完 —</p>
    </div>
  );
}

/** A few hand-drawn sparkles scattered near the page edges. */
function SparkleScatter({ page, seed }: DecorProps) {
  const r = seeded(seed + (page.side === 'right' ? 17 : 0));
  const colors = ['#f2c230', '#e8453c', '#8a6fd6', '#f09aa8', '#7fc6b6'];
  return (
    <>
      {Array.from({ length: 5 }, (_, i) => {
        const edge = i % 4;
        const t = 0.1 + r() * 0.8;
        const [x, y] = edge === 0 ? [t, 0.05] : edge === 1 ? [0.94, t] : edge === 2 ? [t, 0.94] : [0.05, t];
        const Mark = i % 2 ? Star : Sparkle;
        return (
          <Mark
            key={i}
            color={colors[Math.floor(r() * colors.length)]}
            style={{ position: 'absolute', left: `${x * 100}%`, top: `${y * 100}%`, width: `${3 + r() * 2.5}cqw`, height: 'auto', transform: `translate(-50%,-50%) rotate(${r() * 40 - 20}deg)` }}
          />
        );
      })}
    </>
  );
}

export const storybookDef: ThemeDef = {
  id: 'storybook',
  name: '暖白插画绘本',
  group: 'classic',
  blurb: '米白纸、撕纸边、小飞机和星星，最像一本手绘绘本',
  className: s.theme,
  fonts: ['Noto Serif SC', 'LXGW WenKai'],
  photo: 'mount',
  palettes: [
    { id: 'warm', name: '暖白', swatch: ['#f6f1e7', '#3d372f', '#e8453c'], vars: {} },
    {
      id: 'cream',
      name: '旧纸米黄',
      swatch: ['#efe3c9', '#3f3426', '#c8752f'],
      vars: { '--paper': '#efe3c9', '--paper-deep': '#e6d7b8', '--paper-edge': '#d6c49f', '--board': '#ecdfc4', '--ink': '#3f3426', '--ink-soft': '#6d5d48', '--room': '#f7f2e7' },
    },
    {
      id: 'mist',
      name: '雾蓝',
      swatch: ['#eef0ee', '#2f3a42', '#6c8fb0'],
      vars: { '--paper': '#eef0ee', '--paper-deep': '#e2e6e4', '--paper-edge': '#cfd6d4', '--board': '#e9ecea', '--ink': '#2f3a42', '--ink-soft': '#5c6a72', '--room': '#f6f7f5' },
    },
  ],
  ornaments: {
    titleMark: () => <Plane size={26} />,
    divider: () => <BeadString width={160} seed={2} />,
  },
  decor: [
    { id: 'torn', label: '撕纸边' },
    { id: 'sparkles', label: '小星星', Component: SparkleScatter },
  ],
  stickers: {
    sparkle: { label: '闪光', Component: ({ className }) => <Sparkle className={className} size={40} color="#f2c230" /> },
    star: { label: '红星', Component: ({ className }) => <Star className={className} size={40} /> },
    burst: { label: '烟花', Component: ({ className }) => <Burst className={className} size={40} /> },
    plane: { label: '小飞机', Component: ({ className }) => <Plane className={className} size={60} /> },
    bloom: { label: '花朵', Component: ({ className }) => <Bloom className={className} size={80} /> },
    beads: { label: '串珠', Component: ({ className }) => <BeadString className={className} width={200} /> },
  },
  covers: [{ id: 'bloom', name: '花朵', Component: Cover }],
  pages: {
    'back-cover': BackCover,
    endpaper: Endpaper,
    title: Title,
    dedication: Dedication,
    image: ImagePageView,
    polaroid: PolaroidPage,
    note: Note,
    letter: Letter,
    finis: Finis,
    blank: Blank,
  },
  photoFilter: { label: '暖调', css: 'saturate(1.06) sepia(0.08) brightness(1.02)', overlay: 'light' },
  wrap: { kind: 'ribbon', paper: '#f6f1e7', pattern: 'stars', ribbon: '#e8453c', ink: '#3d372f' },
  scene: StorybookScene,
  sound: storybookSound,
  sample: () => sampleBook,
};
