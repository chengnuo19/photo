import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import '@fontsource/noto-serif-sc/400.css';
import '@fontsource/noto-serif-sc/600.css';
import '@fontsource/cormorant-garamond/400.css';
import '@fontsource/cormorant-garamond/400-italic.css';
import 'lxgw-wenkai-webfont/lxgwwenkai-regular.css';
import './styles/global.css';

import { App } from './app/App';
import { preloadThemesWhenIdle } from './themes';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

preloadThemesWhenIdle();
