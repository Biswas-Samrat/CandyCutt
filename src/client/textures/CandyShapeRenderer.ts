/**
 * @file CandyShapeRenderer.ts
 * @description Procedural rendering engine that draws candy shapes with gradients, specular highlights,
 *              outlines, and guide lines directly using Phaser Graphics or HTML5 Canvas.
 */

import * as Phaser from 'phaser';
import type { ScaledCandyGeometry } from '../gameplay/CandyFactory';
import { hexToPhaser } from '../utils/ColorUtils';

export class CandyShapeRenderer {
  /**
   * Draws a complete candy shape onto a Graphics object.
   */
  static drawCandy(
    graphics: Phaser.GameObjects.Graphics,
    geometry: ScaledCandyGeometry,
    drawGuide = true
  ): void {
    const { shapeDef, boundaryPolygon, cutPath } = geometry;

    graphics.clear();

    const bodyStops = shapeDef.bodyGradient;
    
    // Draw outer candy drop shadow
    graphics.fillStyle(0x000000, 0.25);
    graphics.beginPath();
    for (let i = 0; i < boundaryPolygon.length; i++) {
      const p = boundaryPolygon[i];
      if (i === 0) graphics.moveTo(p.x + 4, p.y + 6);
      else graphics.lineTo(p.x + 4, p.y + 6);
    }
    graphics.closePath();
    graphics.fillPath();

    // Draw main candy fill color/gradient
    // Note: Since Phaser graphics doesn't support complex gradients natively out of the box,
    // we use a dual-tint styling or draw multiple filled inner hulls, or fill solid with highlights.
    // For premium aesthetics, we tint the primary body color.
    const primaryColor = hexToPhaser(bodyStops[1]?.color ?? '#FF6B9D');
    graphics.fillStyle(primaryColor, 1.0);
    
    graphics.beginPath();
    for (let i = 0; i < boundaryPolygon.length; i++) {
      const p = boundaryPolygon[i];
      if (i === 0) graphics.moveTo(p.x, p.y);
      else graphics.lineTo(p.x, p.y);
    }
    graphics.closePath();
    graphics.fillPath();

    // Specular Highlight (3D gloss overlay on the upper left area of the shape)
    const highlightColor = hexToPhaser(shapeDef.highlightColor);
    graphics.fillStyle(highlightColor, 0.45);
    graphics.beginPath();
    for (let i = 0; i < boundaryPolygon.length; i++) {
      const p = boundaryPolygon[i];
      // Draw a scaled-down offset version of the top half of the shape
      if (p.y < geometry.bounds.y + geometry.bounds.height * 0.5) {
        const offsetPtX = p.x + (geometry.bounds.x + geometry.bounds.width / 2 - p.x) * 0.25;
        const offsetPtY = p.y + (geometry.bounds.y + geometry.bounds.height / 2 - p.y) * 0.25;
        if (i === 0) graphics.moveTo(offsetPtX, offsetPtY);
        else graphics.lineTo(offsetPtX, offsetPtY);
      }
    }
    graphics.closePath();
    graphics.fillPath();

    // Outline stroke border
    const strokeColor = hexToPhaser(shapeDef.outlineColor);
    graphics.lineStyle(4.5, strokeColor, 1.0);
    graphics.beginPath();
    for (let i = 0; i < boundaryPolygon.length; i++) {
      const p = boundaryPolygon[i];
      if (i === 0) graphics.moveTo(p.x, p.y);
      else graphics.lineTo(p.x, p.y);
    }
    graphics.closePath();
    graphics.strokePath();

    // Draw cutting line guides (Dotted/dashed indicator guide line)
    if (drawGuide && cutPath.length > 1) {
      const guideColor = hexToPhaser(shapeDef.cutLineColor);
      graphics.lineStyle(3, guideColor, 0.85);
      
      // Draw simple dashed/dotted track line
      for (let i = 0; i < cutPath.length - 1; i++) {
        const p1 = cutPath[i];
        const p2 = cutPath[i + 1];
        
        // Dotted spacing
        const dist = Phaser.Math.Distance.Between(p1.x, p1.y, p2.x, p2.y);
        const steps = Math.floor(dist / 10);
        
        for (let s = 0; s <= steps; s++) {
          if (s % 2 === 0) {
            const tx1 = Phaser.Math.Interpolation.Linear([p1.x, p2.x], s / steps);
            const ty1 = Phaser.Math.Interpolation.Linear([p1.y, p2.y], s / steps);
            const tx2 = Phaser.Math.Interpolation.Linear([p1.x, p2.x], (s + 0.5) / steps);
            const ty2 = Phaser.Math.Interpolation.Linear([p1.y, p2.y], (s + 0.5) / steps);
            graphics.lineBetween(tx1, ty1, tx2, ty2);
          }
        }
      }

      // Draw Start Indicator ring
      graphics.fillStyle(0xffffff, 1);
      graphics.lineStyle(2, strokeColor, 1);
      graphics.fillCircle(geometry.startPoint.x, geometry.startPoint.y, 7);
      graphics.strokeCircle(geometry.startPoint.x, geometry.startPoint.y, 7);

      // Draw End Target Zone pulsing ring
      graphics.lineStyle(3, 0xffffff, 0.9);
      graphics.strokeCircle(geometry.endPoint.x, geometry.endPoint.y, 16);
      graphics.fillStyle(0xffd700, 0.4);
      graphics.fillCircle(geometry.endPoint.x, geometry.endPoint.y, 8);
    }
  }
}
