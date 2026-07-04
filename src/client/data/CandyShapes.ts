/**
 * @file CandyShapes.ts
 * @description Original candy shape definitions for Candy Snip Saga.
 *              All shapes are defined as normalized (0–1) polygon boundaries
 *              and cut path waypoints. CandyShapeRenderer scales them to the
 *              actual canvas size at runtime.
 *
 *              All shapes are 100% original creations — not derived from any
 *              external IP.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** All 8 original candy shape identifiers. */
export type CandyShapeType =
  | 'bonbon'
  | 'stardrop'
  | 'heartbit'
  | 'swirlypop'
  | 'ribbontwist'
  | 'diamondgem'
  | 'cloudpuff'
  | 'crescentmoon';

/** A 2D point in normalized [0, 1] coordinate space. */
export type NormalizedPoint = { readonly x: number; readonly y: number };

/** A colour stop for the candy gradient (position 0–1, hex colour string). */
export type GradientStop = { readonly stop: number; readonly color: string };

/**
 * Defines the full geometry and visual properties of a candy shape.
 * Coordinates are normalized (0 = left/top, 1 = right/bottom) relative to
 * the bounding box of the candy texture.
 */
export type CandyShapeDef = {
  readonly type: CandyShapeType;
  /** Human-readable display name. */
  readonly name: string;
  /** Flavour text shown during gameplay. */
  readonly flavourText: string;
  /**
   * Ordered polygon points defining the valid cutting boundary.
   * The pin must stay inside this polygon throughout the cut.
   */
  readonly boundary: readonly NormalizedPoint[];
  /**
   * Ordered waypoints that define the correct cut path.
   * The player drags the pin roughly along this path to succeed.
   * First point = pin start position. Last point = cut completion target.
   */
  readonly cutPath: readonly NormalizedPoint[];
  /** Where the pin appears when this candy is presented. */
  readonly startPoint: NormalizedPoint;
  /** The target area the pin must reach to register a successful cut. */
  readonly endPoint: NormalizedPoint;
  /** Radius (normalized) of the end-point acceptance zone. */
  readonly endZoneRadius: number;
  /** Primary colour stops for the candy body gradient. */
  readonly bodyGradient: readonly GradientStop[];
  /** Colour of the candy outline stroke. */
  readonly outlineColor: string;
  /** Colour of the specular highlight. */
  readonly highlightColor: string;
  /** Colour of the cut-line preview guide. */
  readonly cutLineColor: string;
  /** Overall colour number used for particle effects (Phaser hex). */
  readonly particleColor: number;
  /** Difficulty rating of this shape (affects which pools it appears in). */
  readonly complexityRating: 'simple' | 'medium' | 'complex';
};

// ---------------------------------------------------------------------------
// Shape: BONBON
// ---------------------------------------------------------------------------
const BONBON: CandyShapeDef = {
  type: 'bonbon',
  name: 'Bonbon',
  flavourText: 'A classic wrapped treat. Straight and true!',
  boundary: [
    { x: 0.18, y: 0.35 }, { x: 0.25, y: 0.20 }, { x: 0.50, y: 0.15 },
    { x: 0.75, y: 0.20 }, { x: 0.82, y: 0.35 }, { x: 0.82, y: 0.65 },
    { x: 0.75, y: 0.80 }, { x: 0.50, y: 0.85 }, { x: 0.25, y: 0.80 },
    { x: 0.18, y: 0.65 },
  ],
  cutPath: [
    { x: 0.18, y: 0.50 }, { x: 0.30, y: 0.50 }, { x: 0.40, y: 0.50 },
    { x: 0.50, y: 0.50 }, { x: 0.60, y: 0.50 }, { x: 0.70, y: 0.50 },
    { x: 0.82, y: 0.50 },
  ],
  startPoint: { x: 0.18, y: 0.50 },
  endPoint: { x: 0.82, y: 0.50 },
  endZoneRadius: 0.07,
  bodyGradient: [
    { stop: 0.0, color: '#FF9FC5' },
    { stop: 0.5, color: '#FF6B9D' },
    { stop: 1.0, color: '#D94F7A' },
  ],
  outlineColor: '#C43B68',
  highlightColor: '#FFAECB',
  cutLineColor: '#FFD700',
  particleColor: 0xff6b9d,
  complexityRating: 'simple',
};

// ---------------------------------------------------------------------------
// Shape: STARDROP
// ---------------------------------------------------------------------------
const STARDROP: CandyShapeDef = {
  type: 'stardrop',
  name: 'StarDrop',
  flavourText: 'A star fell into your hands. Cut straight through!',
  boundary: [
    { x: 0.50, y: 0.08 }, { x: 0.61, y: 0.36 }, { x: 0.88, y: 0.36 },
    { x: 0.68, y: 0.54 }, { x: 0.76, y: 0.82 }, { x: 0.50, y: 0.65 },
    { x: 0.24, y: 0.82 }, { x: 0.32, y: 0.54 }, { x: 0.12, y: 0.36 },
    { x: 0.39, y: 0.36 },
  ],
  cutPath: [
    { x: 0.50, y: 0.08 }, { x: 0.50, y: 0.22 }, { x: 0.50, y: 0.38 },
    { x: 0.50, y: 0.52 }, { x: 0.50, y: 0.65 },
  ],
  startPoint: { x: 0.50, y: 0.08 },
  endPoint: { x: 0.50, y: 0.65 },
  endZoneRadius: 0.07,
  bodyGradient: [
    { stop: 0.0, color: '#FFE878' },
    { stop: 0.5, color: '#FFD700' },
    { stop: 1.0, color: '#E6A200' },
  ],
  outlineColor: '#C48900',
  highlightColor: '#FFF5B7',
  cutLineColor: '#FF6B9D',
  particleColor: 0xffd700,
  complexityRating: 'simple',
};

// ---------------------------------------------------------------------------
// Shape: CLOUDPUFF
// ---------------------------------------------------------------------------
const CLOUDPUFF: CandyShapeDef = {
  type: 'cloudpuff',
  name: 'CloudPuff',
  flavourText: 'Soft as a cloud, sweet as the sky.',
  boundary: [
    { x: 0.10, y: 0.60 }, { x: 0.08, y: 0.45 }, { x: 0.18, y: 0.36 },
    { x: 0.25, y: 0.30 }, { x: 0.28, y: 0.22 }, { x: 0.38, y: 0.18 },
    { x: 0.45, y: 0.22 }, { x: 0.50, y: 0.15 }, { x: 0.58, y: 0.18 },
    { x: 0.62, y: 0.24 }, { x: 0.70, y: 0.20 }, { x: 0.80, y: 0.26 },
    { x: 0.88, y: 0.37 }, { x: 0.90, y: 0.50 }, { x: 0.85, y: 0.62 },
    { x: 0.15, y: 0.62 },
  ],
  cutPath: [
    { x: 0.10, y: 0.52 }, { x: 0.25, y: 0.50 }, { x: 0.40, y: 0.52 },
    { x: 0.55, y: 0.50 }, { x: 0.70, y: 0.52 }, { x: 0.90, y: 0.50 },
  ],
  startPoint: { x: 0.10, y: 0.52 },
  endPoint: { x: 0.90, y: 0.50 },
  endZoneRadius: 0.07,
  bodyGradient: [
    { stop: 0.0, color: '#B8F0FF' },
    { stop: 0.5, color: '#89CFF0' },
    { stop: 1.0, color: '#5AB4E0' },
  ],
  outlineColor: '#3A8CB0',
  highlightColor: '#E0F8FF',
  cutLineColor: '#FF6B9D',
  particleColor: 0x45b7d1,
  complexityRating: 'simple',
};

// ---------------------------------------------------------------------------
// Shape: HEARTBIT
// ---------------------------------------------------------------------------
const HEARTBIT: CandyShapeDef = {
  type: 'heartbit',
  name: 'HeartBit',
  flavourText: 'Straight to the heart! Cut clean down the middle.',
  boundary: [
    { x: 0.50, y: 0.28 }, { x: 0.60, y: 0.17 }, { x: 0.72, y: 0.15 },
    { x: 0.82, y: 0.22 }, { x: 0.86, y: 0.34 }, { x: 0.82, y: 0.46 },
    { x: 0.70, y: 0.58 }, { x: 0.58, y: 0.70 }, { x: 0.50, y: 0.82 },
    { x: 0.42, y: 0.70 }, { x: 0.30, y: 0.58 }, { x: 0.18, y: 0.46 },
    { x: 0.14, y: 0.34 }, { x: 0.18, y: 0.22 }, { x: 0.28, y: 0.15 },
    { x: 0.40, y: 0.17 },
  ],
  cutPath: [
    { x: 0.50, y: 0.28 }, { x: 0.50, y: 0.38 }, { x: 0.50, y: 0.50 },
    { x: 0.50, y: 0.62 }, { x: 0.50, y: 0.75 }, { x: 0.50, y: 0.82 },
  ],
  startPoint: { x: 0.50, y: 0.28 },
  endPoint: { x: 0.50, y: 0.82 },
  endZoneRadius: 0.07,
  bodyGradient: [
    { stop: 0.0, color: '#FF9EC5' },
    { stop: 0.5, color: '#FF6B9D' },
    { stop: 1.0, color: '#D94F7A' },
  ],
  outlineColor: '#B03060',
  highlightColor: '#FFCCE0',
  cutLineColor: '#FFD700',
  particleColor: 0xff6b9d,
  complexityRating: 'medium',
};

// ---------------------------------------------------------------------------
// Shape: DIAMONDGEM
// ---------------------------------------------------------------------------
const DIAMONDGEM: CandyShapeDef = {
  type: 'diamondgem',
  name: 'DiamondGem',
  flavourText: 'A precious treat — precision is everything!',
  boundary: [
    { x: 0.30, y: 0.20 }, { x: 0.50, y: 0.12 }, { x: 0.70, y: 0.20 },
    { x: 0.85, y: 0.40 }, { x: 0.85, y: 0.50 }, { x: 0.50, y: 0.88 },
    { x: 0.15, y: 0.50 }, { x: 0.15, y: 0.40 },
  ],
  cutPath: [
    { x: 0.50, y: 0.12 }, { x: 0.50, y: 0.25 }, { x: 0.50, y: 0.40 },
    { x: 0.50, y: 0.55 }, { x: 0.50, y: 0.70 }, { x: 0.50, y: 0.88 },
  ],
  startPoint: { x: 0.50, y: 0.12 },
  endPoint: { x: 0.50, y: 0.88 },
  endZoneRadius: 0.06,
  bodyGradient: [
    { stop: 0.0, color: '#D0A8FF' },
    { stop: 0.4, color: '#A855F7' },
    { stop: 1.0, color: '#7C3AED' },
  ],
  outlineColor: '#5B21B6',
  highlightColor: '#EDD5FF',
  cutLineColor: '#FFD700',
  particleColor: 0xa855f7,
  complexityRating: 'medium',
};

// ---------------------------------------------------------------------------
// Shape: CRESCENTMOON
// ---------------------------------------------------------------------------
const CRESCENTMOON: CandyShapeDef = {
  type: 'crescentmoon',
  name: 'CrescentMoon',
  flavourText: 'Follow the gentle arc of the moon.',
  boundary: [
    { x: 0.50, y: 0.10 }, { x: 0.68, y: 0.14 }, { x: 0.82, y: 0.28 },
    { x: 0.88, y: 0.46 }, { x: 0.84, y: 0.64 }, { x: 0.70, y: 0.76 },
    { x: 0.54, y: 0.80 }, { x: 0.58, y: 0.68 }, { x: 0.66, y: 0.56 },
    { x: 0.68, y: 0.44 }, { x: 0.65, y: 0.34 }, { x: 0.57, y: 0.23 },
    { x: 0.50, y: 0.18 },
  ],
  cutPath: [
    { x: 0.50, y: 0.10 }, { x: 0.52, y: 0.22 }, { x: 0.55, y: 0.34 },
    { x: 0.56, y: 0.46 }, { x: 0.55, y: 0.58 }, { x: 0.52, y: 0.70 },
    { x: 0.50, y: 0.80 },
  ],
  startPoint: { x: 0.50, y: 0.10 },
  endPoint: { x: 0.50, y: 0.80 },
  endZoneRadius: 0.07,
  bodyGradient: [
    { stop: 0.0, color: '#FFE8A0' },
    { stop: 0.5, color: '#FFD700' },
    { stop: 1.0, color: '#E6A200' },
  ],
  outlineColor: '#B8860B',
  highlightColor: '#FFF5CC',
  cutLineColor: '#A855F7',
  particleColor: 0xffd700,
  complexityRating: 'medium',
};

// ---------------------------------------------------------------------------
// Shape: SWIRLYPOP
// ---------------------------------------------------------------------------
const SWIRLYPOP: CandyShapeDef = {
  type: 'swirlypop',
  name: 'SwirlyPop',
  flavourText: "Follow the spiral — don't get dizzy!",
  boundary: [
    { x: 0.50, y: 0.10 }, { x: 0.66, y: 0.13 }, { x: 0.80, y: 0.22 },
    { x: 0.88, y: 0.36 }, { x: 0.90, y: 0.50 }, { x: 0.88, y: 0.64 },
    { x: 0.80, y: 0.76 }, { x: 0.66, y: 0.85 }, { x: 0.50, y: 0.88 },
    { x: 0.34, y: 0.85 }, { x: 0.20, y: 0.76 }, { x: 0.12, y: 0.64 },
    { x: 0.10, y: 0.50 }, { x: 0.12, y: 0.36 }, { x: 0.20, y: 0.22 },
    { x: 0.34, y: 0.13 },
  ],
  cutPath: [
    { x: 0.50, y: 0.10 }, { x: 0.70, y: 0.20 }, { x: 0.82, y: 0.40 },
    { x: 0.78, y: 0.60 }, { x: 0.62, y: 0.74 }, { x: 0.44, y: 0.72 },
    { x: 0.34, y: 0.60 }, { x: 0.36, y: 0.46 }, { x: 0.46, y: 0.38 },
    { x: 0.56, y: 0.44 }, { x: 0.54, y: 0.54 }, { x: 0.50, y: 0.50 },
  ],
  startPoint: { x: 0.50, y: 0.10 },
  endPoint: { x: 0.50, y: 0.50 },
  endZoneRadius: 0.08,
  bodyGradient: [
    { stop: 0.0, color: '#FF8C42' },
    { stop: 0.35, color: '#FF6B9D' },
    { stop: 0.65, color: '#A855F7' },
    { stop: 1.0, color: '#45B7D1' },
  ],
  outlineColor: '#C43B68',
  highlightColor: '#FFD0A8',
  cutLineColor: '#FFFFFF',
  particleColor: 0xff8c42,
  complexityRating: 'complex',
};

// ---------------------------------------------------------------------------
// Shape: RIBBONTWIST
// ---------------------------------------------------------------------------
const RIBBONTWIST: CandyShapeDef = {
  type: 'ribbontwist',
  name: 'RibbonTwist',
  flavourText: 'Twist and shout — but keep that pin steady!',
  boundary: [
    { x: 0.50, y: 0.40 }, { x: 0.62, y: 0.30 }, { x: 0.76, y: 0.23 },
    { x: 0.87, y: 0.27 }, { x: 0.90, y: 0.38 }, { x: 0.87, y: 0.49 },
    { x: 0.75, y: 0.57 }, { x: 0.62, y: 0.57 }, { x: 0.50, y: 0.60 },
    { x: 0.38, y: 0.57 }, { x: 0.25, y: 0.57 }, { x: 0.13, y: 0.49 },
    { x: 0.10, y: 0.38 }, { x: 0.13, y: 0.27 }, { x: 0.24, y: 0.23 },
    { x: 0.38, y: 0.30 },
  ],
  cutPath: [
    { x: 0.13, y: 0.40 }, { x: 0.26, y: 0.34 }, { x: 0.38, y: 0.38 },
    { x: 0.50, y: 0.50 }, { x: 0.62, y: 0.44 }, { x: 0.74, y: 0.40 },
    { x: 0.87, y: 0.40 },
  ],
  startPoint: { x: 0.13, y: 0.40 },
  endPoint: { x: 0.87, y: 0.40 },
  endZoneRadius: 0.07,
  bodyGradient: [
    { stop: 0.0, color: '#9AE6B4' },
    { stop: 0.5, color: '#4ECDC4' },
    { stop: 1.0, color: '#2DB3A8' },
  ],
  outlineColor: '#1A8C82',
  highlightColor: '#C8F5EE',
  cutLineColor: '#FFD700',
  particleColor: 0x4ecdc4,
  complexityRating: 'complex',
};

// ---------------------------------------------------------------------------
// Shape Registry
// ---------------------------------------------------------------------------

export const CANDY_SHAPES: Readonly<Record<CandyShapeType, CandyShapeDef>> = {
  bonbon: BONBON,
  stardrop: STARDROP,
  heartbit: HEARTBIT,
  swirlypop: SWIRLYPOP,
  ribbontwist: RIBBONTWIST,
  diamondgem: DIAMONDGEM,
  cloudpuff: CLOUDPUFF,
  crescentmoon: CRESCENTMOON,
} as const;

/** Returns the shape definition for the given type. */
export const getCandyShape = (type: CandyShapeType): CandyShapeDef =>
  CANDY_SHAPES[type];

/** All shape types as an array (useful for iteration). */
export const ALL_SHAPE_TYPES: readonly CandyShapeType[] = Object.keys(
  CANDY_SHAPES
) as CandyShapeType[];
