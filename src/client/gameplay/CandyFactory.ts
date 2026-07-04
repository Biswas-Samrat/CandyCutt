/**
 * @file CandyFactory.ts
 * @description Manages candy creation, shape scaling, positioning, and retrieval of candy configuration.
 *              Acts as the coordinator between the Game Manager, the UI, and the drawing layers.
 */

import * as Phaser from 'phaser';
import { getCandyShape } from '../data/CandyShapes';
import type { CandyShapeDef, CandyShapeType } from '../data/CandyShapes';
import { denormalizePoints, denormalize } from '../utils/MathUtils';
import type { Point2D } from '../utils/MathUtils';

export type ScaledCandyGeometry = {
  shapeDef: CandyShapeDef;
  bounds: { x: number; y: number; width: number; height: number };
  boundaryPolygon: Point2D[];
  cutPath: Point2D[];
  startPoint: Point2D;
  endPoint: Point2D;
  endZoneRadius: number;
};

export class CandyFactory {
  private static _instance: CandyFactory | null = null;

  private constructor() {}

  static getInstance(): CandyFactory {
    if (!CandyFactory._instance) {
      CandyFactory._instance = new CandyFactory();
    }
    return CandyFactory._instance;
  }

  /**
   * Retrieves a candy definition and calculates its screen-space pixel geometry based on center position and display size.
   *
   * @param type - The shape type of the candy
   * @param centerX - Screen X coordinate for the center
   * @param centerY - Screen Y coordinate for the center
   * @param size - Display width/height (assumes square bounding box)
   */
  getGeometry(type: CandyShapeType, centerX: number, centerY: number, size: number): ScaledCandyGeometry {
    const shapeDef = getCandyShape(type);
    
    // Bounds of the candy (square bounding box)
    const x = centerX - size / 2;
    const y = centerY - size / 2;
    const bounds = { x, y, width: size, height: size };

    // Denormalize the coordinates from [0, 1] to screen pixels
    const boundaryPolygon = denormalizePoints(shapeDef.boundary, x, y, size, size);
    const cutPath = denormalizePoints(shapeDef.cutPath, x, y, size, size);
    
    const startPoint = denormalize(shapeDef.startPoint, x, y, size, size);
    const endPoint = denormalize(shapeDef.endPoint, x, y, size, size);
    
    // Scale the normalized radius to screen pixels
    const endZoneRadius = shapeDef.endZoneRadius * size;

    return {
      shapeDef,
      bounds,
      boundaryPolygon,
      cutPath,
      startPoint,
      endPoint,
      endZoneRadius
    };
  }

  /**
   * Helper to return all available candy shape definitions.
   */
  getAvailableShapes(): CandyShapeType[] {
    return ['bonbon', 'stardrop', 'heartbit', 'swirlypop', 'ribbontwist', 'diamondgem', 'cloudpuff', 'crescentmoon'];
  }
}
