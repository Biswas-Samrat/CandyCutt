/**
 * @file PinController.ts
 * @description Controls the interactive pin — the player's primary gameplay tool.
 *              Renders a custom metallic pin graphic, positions it at the candy
 *              start point, and follows pointer drags. Emits a glowing trail.
 *              Communicates with CutValidator on each pointer move.
 */

import * as Phaser from 'phaser';
import { EVENTS, COLORS } from '../data/Constants';
import type { CandyShapeDef } from '../data/CandyShapes';
import { denormalize } from '../utils/MathUtils';
import type { Point2D } from '../utils/MathUtils';
import { ParticleManager } from '../managers/ParticleManager';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type PinState = 'idle' | 'active' | 'success' | 'fail';

// ---------------------------------------------------------------------------
// PinController
// ---------------------------------------------------------------------------

export class PinController {
  private readonly scene: Phaser.Scene;
  private readonly eventBus: Phaser.Events.EventEmitter;

  private container: Phaser.GameObjects.Container;
  private pinBody: Phaser.GameObjects.Graphics;
  private glowCircle: Phaser.GameObjects.Arc;

  private trailEmitter: Phaser.GameObjects.Particles.ParticleEmitter | null = null;
  private dragPath: Point2D[] = [];

  private state: PinState = 'idle';
  private candyBounds: { x: number; y: number; width: number; height: number } | null = null;
  private shapeDef: CandyShapeDef | null = null;

  // ── Construction ──────────────────────────────────────────────────────────

  constructor(scene: Phaser.Scene, eventBus: Phaser.Events.EventEmitter) {
    this.scene = scene;
    this.eventBus = eventBus;

    // Container holds pin body and glow
    this.container = scene.add.container(0, 0).setDepth(8);

    // Glow circle beneath pin
    this.glowCircle = scene.add.circle(0, 0, 22, COLORS.CANDY_PINK, 0.35);
    this.container.add(this.glowCircle);

    // Pin body
    this.pinBody = scene.add.graphics();
    this.drawPin();
    this.container.add(this.pinBody);

    this.container.setAlpha(0);

    // Create particle trail
    this.trailEmitter = ParticleManager.getInstance().createPinTrail(scene, COLORS.CANDY_PINK);
    if (this.trailEmitter) {
      this.trailEmitter.setDepth(7);
    }

    this.registerInputListeners();
  }

  // ── Candy presentation ────────────────────────────────────────────────────

  /**
   * Positions the pin at the candy's defined start point.
   * Must be called each time a new candy is presented.
   *
   * @param shapeDef - The shape being cut.
   * @param candyBounds - Pixel bounding box of the candy on screen.
   */
  presentForCandy(
    shapeDef: CandyShapeDef,
    candyBounds: { x: number; y: number; width: number; height: number }
  ): void {
    this.shapeDef = shapeDef;
    this.candyBounds = candyBounds;
    this.dragPath = [];
    this.setState('idle');

    const startPx = denormalize(
      shapeDef.startPoint,
      candyBounds.x,
      candyBounds.y,
      candyBounds.width,
      candyBounds.height
    );

    this.container.setPosition(startPx.x, startPx.y).setAlpha(1);

    // Pulse animation to indicate start position
    this.scene.tweens.add({
      targets: this.glowCircle,
      scaleX: 1.5,
      scaleY: 1.5,
      alpha: 0.6,
      duration: 600,
      ease: 'Sine.easeInOut',
      yoyo: true,
      repeat: -1,
    });
  }

  /** Hides the pin (e.g. during candy transitions). */
  hide(): void {
    this.container.setAlpha(0);
    this.trailEmitter?.stop();
    this.scene.tweens.killTweensOf(this.glowCircle);
    this.dragPath = [];
  }

  // ── Feedback states ───────────────────────────────────────────────────────

  /** Shows success visual (green glow). */
  showSuccess(): void {
    this.setState('success');
    this.glowCircle.setFillStyle(COLORS.CANDY_MINT, 0.8);
    this.scene.tweens.add({
      targets: this.container,
      scaleX: 1.4,
      scaleY: 1.4,
      duration: 200,
      ease: 'Back.easeOut',
      yoyo: true,
    });
  }

  /** Shows failure visual (red glow + shake). */
  showFail(): void {
    this.setState('fail');
    this.glowCircle.setFillStyle(COLORS.CANDY_RED, 0.9);
    const origX = this.container.x;
    this.scene.tweens.add({
      targets: this.container,
      x: { from: origX - 12, to: origX + 12 },
      duration: 50,
      ease: 'Sine.easeInOut',
      yoyo: true,
      repeat: 4,
      onComplete: () => { this.container.setX(origX); },
    });
  }

  // ── Path access ───────────────────────────────────────────────────────────

  /** Returns the accumulated drag path for this candy attempt. */
  getDragPath(): readonly Point2D[] { return [...this.dragPath]; }

  // ── Destroy ───────────────────────────────────────────────────────────────

  destroy(): void {
    this.container.destroy(true);
    this.trailEmitter?.destroy();
  }

  // ── Internal ──────────────────────────────────────────────────────────────

  private setState(s: PinState): void {
    this.state = s;
  }

  private drawPin(): void {
    const g = this.pinBody;
    g.clear();

    // Pin tip (sharp point downward)
    // Silver metallic needle
    g.fillGradientStyle(0xf0f0f0, 0xf0f0f0, 0xa0a0a0, 0xa0a0a0, 1);
    g.fillTriangle(0, 16, -3, -10, 3, -10);

    // Pin shaft
    g.fillStyle(0xcccccc, 1);
    g.fillRect(-3, -24, 6, 16);

    // Pin head (coloured ball)
    g.fillStyle(COLORS.CANDY_PINK, 1);
    g.fillCircle(0, -30, 9);

    // Specular highlight on pin head
    g.fillStyle(0xffffff, 0.6);
    g.fillCircle(-3, -33, 3);

    // Outline
    g.lineStyle(1, 0x606060, 0.8);
    g.strokeCircle(0, -30, 9);
  }

  private registerInputListeners(): void {
    this.eventBus.on(EVENTS.PIN_DRAG_START, (point: { x: number; y: number }) => {
      if (this.state !== 'idle') return;

      // Only start if pointer is near the pin's start position
      const dist = Phaser.Math.Distance.Between(
        point.x, point.y,
        this.container.x, this.container.y
      );
      if (dist > 60) return;

      this.setState('active');
      this.dragPath = [{ x: point.x, y: point.y }];
      this.scene.tweens.killTweensOf(this.glowCircle);
      this.glowCircle.setScale(1).setAlpha(0.35);
      this.trailEmitter?.start();
    });

    this.eventBus.on(EVENTS.PIN_DRAG_MOVE, (point: { x: number; y: number }) => {
      if (this.state !== 'active') return;

      this.container.setPosition(point.x, point.y);
      this.dragPath.push({ x: point.x, y: point.y });

      if (this.trailEmitter) {
        this.trailEmitter.setPosition(point.x, point.y);
        this.trailEmitter.emitParticle(2);
      }
    });

    this.eventBus.on(EVENTS.PIN_DRAG_END, () => {
      if (this.state !== 'active') return;
      this.trailEmitter?.stop();
      // Gameplay scene handles validation when this event fires
    });
  }
}
