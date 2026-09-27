/**
 * Exported books get exactly the font slices they use injected into the page, so the
 * standalone reader never loads theme fonts itself (see vite.viewer.config.ts).
 */
export function ensureFonts(..._args: [string[], string?]) {
  return Promise.resolve([] as unknown[]);
}
