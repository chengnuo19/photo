import styles from './Toast.module.css';

export interface ToastState {
  text: string;
  /** 0..1 shows a thin progress line under the text. */
  progress?: number;
  tone?: 'info' | 'warn';
}

/** The one-line note that floats at the top while something slow happens (or went wrong). */
export function Toast({ toast, placement = 'top' }: { toast: ToastState | null; placement?: 'top' | 'bottom' }) {
  if (!toast) return null;
  return (
    <div className={styles.toast} data-place={placement} data-tone={toast.tone} role={toast.tone === 'warn' ? 'alert' : 'status'}>
      {toast.text}
      {toast.progress !== undefined && (
        <span className={styles.track} aria-hidden>
          <span className={styles.bar} style={{ transform: `scaleX(${Math.max(0, Math.min(1, toast.progress))})` }} />
        </span>
      )}
    </div>
  );
}
