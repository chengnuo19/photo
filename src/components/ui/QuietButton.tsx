import type { ButtonHTMLAttributes, AnchorHTMLAttributes } from 'react';
import styles from './QuietButton.module.css';

/** Text-only control used for all chrome: no pills, no icons — like a note in the margin. */
export function QuietButton({ className, active, ...rest }: ButtonHTMLAttributes<HTMLButtonElement> & { active?: boolean }) {
  return <button type="button" className={`${styles.q} ${className ?? ''}`} data-active={active || undefined} {...rest} />;
}

export function QuietLink({ className, ...rest }: AnchorHTMLAttributes<HTMLAnchorElement>) {
  return <a className={`${styles.q} ${className ?? ''}`} {...rest} />;
}

export function Dot() {
  return (
    <span className={styles.dot} aria-hidden>
      ·
    </span>
  );
}
