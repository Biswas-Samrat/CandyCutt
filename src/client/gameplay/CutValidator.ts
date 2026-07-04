/**
 * @file CutValidator.ts
 * @description Validates whether a drag path constitutes a successful candy cut.
 *              Checks boundary compliance, path coverage, and end-zone arrival.
 */

import type { Point2D } from '../utils/MathUtils';
import {
  isWithinBoundary,
  pathCoverage,
  distance,
  resamplePath,
  denormalize,
  normalize2D,
} from '../utils/MathUtils';
import type { CandyShapeDef, NormalizedPoint } from '../data/CandyShapes';
import { GAMEPLAY_CONST } from '../data/Constants';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ValidationResult = {
  /** True if the cut was fully successful. */
  success: boolean;
  /** Fraction 0–1 of path points that stayed within the boundary. */
  boundaryCompliance: number;
  /** Fraction 0–1 of reference path covered by the player's path. */
  pathCoverage: number;
  /** True if the player's path ended near the end zone. */
  reachedEndZone: boolean;
  /** Combined accuracy score 0–1 (used for scoring). */
  accuracy: number;
  /** The first out-of-bounds point (if any) — for failure FX positioning. */
  failPoint: Point2D | null;
};

type CandyBounds = {
  x: number;
  y: number;
  width: number;
  height: number;
};

// ---------------------------------------------------------------------------
// CutValidator
// ---------------------------------------------------------------------------

export class CutValidator {
  private readonly shapeDef: CandyShapeDef;
  private readonly bounds: CandyBounds;
  private readonly tolerancePx: number;
  private readonly completionThreshold: number;

  /**
   * @param shapeDef - The candy shape being cut.
   * @param bounds - Pixel bounding box of the rendered candy on screen.
   * @param toleranceMultiplier - Difficulty-based tolerance multiplier.
   * @param completionThreshold - Fraction of path that must be covered.
   */
  constructor(
    shapeDef: CandyShapeDef,
    bounds: CandyBounds,
    toleranceMultiplier: number,
    completionThreshold: number
  ) {
    this.shapeDef = shapeDef;
    this.bounds = bounds;
    this.tolerancePx = GAMEPLAY_CONST.BOUNDARY_TOLERANCE * toleranceMultiplier;
    this.completionThreshold = completionThreshold;
  }

  // ── Live check (called during dragging) ──────────────────────────────────

  /**
   * Tests whether a single pointer position is within the candy boundary.
   * Called every pointer-move event to detect immediate boundary violations.
   *
   * @param screenX - Pointer X in screen pixels.
   * @param screenY - Pointer Y in screen pixels.
   * @returns true if still within bounds (or within tolerance).
   */
  isPointValid(screenX: number, screenY: number): boolean {
    const normalized = this.toNormalized({ x: screenX, y: screenY });
    const boundary = this.shapeDef.boundary as Point2D[];
    return isWithinBoundary(normalized, boundary, this.tolerancePx / this.bounds.width);
  }

  // ── Final validation (called when drag ends) ──────────────────────────────

  /**
   * Fully validates a completed drag path.
   * @param path - Array of screen pixel positions recorded during the drag.
   */
  validate(path: readonly Point2D[]): ValidationResult {
    if (path.length < 3) {
      return this.failResult('Path too short', null);
    }

    const normalizedPath = path.map((p) => this.toNormalized(p));
    const resampled = resamplePath(normalizedPath, 0.01); // ~1% of shape width

    // 1. Boundary compliance
    const boundary = this.shapeDef.boundary as Point2D[];
    const tolerance = this.tolerancePx / this.bounds.width;
    let inBound = 0;
    let firstFailPoint: Point2D | null = null;

    for (const pt of resampled) {
      if (isWithinBoundary(pt, boundary, tolerance)) {
        inBound++;
      } else if (!firstFailPoint) {
        firstFailPoint = this.toScreen(pt);
      }
    }

    const boundaryCompliance = inBound / resampled.length;

    // 2. Path coverage — how well the player followed the reference cut path
    const refPath = this.shapeDef.cutPath as Point2D[];
    const coverage = pathCoverage(normalizedPath, refPath, 0.12);

    // 3. End zone check
    const lastNorm = normalizedPath[normalizedPath.length - 1];
    const endNorm = this.shapeDef.endPoint;
    const endDist = distance(lastNorm, endNorm as Point2D);
    const reachedEndZone = endDist <= this.shapeDef.endZoneRadius;

    // 4. Combined accuracy
    const accuracy = (boundaryCompliance * 0.5) + (coverage * 0.3) + (reachedEndZone ? 0.2 : 0);

    // 5. Success conditions
    const success =
      boundaryCompliance >= 0.85 &&
      coverage >= this.completionThreshold &&
      reachedEndZone;

    return {
      success,
      boundaryCompliance,
      pathCoverage: coverage,
      reachedEndZone,
      accuracy,
      failPoint: firstFailPoint,
    };
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  /** Converts a screen pixel point to normalized candy-local coordinates. */
  private toNormalized(p: Point2D): Point2D {
    return normalize2D(p, this.bounds.x, this.bounds.y, this.bounds.width, this.bounds.height);
  }

  /** Converts a normalized candy-local point back to screen pixels. */
  private toScreen(p: NormalizedPoint): Point2D {
    return denormalize(p, this.bounds.x, this.bounds.y, this.bounds.width, this.bounds.height);
  }

  private failResult(
    _reason: string,
    failPoint: Point2D | null
  ): ValidationResult {
    return {
      success: false,
      boundaryCompliance: 0,
      pathCoverage: 0,
      reachedEndZone: false,
      accuracy: 0,
      failPoint,
    };
  }

  // ── Static factory ────────────────────────────────────────────────────────

  /**
   * Convenience factory — creates a validator with pixel bounds from a
   * Phaser game object's bounding box.
   */
  static fromGameObject(
    shapeDef: CandyShapeDef,
    gameObject: Phaser.GameObjects.Image,
    toleranceMultiplier: number,
    completionThreshold: number
  ): CutValidator {
    const bounds = gameObject.getBounds();
    return new CutValidator(
      shapeDef,
      { x: bounds.left, y: bounds.top, width: bounds.width, height: bounds.height },
      toleranceMultiplier,
      completionThreshold
    );
  }
}
