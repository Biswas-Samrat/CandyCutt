/**
 * @file AnimationManager.ts
 * @description Registers and orchestrates all reusable Phaser tween animations.
 *              All tweens are created here and referenced by name so scenes
 *              don't contain ad-hoc animation logic.
 */

import * as Phaser from 'phaser';
import { GAMEPLAY_CONST } from '../data/Constants';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type TweenCallback = () => void;

// ---------------------------------------------------------------------------
// AnimationManager (singleton)
// ---------------------------------------------------------------------------

export class AnimationManager {
  private static _instance: AnimationManager | null = null;

  private constructor() {}

  static getInstance(): AnimationManager {
    if (!AnimationManager._instance) {
      AnimationManager._instance = new AnimationManager();
    }
    return AnimationManager._instance;
  }

  // ── Menu animations ───────────────────────────────────────────────────────

  /**
   * Makes a candy float up and down continuously (main menu decoration).
   * Returns the tween so the caller can stop it.
   */
  menuFloatCandy(
    scene: Phaser.Scene,
    target: Phaser.GameObjects.GameObject,
    delayMs = 0,
    amplitude = 18
  ): Phaser.Tweens.Tween {
    return scene.tweens.add({
      targets: target,
      y: `+=${amplitude}`,
      duration: 1800 + Math.random() * 400,
      ease: 'Sine.easeInOut',
      yoyo: true,
      repeat: -1,
      delay: delayMs,
    });
  }

  /** Gentle idle rotation for decorative objects. */
  idleRotate(
    scene: Phaser.Scene,
    target: Phaser.GameObjects.GameObject,
    duration = 4000,
    maxAngle = 12
  ): Phaser.Tweens.Tween {
    return scene.tweens.add({
      targets: target,
      angle: { from: -maxAngle, to: maxAngle },
      duration,
      ease: 'Sine.easeInOut',
      yoyo: true,
      repeat: -1,
    });
  }

  // ── Button animations ─────────────────────────────────────────────────────

  /** Scale pulse on button press. Returns a tween chain. */
  buttonPress(scene: Phaser.Scene, target: Phaser.GameObjects.GameObject): Phaser.Tweens.Tween {
    return scene.tweens.add({
      targets: target,
      scaleX: 0.92,
      scaleY: 0.92,
      duration: 80,
      ease: 'Quad.easeOut',
      yoyo: true,
    });
  }

  /** Hover lift effect — scale up slightly. */
  buttonHoverIn(scene: Phaser.Scene, target: Phaser.GameObjects.GameObject): Phaser.Tweens.Tween {
    return scene.tweens.add({
      targets: target,
      scaleX: 1.05,
      scaleY: 1.05,
      duration: 120,
      ease: 'Quad.easeOut',
    });
  }

  /** Hover leave — restore scale. */
  buttonHoverOut(scene: Phaser.Scene, target: Phaser.GameObjects.GameObject): Phaser.Tweens.Tween {
    return scene.tweens.add({
      targets: target,
      scaleX: 1.0,
      scaleY: 1.0,
      duration: 120,
      ease: 'Quad.easeOut',
    });
  }

  // ── Candy entrance ────────────────────────────────────────────────────────

  /**
   * Candy drops into view with a bounce effect.
   * @param onComplete - Called when the entrance finishes.
   */
  candyEntrance(
    scene: Phaser.Scene,
    target: Phaser.GameObjects.GameObject,
    targetY: number,
    onComplete?: TweenCallback
  ): Phaser.Tweens.Tween {
    const go = target as Phaser.GameObjects.Image;
    go.setAlpha(0);
    go.setScale(0.4);

    return scene.tweens.add({
      targets: target,
      alpha: 1,
      scaleX: 1,
      scaleY: 1,
      y: targetY,
      duration: GAMEPLAY_CONST.CANDY_ENTRANCE_MS,
      ease: 'Back.easeOut',
      onComplete: () => onComplete?.(),
    });
  }

  /**
   * Candy success — the candy splits cleanly in two halves flying apart.
   * @param leftHalf  - Left half game object.
   * @param rightHalf - Right half game object.
   * @param onComplete - Called when animation completes.
   */
  candySuccessSplit(
    scene: Phaser.Scene,
    leftHalf: Phaser.GameObjects.GameObject,
    rightHalf: Phaser.GameObjects.GameObject,
    onComplete?: TweenCallback
  ): void {
    const lh = leftHalf as Phaser.GameObjects.Image;
    const rh = rightHalf as Phaser.GameObjects.Image;

    scene.tweens.add({
      targets: lh,
      x: lh.x - 80,
      y: lh.y - 40,
      angle: -25,
      alpha: 0,
      duration: GAMEPLAY_CONST.CANDY_SPLIT_MS,
      ease: 'Quad.easeOut',
    });

    scene.tweens.add({
      targets: rh,
      x: rh.x + 80,
      y: rh.y - 40,
      angle: 25,
      alpha: 0,
      duration: GAMEPLAY_CONST.CANDY_SPLIT_MS,
      ease: 'Quad.easeOut',
      onComplete: () => onComplete?.(),
    });
  }

  /**
   * Candy failure — candy shakes and cracks in place.
   * @param onComplete - Called when animation completes.
   */
  candyFailShake(
    scene: Phaser.Scene,
    target: Phaser.GameObjects.GameObject,
    onComplete?: TweenCallback
  ): Phaser.Tweens.Tween {
    const go = target as Phaser.GameObjects.Image;
    const origX = go.x;

    return scene.tweens.add({
      targets: target,
      x: { from: origX - 16, to: origX + 16 },
      duration: 60,
      ease: 'Sine.easeInOut',
      yoyo: true,
      repeat: 4,
      onComplete: () => {
        go.setX(origX);
        onComplete?.();
      },
    });
  }

  /** Fade + scale out for candy dismissal. */
  candyDismiss(
    scene: Phaser.Scene,
    target: Phaser.GameObjects.GameObject,
    onComplete?: TweenCallback
  ): Phaser.Tweens.Tween {
    return scene.tweens.add({
      targets: target,
      alpha: 0,
      scaleX: 0.6,
      scaleY: 0.6,
      duration: 280,
      ease: 'Quad.easeIn',
      onComplete: () => onComplete?.(),
    });
  }

  // ── Screen shake ──────────────────────────────────────────────────────────

  /**
   * Triggers a camera shake effect for boundary violation failures.
   */
  screenShake(camera: Phaser.Cameras.Scene2D.Camera): void {
    camera.shake(
      GAMEPLAY_CONST.SHAKE_DURATION,
      GAMEPLAY_CONST.SHAKE_INTENSITY
    );
  }

  // ── Scene transitions ─────────────────────────────────────────────────────

  /** Fades the camera to black (for scene transitions). */
  fadeOut(scene: Phaser.Scene, duration = 350, onComplete?: TweenCallback): void {
    if (onComplete) {
      scene.cameras.main.once('camerafadeoutcomplete', () => onComplete());
    }
    scene.cameras.main.fadeOut(duration, 0, 0, 0);
  }

  /** Fades the camera in from black. */
  fadeIn(scene: Phaser.Scene, duration = 350): void {
    scene.cameras.main.fadeIn(duration, 0, 0, 0);
  }

  // ── Popup/panel ───────────────────────────────────────────────────────────

  /** Slides a panel in from below with a spring effect. */
  panelSlideIn(
    scene: Phaser.Scene,
    target: Phaser.GameObjects.GameObject,
    targetY: number,
    onComplete?: TweenCallback
  ): Phaser.Tweens.Tween {
    const go = target as Phaser.GameObjects.Container;
    go.setY(go.y + 300);
    go.setAlpha(0);

    return scene.tweens.add({
      targets: target,
      y: targetY,
      alpha: 1,
      duration: 480,
      ease: 'Back.easeOut',
      onComplete: () => onComplete?.(),
    });
  }

  /** Slides a panel out downward. */
  panelSlideOut(
    scene: Phaser.Scene,
    target: Phaser.GameObjects.GameObject,
    onComplete?: TweenCallback
  ): Phaser.Tweens.Tween {
    const go = target as Phaser.GameObjects.Container;
    return scene.tweens.add({
      targets: target,
      y: go.y + 300,
      alpha: 0,
      duration: 320,
      ease: 'Quad.easeIn',
      onComplete: () => onComplete?.(),
    });
  }

  // ── Score counter ─────────────────────────────────────────────────────────

  /**
   * Animates a numeric counter from oldValue to newValue.
   * @param onUpdate - Called each frame with the interpolated number.
   */
  countUp(
    scene: Phaser.Scene,
    fromValue: number,
    toValue: number,
    duration: number,
    onUpdate: (value: number) => void,
    onComplete?: TweenCallback
  ): void {
    const obj = { value: fromValue };
    scene.tweens.add({
      targets: obj,
      value: toValue,
      duration,
      ease: 'Quad.easeOut',
      onUpdate: () => onUpdate(Math.round(obj.value)),
      onComplete: () => onComplete?.(),
    });
  }

  // ── Logo reveal (Splash Screen) ───────────────────────────────────────────

  logoReveal(
    scene: Phaser.Scene,
    logo: Phaser.GameObjects.GameObject,
    onComplete?: TweenCallback
  ): Phaser.Tweens.Tween {
    // Safely handle both Image and Text GameObjects
    if ('setAlpha' in logo) (logo as Phaser.GameObjects.Image).setAlpha(0);
    if ('setScale' in logo) (logo as Phaser.GameObjects.Image).setScale(0.2);

    return scene.tweens.add({
      targets: logo,
      scaleX: 1.0,
      scaleY: 1.0,
      alpha: 1,
      duration: 800,
      ease: 'Back.easeOut',
      onComplete: () => onComplete?.(),
    });
  }

  // ── Star rating ───────────────────────────────────────────────────────────

  /**
   * Sequentially animates star icons popping into view.
   */
  animateStars(
    scene: Phaser.Scene,
    stars: Phaser.GameObjects.GameObject[],
    count: number
  ): void {
    stars.forEach((star, i) => {
      const go = star as Phaser.GameObjects.Image;
      go.setScale(0).setAlpha(i < count ? 1 : 0.25);

      if (i < count) {
        scene.tweens.add({
          targets: star,
          scaleX: 1,
          scaleY: 1,
          duration: 350,
          ease: 'Back.easeOut',
          delay: i * 180 + 200,
        });
      } else {
        go.setScale(1);
      }
    });
  }
}
