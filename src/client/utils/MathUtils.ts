/**
 * @file MathUtils.ts
 * @description Pure geometry and math helper functions used throughout
 *              gameplay (boundary testing, path sampling, interpolation, etc.)
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type Point2D = { readonly x: number; readonly y: number };
export type Segment = { readonly a: Point2D; readonly b: Point2D };
export type AABB = { readonly minX: number; readonly minY: number; readonly maxX: number; readonly maxY: number };

// ---------------------------------------------------------------------------
// Point helpers
// ---------------------------------------------------------------------------

/** Euclidean distance between two points. */
export const distance = (a: Point2D, b: Point2D): number =>
  Math.sqrt((b.x - a.x) ** 2 + (b.y - a.y) ** 2);

/** Linear interpolation between two numbers. */
export const lerp = (a: number, b: number, t: number): number =>
  a + (b - a) * t;

/** Linearly interpolates between two points. */
export const lerpPoint = (a: Point2D, b: Point2D, t: number): Point2D => ({
  x: lerp(a.x, b.x, t),
  y: lerp(a.y, b.y, t),
});

/** Clamps a number to [min, max]. */
export const clamp = (value: number, min: number, max: number): number =>
  Math.max(min, Math.min(max, value));

/** Normalizes a number from [inMin, inMax] to [outMin, outMax]. */
export const remap = (
  value: number,
  inMin: number,
  inMax: number,
  outMin: number,
  outMax: number
): number => outMin + ((value - inMin) / (inMax - inMin)) * (outMax - outMin);

/** Returns the angle in radians from point a to point b. */
export const angleTo = (a: Point2D, b: Point2D): number =>
  Math.atan2(b.y - a.y, b.x - a.x);

/** Converts degrees to radians. */
export const degToRad = (degrees: number): number => (degrees * Math.PI) / 180;

/** Converts radians to degrees. */
export const radToDeg = (radians: number): number => (radians * 180) / Math.PI;

/** Returns a point on a unit circle at angle theta (radians). */
export const circlePoint = (cx: number, cy: number, r: number, theta: number): Point2D => ({
  x: cx + r * Math.cos(theta),
  y: cy + r * Math.sin(theta),
});

/** Adds two points. */
export const addPoints = (a: Point2D, b: Point2D): Point2D => ({
  x: a.x + b.x,
  y: a.y + b.y,
});

/** Subtracts point b from point a. */
export const subPoints = (a: Point2D, b: Point2D): Point2D => ({
  x: a.x - b.x,
  y: a.y - b.y,
});

/** Scales a point by a scalar. */
export const scalePoint = (p: Point2D, s: number): Point2D => ({
  x: p.x * s,
  y: p.y * s,
});

/** Returns the magnitude (length) of a vector. */
export const magnitude = (p: Point2D): number =>
  Math.sqrt(p.x * p.x + p.y * p.y);

/** Returns the normalized (unit) vector of a point. */
export const normalize = (p: Point2D): Point2D => {
  const mag = magnitude(p);
  if (mag === 0) return { x: 0, y: 0 };
  return { x: p.x / mag, y: p.y / mag };
};

/** Dot product of two vectors. */
export const dot = (a: Point2D, b: Point2D): number =>
  a.x * b.x + a.y * b.y;

/** Cross product (z component) of two 2D vectors. */
export const cross2D = (a: Point2D, b: Point2D): number =>
  a.x * b.y - a.y * b.x;

// ---------------------------------------------------------------------------
// Polygon / boundary testing
// ---------------------------------------------------------------------------

/**
 * Tests whether point p is inside the polygon defined by the vertices array.
 * Uses the ray casting algorithm.
 *
 * @param p - Point to test.
 * @param polygon - Array of polygon vertices (at least 3 points).
 * @returns true if the point is inside the polygon.
 */
export const pointInPolygon = (p: Point2D, polygon: readonly Point2D[]): boolean => {
  let inside = false;
  const n = polygon.length;
  let j = n - 1;

  for (let i = 0; i < n; i++) {
    const xi = polygon[i].x;
    const yi = polygon[i].y;
    const xj = polygon[j].x;
    const yj = polygon[j].y;

    const intersect =
      yi > p.y !== yj > p.y &&
      p.x < ((xj - xi) * (p.y - yi)) / (yj - yi) + xi;

    if (intersect) inside = !inside;
    j = i;
  }

  return inside;
};

/**
 * Tests whether point p is within radius of the boundary of the polygon
 * (i.e., within tolerance pixels of any edge).
 * Used to provide the forgiving boundary zone.
 */
export const pointNearPolygonEdge = (
  p: Point2D,
  polygon: readonly Point2D[],
  tolerance: number
): boolean => {
  const n = polygon.length;
  for (let i = 0; i < n; i++) {
    const a = polygon[i];
    const b = polygon[(i + 1) % n];
    if (distanceToSegment(p, a, b) <= tolerance) return true;
  }
  return false;
};

/**
 * Returns the minimum distance from point p to the line segment [a, b].
 */
export const distanceToSegment = (p: Point2D, a: Point2D, b: Point2D): number => {
  const ab = subPoints(b, a);
  const ap = subPoints(p, a);
  const abMagSq = ab.x * ab.x + ab.y * ab.y;

  if (abMagSq === 0) return distance(p, a);

  const t = clamp(dot(ap, ab) / abMagSq, 0, 1);
  const closest: Point2D = { x: a.x + t * ab.x, y: a.y + t * ab.y };
  return distance(p, closest);
};

/**
 * Returns true if point p is strictly inside the polygon OR within the
 * tolerance zone along any edge (combined check for gameplay boundary logic).
 */
export const isWithinBoundary = (
  p: Point2D,
  polygon: readonly Point2D[],
  tolerance: number
): boolean =>
  pointInPolygon(p, polygon) || pointNearPolygonEdge(p, polygon, tolerance);

/**
 * Computes the axis-aligned bounding box of a polygon.
 */
export const polygonAABB = (polygon: readonly Point2D[]): AABB => {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const p of polygon) {
    if (p.x < minX) minX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.x > maxX) maxX = p.x;
    if (p.y > maxY) maxY = p.y;
  }
  return { minX, minY, maxX, maxY };
};

// ---------------------------------------------------------------------------
// Path sampling and analysis
// ---------------------------------------------------------------------------

/**
 * Resamples a polyline to evenly-spaced points at the given interval distance.
 * Useful for normalizing drag paths before validation.
 */
export const resamplePath = (path: readonly Point2D[], interval: number): Point2D[] => {
  if (path.length < 2) return [...path];

  const result: Point2D[] = [path[0]];
  let accumulated = 0;

  for (let i = 1; i < path.length; i++) {
    const segLen = distance(path[i - 1], path[i]);
    accumulated += segLen;

    while (accumulated >= interval) {
      const overshoot = accumulated - interval;
      const t = 1 - overshoot / segLen;
      result.push(lerpPoint(path[i - 1], path[i], t));
      accumulated = overshoot;
    }
  }

  result.push(path[path.length - 1]);
  return result;
};

/**
 * Computes the total arc-length of a polyline.
 */
export const pathLength = (path: readonly Point2D[]): number => {
  let total = 0;
  for (let i = 1; i < path.length; i++) {
    total += distance(path[i - 1], path[i]);
  }
  return total;
};

/**
 * Computes the fraction of referencePoints that have at least one point
 * from testPath within matchRadius.  Returns 0–1 coverage ratio.
 */
export const pathCoverage = (
  testPath: readonly Point2D[],
  referencePoints: readonly Point2D[],
  matchRadius: number
): number => {
  if (referencePoints.length === 0) return 1;
  let matched = 0;
  for (const ref of referencePoints) {
    for (const tp of testPath) {
      if (distance(ref, tp) <= matchRadius) {
        matched++;
        break;
      }
    }
  }
  return matched / referencePoints.length;
};

// ---------------------------------------------------------------------------
// Scaling helpers (normalized coords → pixel coords)
// ---------------------------------------------------------------------------

/**
 * Scales a normalized point [0,1] to pixel coordinates given a bounding rect.
 */
export const denormalize = (
  p: Point2D,
  originX: number,
  originY: number,
  width: number,
  height: number
): Point2D => ({
  x: originX + p.x * width,
  y: originY + p.y * height,
});

/**
 * Converts a pixel position back to normalized [0,1] coords within a bounding rect.
 */
export const normalize2D = (
  p: Point2D,
  originX: number,
  originY: number,
  width: number,
  height: number
): Point2D => ({
  x: (p.x - originX) / width,
  y: (p.y - originY) / height,
});

/**
 * Scales an array of normalized points to pixel coordinates.
 */
export const denormalizePoints = (
  points: readonly Point2D[],
  originX: number,
  originY: number,
  width: number,
  height: number
): Point2D[] =>
  points.map((p) => denormalize(p, originX, originY, width, height));

// ---------------------------------------------------------------------------
// Random helpers
// ---------------------------------------------------------------------------

/** Returns a random integer between min (inclusive) and max (inclusive). */
export const randomInt = (min: number, max: number): number =>
  Math.floor(Math.random() * (max - min + 1)) + min;

/** Returns a random float between min (inclusive) and max (exclusive). */
export const randomFloat = (min: number, max: number): number =>
  Math.random() * (max - min) + min;

/** Returns a random element from an array. */
export const randomElement = <T>(arr: readonly T[]): T =>
  arr[Math.floor(Math.random() * arr.length)];

/** Seeded pseudo-random number generator (LCG). Returns 0–1. */
export const seededRandom = (seed: number): () => number => {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0xffffffff;
  };
};

// ---------------------------------------------------------------------------
// Easing functions (for manual tweening outside Phaser)
// ---------------------------------------------------------------------------

export const easeOutCubic = (t: number): number => 1 - (1 - t) ** 3;
export const easeInCubic = (t: number): number => t ** 3;
export const easeInOutQuart = (t: number): number =>
  t < 0.5 ? 8 * t ** 4 : 1 - (-2 * t + 2) ** 4 / 2;
export const easeOutBack = (t: number): number => {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * (t - 1) ** 3 + c1 * (t - 1) ** 2;
};
export const easeOutBounce = (t: number): number => {
  const n1 = 7.5625;
  const d1 = 2.75;
  if (t < 1 / d1) return n1 * t * t;
  if (t < 2 / d1) { t -= 1.5 / d1; return n1 * t * t + 0.75; }
  if (t < 2.5 / d1) { t -= 2.25 / d1; return n1 * t * t + 0.9375; }
  t -= 2.625 / d1;
  return n1 * t * t + 0.984375;
};
