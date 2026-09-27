import type { ComponentType, CSSProperties } from 'react';
import type { PageKind, PageSpec } from '../data/buildPages';
import type { BookDoc, BookImage, ThemeId } from '../data/schema';
import type { Recipe } from '../sound/engine';

export interface PageProps {
  book: BookDoc;
  page: PageSpec;
}

/** A colour variant of a theme. `vars` override the theme's CSS custom properties. */
export interface Palette {
  id: string;
  name: string;
  /** Three colours for the little swatch dots in menus. */
  swatch: [string, string, string];
  vars: Record<string, string>;
}

/** A decoration the reader can switch on per spread. `Component` draws on each story page. */
export interface DecorOption {
  id: string;
  label: string;
  Component?: ComponentType<DecorProps>;
}

export interface DecorProps {
  page: PageSpec;
  /** Stable per-spread seed, so decorations never jump between visits. */
  seed: number;
}

/** How photos are presented by the shared layout kit. */
export type PhotoStyle = 'bleed' | 'print' | 'mount' | 'stamp';

export interface FrameProps {
  image?: BookImage;
  onChange?: (img: BookImage) => void;
  /** Spread the photo belongs to (for date imprints etc.). */
  page: PageSpec;
  book: BookDoc;
  className?: string;
  style?: CSSProperties;
  /** Show the theme's date imprint on this photo. */
  imprint?: boolean;
  emptyLabel?: string;
}

export interface CoverVariant {
  id: string;
  name: string;
  Component: ComponentType<PageProps>;
}

/**
 * A theme is a complete, curated preset: paper, type, palettes, photo treatment, ornaments,
 * decorations, stickers and covers. The shared kit (`themes/kit`) renders every page kind the
 * theme doesn't hand-make, reading the look from the theme's CSS variables and ornaments.
 * Per-spread overrides only choose options *within* a theme, so combinations stay tasteful.
 */
export interface ThemeDef {
  id: ThemeId;
  name: string;
  group: 'classic' | 'screen';
  /** One line for the sample-book gallery. */
  blurb: string;
  /** Class applied to the room and stage; sets base tokens and fonts. */
  className: string;
  palettes: Palette[];
  /** Font families this theme uses — loaded before first paint and packed on export. */
  fonts: string[];
  photo: PhotoStyle;
  /** Custom photo frame (replaces the kit frame for `photo`). */
  Frame?: ComponentType<FrameProps>;
  /** Date imprint drawn on photos (e.g. film's orange digits, VHS "REC"). */
  Imprint?: ComponentType<{ page: PageSpec; book: BookDoc }>;
  ornaments?: {
    /** Small mark above the title on the title page. */
    titleMark?: ComponentType;
    /** Divider used by writing pages. */
    divider?: ComponentType;
    /** Mark on the finis page. */
    finis?: ComponentType;
  };
  decor: DecorOption[];
  /** Decoration applied when a spread hasn't chosen one ('none' = none). Defaults to the first. */
  defaultDecor?: string;
  /** Theme stickers, addressed as `theme:<name>`. */
  stickers: Record<string, { label: string; Component: ComponentType<{ className?: string }> }>;
  covers: CoverVariant[];
  /** Hand-made pages; everything else comes from the kit. */
  pages?: Partial<Record<PageKind, ComponentType<PageProps>>>;
  scene?: ComponentType<SceneProps>;
  sound?: SoundKit;
  photoFilter?: PhotoFilter;
  /** The gift wrapping shown before the cover (exported / shared books). */
  wrap?: WrapSpec;
  /** Built-in sample book for the gallery. */
  sample: () => BookDoc;
}

/** The room around the book: backdrop, props on the table, ambient motion, easter eggs. */
export interface SceneProps {
  /** Reading shows everything; the editor only keeps the backdrop (its own chrome needs the edges). */
  mode: 'read' | 'edit';
  /** Sound effects are on (easter eggs may make noise). */
  sound: boolean;
}

/** The theme's voice. Anything missing falls back to the paper rustle. */
export interface SoundKit {
  page?: Recipe;
  board?: Recipe;
  /** Opening the gift wrapping. */
  unwrap?: Recipe;
  /** Easter eggs in the scene, by id. */
  egg?: Record<string, Recipe>;
}

/** Default photo treatment. `css` is a CSS filter; `overlay` adds texture on top of the photo. */
export interface PhotoFilter {
  label: string;
  css: string;
  overlay?: 'grain' | 'vhs' | 'paper' | 'halftone' | 'light';
}

/** How a theme wraps the book as a gift (see components/Unwrap). */
export type WrapSpec =
  | { kind: 'ribbon'; paper: string; pattern?: 'stars' | 'dots' | 'wash' | 'none'; ribbon: string; ink: string; thin?: boolean; stamps?: boolean }
  | { kind: 'envelope'; paper: string; flap: string; seal: string; mark: string; ink: string }
  | { kind: 'ticket'; paper: string; ink: string; accent: string }
  | { kind: 'ball' }
  | { kind: 'tape' }
  | { kind: 'canister' };

/** A theme with every page kind resolved (theme page, else kit page). */
export interface Theme extends ThemeDef {
  pages: Record<PageKind, ComponentType<PageProps>>;
}
