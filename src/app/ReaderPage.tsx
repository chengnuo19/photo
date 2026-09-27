import { QuietLink } from '../components/ui/QuietButton';
import { useLoadedBook } from '../hooks/useLoadedBook';
import { ReadingRoom } from './ReadingRoom';
import { href } from './router';
import styles from './App.module.css';

/** Reading room for a book in the app (with links back to the shelf and editor). */
export function ReaderPage({ id }: { id: string }) {
  const { resolved, status } = useLoadedBook(id);
  if (status === 'missing') return <Missing />;
  if (!resolved) return <main className={styles.room} />;
  return (
    <ReadingRoom
      book={resolved}
      shelfHref={href.shelf()}
      editHref={href.edit(id)}
      unwrap={resolved.gift?.unwrap !== false && !wasUnwrapped(id)}
      onUnwrapped={() => markUnwrapped(id)}
    />
  );
}

/** In the app the wrapping shows once per visit; exported books always start wrapped. */
const KEY = 'mb-unwrapped:';
function wasUnwrapped(id: string) {
  try {
    return sessionStorage.getItem(KEY + id) === '1';
  } catch {
    return false;
  }
}
function markUnwrapped(id: string) {
  try {
    sessionStorage.setItem(KEY + id, '1');
  } catch {
    /* private mode: it just shows again next time */
  }
}

function Missing() {
  return (
    <main className={`${styles.room} ${styles.center}`} data-ready>
      <p className={styles.note}>找不到这本书，它可能已经被删除了。</p>
      <QuietLink href={href.shelf()}>回到书架</QuietLink>
    </main>
  );
}
