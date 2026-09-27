import { useRef, useState } from 'react';
import type { BuiltBook, View } from '../../data/buildPages';
import type { BookDoc } from '../../data/schema';
import s from './PageStrip.module.css';

interface Props {
  doc: BookDoc;
  /** Resolved book (object URLs) for thumbnails. */
  resolved: BookDoc;
  built: BuiltBook | null;
  current: number;
  onJump: (view: number) => void;
  onMove: (from: number, to: number) => void;
  onAdd: () => void;
}

const LABEL: Record<string, string> = {
  cover: '封面',
  title: '扉页',
  dedication: '献词',
  letter: '信',
  finis: '尾页',
  back: '封底',
};

/**
 * The book laid out as a row of small spreads under the page. Click to go there,
 * drag story spreads to reorder, “+” to add photos.
 */
export function PageStrip({ doc, resolved, built, current, onJump, onMove, onAdd }: Props) {
  const drag = useRef<number | null>(null);
  const [dropAt, setDropAt] = useState<number | null>(null);
  const views: View[] = built?.views ?? [];
  const firstStory = views.findIndex((v) => v.kind === 'story');
  const storyIndex = (vi: number) => vi - (firstStory < 0 ? 0 : firstStory);
  const insertAt = firstStory < 0 ? views.findIndex((v) => v.kind === 'letter' || v.kind === 'finis') : -1;

  const tiles = views.map((v, vi) => {
    const isStory = v.kind === 'story';
    const sp = isStory ? resolved.spreads.find((x) => x.id === v.spread!.id) : undefined;
    const img = sp?.images[0];
    const single = v.kind === 'cover' || v.kind === 'back';
    return (
      <li
        key={v.key}
        className={s.tile}
        data-current={vi === current || undefined}
        data-single={single || undefined}
        data-drop={(isStory && dropAt === storyIndex(vi)) || undefined}
        draggable={isStory}
        onDragStart={(e) => {
          drag.current = storyIndex(vi);
          e.dataTransfer.effectAllowed = 'move';
          e.dataTransfer.setData('text/plain', v.key);
        }}
        onDragOver={(e) => {
          if (drag.current === null || !isStory) return;
          e.preventDefault();
          setDropAt(storyIndex(vi));
        }}
        onDragEnd={() => {
          drag.current = null;
          setDropAt(null);
        }}
        onDrop={(e) => {
          e.preventDefault();
          if (drag.current !== null && isStory) onMove(drag.current, storyIndex(vi));
          drag.current = null;
          setDropAt(null);
        }}
      >
        <button type="button" onClick={() => onJump(vi)} aria-label={isStory ? `第 ${storyIndex(vi) + 1} 页` : LABEL[v.kind]} aria-current={vi === current || undefined}>
          {img?.src ? (
            <img src={img.thumb ?? img.src} alt="" draggable={false} style={{ objectPosition: `${(img.focal?.x ?? 0.5) * 100}% ${(img.focal?.y ?? 0.5) * 100}%` }} />
          ) : (
            <span className={s.label}>{isStory ? '空白' : LABEL[v.kind]}</span>
          )}
          {!single && <i className={s.gutter} aria-hidden />}
        </button>
      </li>
    );
  });

  // "+" goes after the last story spread (or before the back matter when there are none).
  const plus = (
    <li key="__add" className={`${s.tile} ${s.add}`}>
      <button type="button" onClick={onAdd} aria-label="添加照片">
        <span>+</span>
      </button>
    </li>
  );
  const lastStory = views.map((v) => v.kind).lastIndexOf('story');
  const at = lastStory >= 0 ? lastStory + 1 : insertAt >= 0 ? insertAt : tiles.length - 2;
  tiles.splice(at, 0, plus);

  return (
    <nav className={s.strip} aria-label="页面">
      <ol className={s.row}>{tiles}</ol>
      <p className={s.hint}>
        {doc.spreads.length ? '拖动小图可以调整顺序' : '把照片拖进窗口，或点 + 添加'}
      </p>
    </nav>
  );
}
