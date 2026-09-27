import { useCallback, useEffect } from 'react';
import { armAudio, paper, play } from '../sound/engine';
import type { Theme } from '../themes/types';

/**
 * Page and board sounds in the theme's own voice (paper rustle by default).
 * Synthesised on the fly — no audio assets.
 */
export function useFlipSound(theme: Theme, enabled: boolean) {
  useEffect(() => {
    if (enabled) armAudio();
  }, [enabled]);

  return useCallback(
    (kind: 'page' | 'board' = 'page') => {
      if (!enabled) return;
      play(theme.sound?.[kind] ?? paper(kind));
    },
    [enabled, theme],
  );
}
