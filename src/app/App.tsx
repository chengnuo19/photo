import { EditorPage } from './EditorPage';
import { ReaderPage } from './ReaderPage';
import { useRoute } from './router';
import { ShelfPage } from './ShelfPage';
import { ThemeGallery } from './ThemeGallery';

export function App() {
  const route = useRoute();
  switch (route.name) {
    case 'read':
      return <ReaderPage key={route.id} id={route.id} />;
    case 'new':
      return <ThemeGallery />;
    case 'edit':
      return <EditorPage key={route.id} id={route.id} />;
    default:
      return <ShelfPage />;
  }
}
