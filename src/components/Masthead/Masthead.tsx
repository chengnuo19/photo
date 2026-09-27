import type { ReactNode } from 'react';
import type { BookDoc } from '../../data/schema';
import styles from './Masthead.module.css';

interface Props {
  book?: BookDoc;
  /** Brand links back to the shelf when given (absent in exported books). */
  shelfHref?: string;
  /** Quiet links / actions on the right. */
  right?: ReactNode;
  footer?: ReactNode;
}

/** The tiny lines in the room's corners — the only chrome on the page. */
export function Masthead({ book, shelfHref, right, footer }: Props) {
  const m = book?.meta;
  const Brand = shelfHref ? 'a' : 'span';
  return (
    <>
      <header className={styles.top}>
        <Brand className={styles.brand} {...(shelfHref ? { href: shelfHref, title: '回到书架' } : {})}>
          <span className={styles.mark} aria-hidden>
            <svg viewBox="0 0 16 16" width="13" height="13">
              <rect x="2.5" y="1.5" width="11" height="13" rx="1" fill="none" stroke="currentColor" strokeWidth="1.1" />
              <path d="M8 1.5 V14.5" stroke="currentColor" strokeWidth="0.8" opacity="0.5" />
            </svg>
          </span>
          <span className={styles.name}>回忆绘本</span>
        </Brand>
        {m && (
          <>
            <span className={styles.sep} aria-hidden>
              /
            </span>
            <span className={styles.book}>
              {m.kicker ? `${m.kicker} · ` : ''}
              {m.title}
            </span>
          </>
        )}
      </header>
      {right && <nav className={styles.right}>{right}</nav>}
      {(footer ?? (m?.author ? `© ${m.author}` : null)) && <footer className={styles.bottom}>{footer ?? `© ${m!.author}`}</footer>}
    </>
  );
}
