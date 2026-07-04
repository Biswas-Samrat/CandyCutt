/**
 * @file FloatingText.ts
 * @description Flying text effect (+100, PERFECT!, EXCELLENT) that float upward, fade, and destroy themselves.
 */

import * as Phaser from 'phaser';
import { COLOR_STR } from '../data/Constants';

export type FloatingTextConfig = {
  scene: Phaser.Scene;
  x: number;
  y: number;
  text: string;
  color?: string;
  fontSize?: number;
  duration?: number;
};

export class FloatingText {
  /**
   * Spawns a floating text feedback jingle.
   */
  static spawn(config: FloatingTextConfig): void {
    const {
      scene,
      x,
      y,
      text,
      color = COLOR_STR.CANDY_YELLOW,
      fontSize = 32,
      duration = 800
    } = config;

    const textObject = scene.add.text(x, y, text, {
      fontFamily: '"Nunito", "Arial Rounded MT Bold", Arial',
      fontSize: `${fontSize}px`,
      color: color,
      stroke: COLOR_STR.SHADOW,
      strokeThickness: 5,
      align: 'center'
    }).setOrigin(0.5).setDepth(15);

    // Fade and slide upwards
    scene.tweens.add({
      targets: textObject,
      y: y - 80,
      alpha: 0,
      scaleX: 1.35,
      scaleY: 1.35,
      duration: duration,
      ease: 'Back.easeOut',
      onComplete: () => {
        textObject.destroy();
      }
    });
  }
}
