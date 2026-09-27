import { EditableText } from '../../components/Editor/Editable';
import type { PageKind } from '../../data/buildPages';
import type { BookImage } from '../../data/schema';
import { hashId, seeded, useTheme } from '../context';
import { lineSlots, useBookEdits } from '../shared';
import type { PageProps } from '../types';
import { Photo } from './Photo';
import { SpreadLayer } from './SpreadLayer';
import s from './kit.module.css';

/*
 * Generic pages every theme gets for free. Look comes from CSS variables
 * (--paper, --ink, --accent, --font-display, --font-cn, --font-hand, --print, --tape …)
 * and the theme's ornaments; themes override whichever pages they want to hand-make.
 */

/* ------------------------------------------------------------------ covers */

export function KitCover({ book, page }: PageProps) {
  const e = useBookEdits();
  const img = book.cover.image ?? book.spreads[0]?.images[0];
  const [a = '', b = ''] = lineSlots(book.meta.coverLines, 2, e.editing);
  return (
    <div className={`${s.board} ${s.kitCover} paper`}>
      <Photo image={img} onChange={e.coverImage} page={page} book={book} className={s.coverPhoto} emptyLabel="放一张封面照片" />
      <div className={s.coverText}>
        <p className={s.coverTitle}>{book.meta.title}</p>
        <EditableText as="span" className={s.coverLine} value={a} onCommit={e.metaLine('coverLines', 0)} placeholder="封面的话" />
        <EditableText as="span" className={s.coverLine} value={b} onCommit={e.metaLine('coverLines', 1)} placeholder="" />
      </div>
    </div>
  );
}

export function KitBack({ book }: PageProps) {
  const e = useBookEdits();
  const lines = lineSlots(book.meta.closingLines, 2, e.editing);
  return (
    <div className={`${s.board} ${s.kitBack} paper`}>
      <div className={s.backLines}>
        {lines.map((l, i) => (
          <EditableText key={i} value={l} onCommit={e.metaLine('closingLines', i)} placeholder="封底的话" />
        ))}
      </div>
      <p className={s.backSig}>
        <EditableText as="span" value={book.meta.author} onCommit={e.meta('author')} placeholder="作者" />
        {(book.meta.author || e.editing) && (book.meta.dateLine || e.editing) ? '  ·  ' : ''}
        <EditableText as="span" value={book.meta.dateLine} onCommit={e.meta('dateLine')} placeholder="日期" />
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------ front & back matter */

export function KitEndpaper() {
  return <div className={`${s.fill} ${s.endpaper} paper`} />;
}

export function KitBlank() {
  return <div className={`${s.fill} paper`} />;
}

export function KitTitle({ book }: PageProps) {
  const m = book.meta;
  const e = useBookEdits();
  const Mark = useTheme().ornaments?.titleMark;
  return (
    <div className={`${s.fill} paper`}>
      <div className={`${s.inner} ${s.title}`}>
        {Mark && (
          <div className={s.titleMark}>
            <Mark />
          </div>
        )}
        <EditableText className={s.kicker} value={m.kicker} onCommit={e.meta('kicker')} placeholder="一行小字" />
        <EditableText as="h1" className={s.titleMain} value={m.title} onCommit={e.meta('title')} placeholder="书名" />
        <EditableText className={s.subtitle} value={m.subtitle} onCommit={e.meta('subtitle')} placeholder="副标题" />
      </div>
      <EditableText className={s.dateLine} value={m.dateLine} onCommit={e.meta('dateLine')} placeholder="日期" />
    </div>
  );
}

export function KitDedication({ book }: PageProps) {
  const d = book.meta.dedication;
  const e = useBookEdits();
  const Divider = useTheme().ornaments?.divider;
  if (!d) return <KitBlank />;
  return (
    <div className={`${s.fill} paper`}>
      <div className={`${s.inner} ${s.dedication}`}>
        <EditableText className={s.dedTo} value={d.to} onCommit={e.dedication('to')} placeholder="献给……" />
        <EditableText className={s.dedBody} value={d.body} onCommit={e.dedication('body')} placeholder="献词" multiline />
        {Divider && <Divider />}
      </div>
    </div>
  );
}

export function KitLetter({ book }: PageProps) {
  const l = book.meta.letter;
  const e = useBookEdits();
  if (!l) return <KitBlank />;
  return (
    <div className={`${s.fill} paper`}>
      <div className={`${s.inner} ${s.letter}`}>
        <EditableText className={s.letterHi} value={l.salutation} onCommit={e.letter('salutation')} placeholder="称呼" />
        {e.editing ? (
          <EditableText className={`${s.letterBody} ${s.pre}`} value={l.body} onCommit={e.letter('body')} placeholder="信的内容" multiline />
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

export function KitFinis() {
  const Mark = useTheme().ornaments?.finis;
  return <div className={`${s.fill} ${s.finis} paper`}>{Mark ? <Mark /> : <p>— 完 —</p>}</div>;
}

/* ------------------------------------------------------------------ story pages */

function useImageEdit(p: PageProps['page'], i: number) {
  const e = useBookEdits();
  return e.spreadImage(p.spread?.id, p.imageIndexes?.[i] ?? i);
}

/** Whole-page image: full-bleed themes bleed; framed themes mount it with margins. */
export function KitImage({ book, page }: PageProps) {
  const theme = useTheme();
  const onChange = useImageEdit(page, 0);
  const img = page.images?.[0];
  if (theme.photo === 'bleed') {
    return (
      <div className={`${s.fill} paper`}>
        <Photo image={img} onChange={onChange} page={page} book={book} half={page.half} className={s.full} imprint />
      </div>
    );
  }
  if (page.half) {
    // spread-wide picture mounted across the gutter, even margins outside
    return (
      <div className={`${s.fill} paper`}>
        <Photo
          image={img}
          onChange={onChange}
          page={page}
          book={book}
          half={page.half}
          variant="bleed"
          className={`${s.acrossGutter} ${page.half === 'left' ? s.agLeft : s.agRight}`}
          imprint
        />
      </div>
    );
  }
  return (
    <div className={`${s.fill} paper`}>
      <Photo image={img} onChange={onChange} page={page} book={book} className={s.bigFramed} imprint tape={theme.photo === 'print'} />
    </div>
  );
}

export function KitFramed({ book, page }: PageProps) {
  const onChange = useImageEdit(page, 0);
  const theme = useTheme();
  return (
    <div className={`${s.fill} paper`}>
      <Photo image={page.images?.[0]} onChange={onChange} page={page} book={book} className={s.framed} imprint tape={theme.photo === 'print'} />
    </div>
  );
}

export function KitStack({ book, page }: PageProps) {
  const a = useImageEdit(page, 0);
  const b = useImageEdit(page, 1);
  const e = useBookEdits();
  const imgs = page.images ?? [];
  const two = imgs.length > 1 || e.editing;
  return (
    <div className={`${s.fill} paper`} data-count={two ? 2 : 1}>
      <Photo image={imgs[0]} onChange={a} page={page} book={book} className={`${s.stackPhoto} ${two ? s.stackTop : s.stackOnly}`} imprint={!two} />
      {two && <Photo image={imgs[1]} onChange={b} page={page} book={book} className={`${s.stackPhoto} ${s.stackBottom}`} imprint emptyLabel="放一张图片" />}
    </div>
  );
}

export function KitWriting({ page }: PageProps) {
  const e = useBookEdits();
  const sp = page.spread;
  const Divider = useTheme().ornaments?.divider;
  const stamp = [sp?.stamp?.date, sp?.stamp?.place].filter(Boolean).join(' · ');
  return (
    <div className={`${s.fill} paper`}>
      <div className={`${s.inner} ${s.writing}`}>
        <EditableText as="h2" className={s.writingTitle} value={sp?.title} onCommit={(v) => e.spread(sp?.id, (x) => void (x.title = v))} placeholder="小标题" />
        {Divider && (sp?.title || e.editing) && (
          <div className={s.writingDivider}>
            <Divider />
          </div>
        )}
        <EditableText
          className={`${s.writingBody} ${s.pre}`}
          value={sp?.text}
          onCommit={(v) => e.spread(sp?.id, (x) => void (x.text = v))}
          placeholder="写下这一天发生的事……"
          multiline
        />
        {stamp && <p className={s.writingStamp}>{stamp}</p>}
      </div>
    </div>
  );
}

export function KitQuote({ page }: PageProps) {
  const e = useBookEdits();
  const sp = page.spread;
  const Divider = useTheme().ornaments?.divider;
  return (
    <div className={`${s.fill} paper`}>
      <div className={`${s.inner} ${s.quote}`}>
        {Divider && <Divider />}
        <EditableText
          className={`${s.quoteText} ${s.pre}`}
          value={sp?.caption}
          onCommit={(v) => e.spread(sp?.id, (x) => void (x.caption = v))}
          placeholder="一句想放大的话"
          multiline
        />
      </div>
    </div>
  );
}

/** Scrapbook prints in spread coordinates, so they line up across the spine. */
const COLLAGE_LAND: [number, number, number, number][][] = [
  [],
  [[0.26, 0.5, 0.34, -3]],
  [[0.25, 0.48, 0.32, -4], [0.74, 0.5, 0.3, 3]],
  [[0.24, 0.45, 0.32, -5], [0.74, 0.32, 0.26, 4], [0.7, 0.72, 0.24, -2]],
  [[0.2, 0.3, 0.26, -4], [0.3, 0.72, 0.24, 3], [0.72, 0.33, 0.26, 3], [0.77, 0.73, 0.22, -5]],
  [[0.18, 0.3, 0.23, -5], [0.34, 0.7, 0.22, 4], [0.67, 0.27, 0.22, 3], [0.84, 0.56, 0.19, -4], [0.63, 0.77, 0.2, 2]],
];
const COLLAGE_PORT: [number, number, number, number][][] = [
  [],
  [[0.5, 0.48, 0.66, -3]],
  [[0.4, 0.3, 0.56, -4], [0.62, 0.7, 0.54, 3]],
  [[0.36, 0.25, 0.54, -4], [0.66, 0.52, 0.5, 4], [0.4, 0.8, 0.46, -2]],
  [[0.33, 0.23, 0.48, -4], [0.7, 0.36, 0.44, 4], [0.34, 0.66, 0.44, 3], [0.7, 0.82, 0.42, -3]],
];

export function KitCollage({ book, page }: PageProps) {
  const e = useBookEdits();
  const theme = useTheme();
  const imgs = page.images ?? [];
  const land = page.part !== 'full';
  const presets = (land ? COLLAGE_LAND : COLLAGE_PORT)[Math.min(imgs.length, land ? 5 : 4)] ?? [];
  const rand = seeded(hashId(page.spread?.id));
  const edits = imgs.map((_, i) => e.spreadImage(page.spread?.id, page.imageIndexes?.[i] ?? i));
  return (
    <div className={`${s.fill} paper`}>
      <SpreadLayer part={page.part}>
        {presets.map(([x, y, w, r], i) => (
          <Photo
            key={i}
            image={imgs[i] as BookImage}
            onChange={edits[i]}
            page={page}
            book={book}
            variant={theme.photo === 'bleed' ? 'print' : undefined}
            className={s.collagePrint}
            style={{ left: `${x * 100}%`, top: `${y * 100}%`, width: `${w * 100}%`, rotate: `${r + (rand() - 0.5) * 2}deg` }}
            tape={i % 2 === 0}
            imprint={i === 0}
          />
        ))}
      </SpreadLayer>
    </div>
  );
}

export function KitPolaroid(props: PageProps) {
  return <KitCollage {...props} page={{ ...props.page, part: 'full' }} />;
}

export function KitNote({ page }: PageProps) {
  const e = useBookEdits();
  const sp = page.spread;
  return (
    <div className={`${s.fill} paper`}>
      <div className={`${s.inner} ${s.note}`}>
        <EditableText className={`${s.noteText} ${s.pre}`} value={sp?.caption} onCommit={(v) => e.spread(sp?.id, (x) => void (x.caption = v))} placeholder="写几句话" multiline />
        {sp?.stamp?.place && <p className={s.notePlace}>— {sp.stamp.place}</p>}
      </div>
    </div>
  );
}

export const kitPages: Record<PageKind, (p: PageProps) => React.ReactNode> = {
  cover: KitCover,
  'back-cover': KitBack,
  endpaper: KitEndpaper,
  title: KitTitle,
  dedication: KitDedication,
  image: KitImage,
  polaroid: KitPolaroid,
  note: KitNote,
  letter: KitLetter,
  finis: KitFinis,
  blank: KitBlank,
  framed: KitFramed,
  writing: KitWriting,
  quote: KitQuote,
  stack: KitStack,
  collage: KitCollage,
};
