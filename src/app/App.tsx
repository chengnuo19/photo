import { lazy, Suspense } from 'react';
import { ReaderPage } from './ReaderPage';
import { useRoute } from './router';
import { ShelfPage } from './ShelfPage';
import styles from './App.module.css';

// Readers never need the editor or the theme gallery: those load when first visited.
const EditorPage = lazy(() => import('./EditorPage').then((m) => ({ default: m.EditorPage })));
const RecordPage = lazy(() => import('./RecordPage').then((m) => ({ default: m.RecordPage })));
const ThemeGallery = lazy(() => import('./ThemeGallery').then((m) => ({ default: m.ThemeGallery })));

export function App() {
  const route = useRoute();
  let page;
  switch (route.name) {
    case 'read':
      page = <ReaderPage key={route.id} id={route.id} />;
      break;
    case 'new':
      page = <ThemeGallery />;
      break;
    case 'record':
      page = <RecordPage key={route.id + route.mode} id={route.id} mode={route.mode} />;
      break;
    case 'edit':
      page = <EditorPage key={route.id} id={route.id} />;
      break;
    default:
      page = <ShelfPage />;
  }
  return <Suspense fallback={<main className={styles.room} />}>{page}</Suspense>;
}
