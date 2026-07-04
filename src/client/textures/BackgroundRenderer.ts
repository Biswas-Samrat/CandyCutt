/**
 * @file BackgroundRenderer.ts
 * @description Generates beautiful gradient background patterns procedurally on canvas resize.
 */

import * as Phaser from 'phaser';
import { COLORS } from '../data/Constants';

export class BackgroundRenderer {
  /**
   * Draws a premium vertical gradient background directly to a scene's camera or a background Graphics object.
   *
   * @param graphics - The graphics object to draw on (usually placed at depth -10)
   * @param width - The canvas width
   * @param height - The canvas height
   */
  static drawBackground(graphics: Phaser.GameObjects.Graphics, width: number, height: number): void {
    graphics.clear();

    // Since Phaser 4 Graphics can take fillGradientStyle, let's use it for a premium dual color vertical gradient.
    graphics.fillGradientStyle(
      COLORS.BG_DARK,  // Top Left
      COLORS.BG_DARK,  // Top Right
      COLORS.BG_MID,   // Bottom Left
      COLORS.BG_MID,   // Bottom Right
      1.0
    );

    // Draw full-canvas rectangle
    graphics.fillRect(0, 0, width, height);

    // Overlay subtle diagonal decorative scanner grid lines
    graphics.lineStyle(1.5, COLORS.BG_GLOW, 0.2);
    const spacing = 120;
    for (let offset = -height; offset < width; offset += spacing) {
      graphics.lineBetween(offset, 0, offset + height, height);
    }

    // Draw top light radial glow to enhance visual depth
    graphics.fillStyle(COLORS.CANDY_PURPLE, 0.08);
    graphics.fillCircle(width / 2, 0, Math.min(width, height) * 0.85);
  }
}
