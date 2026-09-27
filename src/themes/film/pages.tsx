import { FilmScene, filmSound } from './scene';
import { EditableText, ImageSlot } from '../../components/Editor/Editable';
import type { Spread } from '../../data/schema';
import { lineSlots, useBookEdits } from '../shared';
import type { BookDoc } from '../../data/schema';
import type { PageSpec } from '../../data/buildPages';
import { sampleBook } from '../../data/sampleBook';
import { seeded } from '../context';
import type { DecorProps, PageProps, ThemeDef } from '../types';
import s from './film.module.css';

/** Orange camera date imprint, e.g. 9.14 → ’24 9 14 */
function DateImprint({ spread, year }: { spread?: Spread; year?: string }) {
  const d = spread?.stamp?.date;
  if (!d) return null;
  const yy = (year?.match(/\d{4}/)?.[0] ?? '').slice(2);
  return <span className={s.imprint}>{(yy ? `’${yy} ` : '') + d.replace(/[./-]/g, ' ')}</span>;
}

function Perforations() {
  return (
    <>
      <div className={`${s.perf} ${s.perfTop}`} aria-hidden />
      <div className={`${s.perf} ${s.perfBottom}`} aria-hidden />
    </>
  );
}

/* ------------------------------------------------------------------ covers */

function Cover({ book }: PageProps) {
  const e = useBookEdits();
  const img = book.cover.image ?? book.spreads[0]?.images[0];
  const [a = '', b = '', c = ''] = lineSlots(book.meta.coverLines, 3, e.editing);
  return (
    <div className={`${s.board} ${s.cover} paper`}>
      <figure className={s.coverPrint}>
        <div className={s.printPhoto}>
          {img ? (
            <ImageSlot image={img} onChange={e.coverImage} />
          ) : (
            e.editing && <ImageSlot onChange={e.coverImage} emptyLabel="放一张封面照片" />
          )}
        </div>
        <span className={s.tape} />
        <figcaption className={s.coverTitle}>{book.meta.title}</figcaption>
      </figure>
      <div className={s.coverLines}>
        <EditableText as="span" value={a} onCommit={e.metaLine('coverLines', 0)} placeholder="第一行" />
        <EditableText as="span" value={b} onCommit={e.metaLine('coverLines', 1)} placeholder="第二行" />
        <EditableText as="span" value={c} onCommit={e.metaLine('coverLines', 2)} placeholder="第三行" />
      </div>
    </div>
  );
}

function BackCover({ book }: PageProps) {
  const e = useBookEdits();
  const lines = lineSlots(book.meta.closingLines, 2, e.editing);
  return (
    <div className={`${s.board} ${s.back} paper`}>
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

/* ------------------------------------------------------------------ front matter */

function Endpaper() {
  return (
    <div className={`${s.fill} ${s.endpaper} paper`}>
      <Perforations />
    </div>
  );
}

function Blank() {
  return <div className={`${s.fill} paper`} />;
}

function Title({ book }: PageProps) {
  const m = book.meta;
  const e = useBookEdits();
  return (
    <div className={`${s.fill} paper`}>
      <Perforations />
      <div className={`${s.inner} ${s.title}`}>
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
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ story */

function ImagePageView({ book, page }: PageProps) {
  const e = useBookEdits();
  const img = page.images?.[0];
  const idx = page.imageIndexes?.[0] ?? 0;
  const onChange = e.spreadImage(page.spread?.id, idx);

  // A spread-wide photo is mounted across the gutter; single photos are prints.
  if (page.half) {
    return (
      <div className={`${s.fill} paper`}>
        <div className={s.mount} data-half={page.half}>
          <ImageSlot image={img} half={page.half} decorative={page.half === 'right'} onChange={onChange} />
          {page.half === 'right' && <DateImprint spread={page.spread} year={book.meta.dateLine} />}
        </div>
      </div>
    );
  }
  return (
    <div className={`${s.fill} paper`}>
      <figure className={s.single} data-side={page.side}>
        <div className={s.printPhoto}>
          <ImageSlot image={img} onChange={onChange} emptyLabel="放一张照片" />
          {page.side !== 'left' && <DateImprint spread={page.spread} year={book.meta.dateLine} />}
        </div>
        <span className={s.tape} />
      </figure>
    </div>
  );
}

function PolaroidPage({ book, page }: PageProps) {
  const e = useBookEdits();
  const imgs = page.images ?? [];
  return (
    <div className={`${s.fill} ${s.polaroidPage} paper`} data-count={imgs.length}>
      {imgs.map((img, i) => (
        <figure key={i} className={s.print} data-i={i}>
          <div className={s.printPhoto}>
            <ImageSlot image={img} onChange={e.spreadImage(page.spread?.id, page.imageIndexes?.[i] ?? i)} />
            {i === 0 && <DateImprint spread={page.spread} year={book.meta.dateLine} />}
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
        {sp?.stamp?.place && <p className={s.notePlace}>— {sp.stamp.place}</p>}
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
      <div className={s.letterCard}>
        <div className={s.letterInner}>
          <EditableText className={s.letterHi} value={l.salutation} onCommit={e.letter('salutation')} placeholder="称呼" />
          {e.editing ? (
            <EditableText className={s.letterBody} value={l.body} onCommit={e.letter('body')} placeholder="信的内容" multiline />
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
        <span className={s.tape} />
      </div>
    </div>
  );
}

function Finis() {
  return (
    <div className={`${s.fill} ${s.finis} paper`}>
      <Perforations />
      <p>fin.</p>
    </div>
  );
}

function KitImprint({ page, book }: { page: PageSpec; book: BookDoc }) {
  return <DateImprint spread={page.spread} year={book.meta.dateLine} />;
}

/** Warm light leak bleeding in from one edge, as on a roll that saw some sun. */
function LightLeak({ page, seed }: DecorProps) {
  const r = seeded(seed + (page.side === 'right' ? 5 : 0));
  const fromLeft = page.side === 'left' || (page.side === 'single' && r() > 0.5);
  return (
    <div
      className={s.leak}
      style={{
        background: `radial-gradient(60% 45% at ${fromLeft ? '0%' : '100%'} ${20 + r() * 50}%, rgba(255,140,60,0.42), rgba(255,90,40,0.12) 45%, transparent 70%)`,
      }}
    />
  );
}

/** Fine scratches and dust flecks. */
function Dust({ seed }: DecorProps) {
  const r = seeded(seed);
  return (
    <svg className={s.dust} viewBox="0 0 100 122" preserveAspectRatio="none">
      {Array.from({ length: 5 }, (_, i) => {
        const x = r() * 100;
        return <line key={`l${i}`} x1={x} y1={r() * 30} x2={x + r() * 2 - 1} y2={60 + r() * 60} stroke="rgba(255,248,235,0.18)" strokeWidth={0.18} />;
      })}
      {Array.from({ length: 26 }, (_, i) => (
        <circle key={`c${i}`} cx={r() * 100} cy={r() * 122} r={r() * 0.35 + 0.08} fill="rgba(255,248,235,0.28)" />
      ))}
    </svg>
  );
}

const FilmStrip = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 120 40">
    <rect width="120" height="40" rx="1.5" fill="#1b1714" />
    {Array.from({ length: 10 }, (_, i) => (
      <g key={i}>
        <rect x={4 + i * 12} y="3" width="6" height="4" rx="0.8" fill="#f1e9da" />
        <rect x={4 + i * 12} y="33" width="6" height="4" rx="0.8" fill="#f1e9da" />
      </g>
    ))}
    <rect x="6" y="10" width="34" height="20" fill="#c98a4b" />
    <rect x="43" y="10" width="34" height="20" fill="#5d7f8f" />
    <rect x="80" y="10" width="34" height="20" fill="#8a9a5b" />
  </svg>
);

const Canister = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 60 80">
    <rect x="14" y="4" width="10" height="8" fill="#3a3530" />
    <rect x="8" y="10" width="36" height="62" rx="4" fill="#e9c23a" />
    <rect x="8" y="24" width="36" height="30" fill="#c8322b" />
    <text x="26" y="44" textAnchor="middle" fontFamily="monospace" fontWeight="700" fontSize="11" fill="#fff">400</text>
    <rect x="44" y="30" width="10" height="16" fill="#2a2522" />
  </svg>
);

const Camera = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 80 56">
    <rect x="4" y="12" width="72" height="40" rx="5" fill="#2c2825" />
    <rect x="4" y="22" width="72" height="20" fill="#8b6f52" />
    <rect x="12" y="6" width="18" height="8" rx="2" fill="#2c2825" />
    <circle cx="44" cy="32" r="14" fill="#1a1715" stroke="#bfb6a6" strokeWidth="2.5" />
    <circle cx="44" cy="32" r="7" fill="#35506a" />
    <circle cx="41" cy="29" r="2" fill="#fff" opacity="0.6" />
    <rect x="62" y="16" width="8" height="5" rx="1" fill="#e9e3d6" />
  </svg>
);

export const filmDef: ThemeDef = {
  id: 'film',
  name: '胶片 · 拍立得',
  group: 'classic',
  blurb: '深色相册卡纸、白边相纸、胶带和橙色日期印',
  className: s.theme,
  fonts: ['LXGW WenKai', 'Noto Serif SC'],
  photo: 'print',
  Imprint: KitImprint,
  palettes: [
    { id: 'brown', name: '深棕相册', swatch: ['#2b2622', '#efe6d4', '#ff8f3f'], vars: {} },
    {
      id: 'ink',
      name: '墨黑',
      swatch: ['#171615', '#f1ede6', '#ff8f3f'],
      vars: { '--paper': '#171615', '--paper-deep': '#111010', '--paper-edge': '#2a2826', '--board': '#141312' },
    },
    {
      id: 'olive',
      name: '军绿',
      swatch: ['#2c3027', '#ece6d3', '#ffb347'],
      vars: { '--paper': '#2c3027', '--paper-deep': '#23271f', '--paper-edge': '#3c4135', '--board': '#262a21', '--imprint': '#ffb347' },
    },
  ],
  decor: [
    { id: 'leak', label: '漏光', Component: LightLeak },
    { id: 'dust', label: '划痕灰尘', Component: Dust },
  ],
  defaultDecor: 'none',
  stickers: {
    filmstrip: { label: '底片条', Component: FilmStrip },
    canister: { label: '胶卷盒', Component: Canister },
    camera: { label: '旁轴相机', Component: Camera },
  },
  covers: [{ id: 'print', name: '一张相纸', Component: Cover }],
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
  photoFilter: { label: '胶片颗粒', css: 'sepia(0.16) saturate(1.12) contrast(1.06) brightness(1.02)', overlay: 'grain' },
  wrap: { kind: 'canister' },
  scene: FilmScene,
  sound: filmSound,
  sample: () => ({ ...sampleBook, id: 'sample-film', themeId: 'film' }),
};
