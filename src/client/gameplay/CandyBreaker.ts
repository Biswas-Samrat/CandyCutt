/**
 * @file CandyBreaker.ts
 * @description Handles visual representation of breaking candies.
 *              Generates dynamic debris/halves on the fly and runs physical/tween movements.
 */

import * as Phaser from 'phaser';
import type { ScaledCandyGeometry } from './CandyFactory';
import { AnimationManager } from '../managers/AnimationManager';
import { ParticleManager } from '../managers/ParticleManager';
import { hexToPhaser } from '../utils/ColorUtils';

export class CandyBreaker {
  private static _instance: CandyBreaker | null = null;

  private constructor() {}

  static getInstance(): CandyBreaker {
    if (!CandyBreaker._instance) {
      CandyBreaker._instance = new CandyBreaker();
    }
    return CandyBreaker._instance;
  }

  /**
   * Animates splitting the candy into two halves and flying them outwards (Success visual).
   */
  splitCandy(scene: Phaser.Scene, geometry: ScaledCandyGeometry, onComplete: () => void): void {
    const { shapeDef, bounds } = geometry;
    const centerX = bounds.x + bounds.width / 2;
    const centerY = bounds.y + bounds.height / 2;

    // Create left and right halves using temporary masks or clipping graphics
    // Since we generate custom shapes procedurally, we can draw two separate graphics pieces.
    const leftHalf = scene.add.graphics().setDepth(5);
    const rightHalf = scene.add.graphics().setDepth(5);

    const bodyStops = shapeDef.bodyGradient;
    const tintColor = hexToPhaser(bodyStops[1]?.color ?? '#FF6B9D');

    // Draw left half (clipping boundary to left side of center)
    leftHalf.fillStyle(tintColor, 1);
    leftHalf.lineStyle(4, hexToPhaser(shapeDef.outlineColor), 1);
    this.drawClippedShape(leftHalf, geometry.boundaryPolygon, centerX, true);

    // Draw right half (clipping boundary to right side of center)
    rightHalf.fillStyle(tintColor, 1);
    rightHalf.lineStyle(4, hexToPhaser(shapeDef.outlineColor), 1);
    this.drawClippedShape(rightHalf, geometry.boundaryPolygon, centerX, false);

    // Trigger visual/particles glow at the split
    ParticleManager.getInstance().emitSuccessGlow(scene, centerX, centerY, tintColor);

    // Animate the pieces apart
    AnimationManager.getInstance().candySuccessSplit(scene, leftHalf, rightHalf, () => {
      leftHalf.destroy();
      rightHalf.destroy();
      onComplete();
    });
  }

  /**
   * Shatters the candy into 4-6 randomized shards that fall and spin away (Failure visual).
   */
  shatterCandy(scene: Phaser.Scene, geometry: ScaledCandyGeometry, failPoint: { x: number; y: number } | null, onComplete: () => void): void {
    const { shapeDef, bounds } = geometry;
    const centerX = bounds.x + bounds.width / 2;
    const centerY = bounds.y + bounds.height / 2;
    const impactX = failPoint ? failPoint.x : centerX;
    const impactY = failPoint ? failPoint.y : centerY;

    const bodyStops = shapeDef.bodyGradient;
    const tintColor = hexToPhaser(bodyStops[1]?.color ?? '#FF6B9D');

    // Create 5 broken shard graphics
    const shardCount = 5;
    const shards: Phaser.GameObjects.Graphics[] = [];

    // Create shards based on angular slices from the center/impact point
    for (let i = 0; i < shardCount; i++) {
      const shard = scene.add.graphics().setDepth(5);
      shard.fillStyle(tintColor, 1);
      shard.lineStyle(3, hexToPhaser(shapeDef.outlineColor), 1);

      const startAngle = (i / shardCount) * Math.PI * 2;
      const endAngle = ((i + 1) / shardCount) * Math.PI * 2;
      
      this.drawShardPiece(shard, geometry.boundaryPolygon, impactX, impactY, startAngle, endAngle);
      shards.push(shard);

      // Random throw direction
      const angle = (startAngle + endAngle) / 2;
      const force = 150 + Math.random() * 200;
      const targetX = shard.x + Math.cos(angle) * force;
      const targetY = shard.y + Math.sin(angle) * force + 300; // gravity pull

      scene.tweens.add({
        targets: shard,
        x: targetX,
        y: targetY,
        angle: -180 + Math.random() * 360,
        alpha: 0,
        scaleX: 0.5,
        scaleY: 0.5,
        duration: 800,
        ease: 'Cubic.easeOut',
      });
    }

    // Explode shards / cracks at impact
    ParticleManager.getInstance().emitCrackEffect(scene, impactX, impactY, tintColor);
    AnimationManager.getInstance().screenShake(scene.cameras.main);

    // Call onComplete after animations settle
    scene.time.delayedCall(850, () => {
      shards.forEach((s) => s.destroy());
      onComplete();
    });
  }

  /**
   * Helper to draw a clipped polygon.
   */
  private drawClippedShape(
    graphics: Phaser.GameObjects.Graphics,
    points: { x: number; y: number }[],
    clipX: number,
    isLeft: boolean
  ): void {
    if (points.length === 0) return;

    graphics.beginPath();
    let started = false;

    // We project points to either keep them on the left/right,
    // or snap them to the vertical line splitting down the center.
    for (let i = 0; i < points.length; i++) {
      const p = points[i];
      let drawX = p.x;

      if (isLeft && drawX > clipX) {
        drawX = clipX;
      } else if (!isLeft && drawX < clipX) {
        drawX = clipX;
      }

      if (!started) {
        graphics.moveTo(drawX, p.y);
        started = true;
      } else {
        graphics.lineTo(drawX, p.y);
      }
    }

    graphics.closePath();
    graphics.fillPath();
    graphics.strokePath();
  }

  /**
   * Helper to draw a shard that represents an angular slice of the polygon.
   */
  private drawShardPiece(
    graphics: Phaser.GameObjects.Graphics,
    points: { x: number; y: number }[],
    cx: number,
    cy: number,
    startAngle: number,
    endAngle: number
  ): void {
    graphics.beginPath();
    graphics.moveTo(cx, cy);

    // Collect points in this angular slice
    for (const p of points) {
      const angle = Math.atan2(p.y - cy, p.x - cx);
      let normalizedAngle = angle;
      if (normalizedAngle < 0) normalizedAngle += Math.PI * 2;

      let inSlice = false;
      if (startAngle < endAngle) {
        inSlice = normalizedAngle >= startAngle && normalizedAngle <= endAngle;
      } else {
        inSlice = normalizedAngle >= startAngle || normalizedAngle <= endAngle;
      }

      if (inSlice) {
        graphics.lineTo(p.x, p.y);
      }
    }

    graphics.closePath();
    graphics.fillPath();
    graphics.strokePath();
  }
}
