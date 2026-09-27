import { createContext, useContext } from 'react';
import type { Theme } from './types';

/** The theme currently rendering, for kit pages and layers that need its ornaments. */
export const ThemeContext = createContext<Theme | null>(null);

export function useTheme(): Theme {
  const t = useContext(ThemeContext);
  if (!t) throw new Error('useTheme outside ThemeContext');
  return t;
}

/** Tiny deterministic PRNG so decorations land in the same place on every visit. */
export function seeded(seed: number) {
  let s = (seed * 9301 + 49297) % 233280;
  return () => (s = (s * 9301 + 49297) % 233280) / 233280;
}

export function hashId(id = '') {
  let h = 7;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) % 100003;
  return h;
}
