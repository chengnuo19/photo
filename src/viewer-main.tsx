/**
 * Entry for exported books: a reader only, with the book embedded in the page.
 * Fonts are injected at export time (only the glyph slices the book uses).
 */
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './styles/global.css';
import { ReadingRoom } from './app/ReadingRoom';
import type { BookDoc } from './data/schema';
import { loadBookThemes } from './themes';

const raw = document.getElementById('book-data')?.textContent ?? 'null';
const book = JSON.parse(raw) as BookDoc | null;
const root = createRoot(document.getElementById('root')!);

if (book) {
  document.title = book.meta.title || document.title;
  // every theme is inlined in the single-file reader; this registers the ones the book uses
  void loadBookThemes(book).catch(() => undefined).then(() => root.render(
    <StrictMode>
      <ReadingRoom book={book} unwrap={book.gift?.unwrap !== false} />
    </StrictMode>,
  ));
} else {
  root.render(<p style={{ font: '14px serif', color: '#8d867b', textAlign: 'center', marginTop: '40vh' }}>这是回忆绘本的阅读器模板。</p>);
}
