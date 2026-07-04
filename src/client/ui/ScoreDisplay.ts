/**
 * @file ScoreDisplay.ts
 * @description Interactive score counter display that counts up and bounces when score changes.
 */

import * as Phaser from 'phaser';
import { COLOR_STR } from '../data/Constants';
import { AnimationManager } from '../managers/AnimationManager';

export type ScoreDisplayConfig = {
  scene: Phaser.Scene;
  x: number;
  y: number;
  prefix?: string;
  fontSize?: number;
  color?: string;
};

export class ScoreDisplay {
  readonly text: Phaser.GameObjects.Text;
  private scene: Phaser.Scene;
  private prefix: string;
  private currentValue: number = 0;

  constructor(config: ScoreDisplayConfig) {
    const {
      scene,
      x,
      y,
      prefix = 'Score: ',
      fontSize = 32,
      color = COLOR_STR.CANDY_YELLOW
    } = config;

    this.scene = scene;
    this.prefix = prefix;

    this.text = scene.add.text(x, y, `${prefix}0`, {
      fontFamily: '"Nunito", "Arial Rounded MT Bold", Arial',
      fontSize: `${fontSize}px`,
      color: color,
      stroke: COLOR_STR.SHADOW,
      strokeThickness: 5
    }).setOrigin(0.5).setDepth(10);
  }

  /**
   * Sets the score value and triggers a count-up animation if values differ.
   */
  setScore(newValue: number, animate = true): void {
    if (newValue === this.currentValue) return;

    if (!animate) {
      this.currentValue = newValue;
      this.text.setText(`${this.prefix}${newValue.toLocaleString()}`);
      return;
    }

    // Pulse bounce animation
    this.scene.tweens.add({
      targets: this.text,
      scaleX: 1.25,
      scaleY: 1.25,
      duration: 120,
      yoyo: true,
      ease: 'Back.easeOut'
    });

    AnimationManager.getInstance().countUp(
      this.scene,
      this.currentValue,
      newValue,
      600,
      (val) => {
        this.text.setText(`${this.prefix}${val.toLocaleString()}`);
      },
      () => {
        this.currentValue = newValue;
      }
    );
  }

  destroy(): void {
    this.text.destroy();
  }
}
