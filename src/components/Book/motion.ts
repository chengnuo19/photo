import { createContext } from 'react';

/**
 * Whether moving photos may move here. Off where pages are pictured into stills (the drawn
 * video, the long image, print): there the clip's still stands in.
 */
export const MotionContext = createContext(true);
