/**
 * @file ProgressBar.ts
 * @description A custom progress bar UI component with soft rounded styling and glow accents.
 */

import * as Phaser from 'phaser';

export type ProgressBarConfig = {
  scene: Phaser.Scene;
  x: number;
  y: number;
  width: number;
  height: number;
  bgColor?: number;
  fillColor?: number;
  borderColor?: number;
  borderRadius?: number;
  initialValue?: number; // 0.0 - 1.0
};

export class ProgressBar {
  readonly container: Phaser.GameObjects.Container;
  private bgGraphics: Phaser.GameObjects.Graphics;
  private fillGraphics: Phaser.GameObjects.Graphics;
  
  private w: number;
  private h: number;
  private radius: number;
  private bgColor: number;
  private fillColor: number;
  private borderColor: number;
  private value: number;

  constructor(config: ProgressBarConfig) {
    const {
      scene,
      x,
      y,
      width,
      height,
      bgColor = 0x2d1b69,
      fillColor = 0x4ecdc4,
      borderColor = 0xa855f7,
      borderRadius = height / 2,
      initialValue = 1.0
    } = config;

    this.w = width;
    this.h = height;
    this.radius = borderRadius;
    this.bgColor = bgColor;
    this.fillColor = fillColor;
    this.borderColor = borderColor;
    this.value = initialValue;

    this.container = scene.add.container(x, y);

    this.bgGraphics = scene.add.graphics();
    this.fillGraphics = scene.add.graphics();

    this.container.add([this.bgGraphics, this.fillGraphics]);

    this.draw();
  }

  /**
   * Sets the fill percentage value of the progress bar (0.0 to 1.0) and updates the drawing.
   */
  setValue(val: number): void {
    this.value = Math.max(0, Math.min(1, val));
    this.draw();
  }

  /**
   * Set custom fill color and redraws.
   */
  setFillColor(color: number): void {
    this.fillColor = color;
    this.draw();
  }

  private draw(): void {
    this.bgGraphics.clear();
    this.fillGraphics.clear();

    // Draw background panel
    this.bgGraphics.fillStyle(this.bgColor, 0.85);
    this.bgGraphics.fillRoundedRect(-this.w / 2, -this.h / 2, this.w, this.h, this.radius);

    // Draw border
    this.bgGraphics.lineStyle(2, this.borderColor, 0.9);
    this.bgGraphics.strokeRoundedRect(-this.w / 2, -this.h / 2, this.w, this.h, this.radius);

    if (this.value <= 0) return;

    // Draw fill area (scale the width)
    const fillWidth = Math.max(this.h, this.w * this.value);
    
    this.fillGraphics.fillStyle(this.fillColor, 1.0);
    this.fillGraphics.fillRoundedRect(
      -this.w / 2,
      -this.h / 2,
      fillWidth,
      this.h,
      this.radius
    );
  }

  destroy(): void {
    this.container.destroy(true);
  }
}
