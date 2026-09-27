import { useEffect, useState } from 'react';
import type { Spread } from '../../data/schema';
import { useBookEdits } from '../../themes/shared';
import { EditableText } from '../Editor/Editable';
import styles from './Caption.module.css';

interface Props {
  spread?: Spread;
  visible: boolean;
  viewKey?: string;
  /** Show only the date/place (the caption text is already on the page). */
  stampOnly?: boolean;
}

/**
 * One quiet line under the book. It fades out as a page starts turning and fades in
 * with the new text once the page has settled — never swaps text while visible.
 * In the editor the caption and its date/place stamp are edited right here.
 */
export function Caption({ spread, visible, viewKey, stampOnly }: Props) {
  const e = useBookEdits();
  const [shown, setShown] = useState<{ key?: string; spread?: Spread }>({ key: viewKey, spread });
  const hasText = !!(spread?.caption || spread?.stamp?.date || spread?.stamp?.place);

  useEffect(() => {
    if (visible) setShown({ key: viewKey, spread });
  }, [visible, viewKey, spread]);

  const s = shown.spread;
  const hand = s?.overrides?.captionStyle === 'hand';
  const show = visible && shown.key === viewKey && (hasText || (e.editing && !!spread));

  if (e.editing && s) {
    const id = s.id;
    return (
      <div className={styles.caption} data-show={show || undefined} data-hand={hand || undefined} data-editing>
        <EditableText
          key={id + 'c'}
          as="span"
          className={styles.text}
          value={s.caption}
          onCommit={(v) => e.spread(id, (x) => void (x.caption = v))}
          placeholder="给这一页写一句话"
        />
        <span className={styles.stamp}>
          <EditableText
            key={id + 'd'}
            as="span"
            value={s.stamp?.date}
            onCommit={(v) => e.spread(id, (x) => void (x.stamp = { ...x.stamp, date: v }))}
            placeholder="日期"
          />
          {' · '}
          <EditableText
            key={id + 'p'}
            as="span"
            value={s.stamp?.place}
            onCommit={(v) => e.spread(id, (x) => void (x.stamp = { ...x.stamp, place: v }))}
            placeholder="地点"
          />
        </span>
      </div>
    );
  }

  const stamp = [s?.stamp?.date, s?.stamp?.place].filter(Boolean).join(' · ');
  return (
    <p className={styles.caption} data-show={show || undefined} data-hand={hand || undefined} data-mb-caption>
      {s?.caption && !stampOnly && <span className={styles.text}>{s.caption}</span>}
      {stamp && <span className={styles.stamp}>{stamp}</span>}
    </p>
  );
}
