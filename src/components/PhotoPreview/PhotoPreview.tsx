import { useEffect, useState } from 'react';
import type { BookImage, Spread } from '../../data/schema';
import { useBookEdits } from '../../themes/shared';
import { useEdit } from '../Editor/EditContext';
import styles from './PhotoPreview.module.css';

interface Props {
  image?: BookImage;
  onClick: () => void;
  label: string;
  /** Editor: the spread whose real-photo "snapshot" this print edits. */
  snapshotOf?: Spread;
}

/**
 * A small instant print lying on the table beside the book.
 * It shows the spread's real photo (or the next spread) and turns the page when tapped.
 */
export function PhotoPreview({ image, onClick, label, snapshotOf }: Props) {
  // Hold the last image while fading out so the print doesn't go blank mid-fade.
  const [held, setHeld] = useState(image);
  const [tilt, setTilt] = useState(-6);
  useEffect(() => {
    if (image) {
      setHeld(image);
      setTilt(-4 - Math.random() * 5);
    }
  }, [image]);

  if (snapshotOf) return <SnapshotSlot spread={snapshotOf} />;

  const src = held?.thumb ?? held?.src;
  return (
    <button
      type="button"
      className={styles.print}
      data-show={(image && src) || undefined}
      style={{ ['--tilt' as string]: `${tilt.toFixed(1)}deg` }}
      onClick={onClick}
      aria-label={label}
      tabIndex={image ? 0 : -1}
    >
      <span className={styles.photo}>{src && <img src={src} alt="" draggable={false} />}</span>
    </button>
  );
}

/** Editor version: attach (or remove) the real photo behind an illustration. */
function SnapshotSlot({ spread }: { spread: Spread }) {
  const edit = useEdit()!;
  const e = useBookEdits();
  const snap = spread.snapshot;
  const pick = async () => {
    const im = await edit.pickImage();
    if (im) e.spread(spread.id, (x) => void (x.snapshot = { src: im.src, thumb: im.thumb, alt: '实拍照片' }));
  };
  return (
    <div className={styles.slotWrap} data-show>
      <button type="button" className={styles.print} data-show data-empty={!snap || undefined} style={{ ['--tilt' as string]: '-5deg' }} onClick={pick}>
        <span className={styles.photo}>
          {snap ? <img src={snap.thumb ?? snap.src} alt="" draggable={false} /> : <span className={styles.emptyLabel}>实拍照片</span>}
        </span>
      </button>
      <span className={styles.slotNote}>
        {snap ? (
          <button type="button" onClick={() => e.spread(spread.id, (x) => void delete x.snapshot)}>
            移除
          </button>
        ) : (
          '可选：画背后的那张照片'
        )}
      </span>
    </div>
  );
}
