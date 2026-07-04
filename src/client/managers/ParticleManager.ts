/**
 * @file ParticleManager.ts
 * @description Manages all Phaser particle emitters for Candy Snip Saga.
 *              Uses object pooling via Phaser's built-in emitter system.
 *              All emitters are pre-configured here; scenes call emit methods.
 */

import * as Phaser from 'phaser';
import { TEXTURE_KEYS, COLORS } from '../data/Constants';

// ---------------------------------------------------------------------------
// ParticleManager (singleton)
// ---------------------------------------------------------------------------

export class ParticleManager {
  private static _instance: ParticleManager | null = null;

  private constructor() {}

  static getInstance(): ParticleManager {
    if (!ParticleManager._instance) {
      ParticleManager._instance = new ParticleManager();
    }
    return ParticleManager._instance;
  }

  // ── Candy dust particles ──────────────────────────────────────────────────

  /**
   * Emits a burst of candy dust at the given position when a candy is being cut.
   * Small, coloured circles that fade quickly.
   */
  emitCandyDust(scene: Phaser.Scene, x: number, y: number, color: number): void {
    const textureKey = TEXTURE_KEYS.PARTICLE_DOT;
    if (!scene.textures.exists(textureKey)) return;

    const particles = scene.add.particles(x, y, textureKey, {
      speed: { min: 40, max: 130 },
      scale: { start: 0.6, end: 0 },
      alpha: { start: 1, end: 0 },
      lifespan: 500,
      quantity: 8,
      tint: color,
      angle: { min: 0, max: 360 },
      gravityY: 200,
      emitting: false,
    });

    particles.explode(8, x, y);

    // Auto-destroy after particles die
    scene.time.delayedCall(600, () => { particles.destroy(); });
  }

  // ── Crack particles ───────────────────────────────────────────────────────

  /**
   * Emits angular shard particles when a candy fails (boundary violation).
   * Looks like the candy is cracking apart.
   */
  emitCrackEffect(scene: Phaser.Scene, x: number, y: number, color: number): void {
    const textureKey = TEXTURE_KEYS.PARTICLE_SHARD;
    if (!scene.textures.exists(textureKey)) {
      // Fall back to dot if shard not ready
      this.emitCandyDust(scene, x, y, color);
      return;
    }

    const particles = scene.add.particles(x, y, textureKey, {
      speed: { min: 80, max: 220 },
      scale: { start: 0.8, end: 0 },
      alpha: { start: 1, end: 0 },
      lifespan: 700,
      quantity: 12,
      tint: color,
      angle: { min: 0, max: 360 },
      gravityY: 350,
      rotate: { min: 0, max: 360 },
      emitting: false,
    });

    particles.explode(12, x, y);
    scene.time.delayedCall(800, () => { particles.destroy(); });
  }

  // ── Success glow ──────────────────────────────────────────────────────────

  /**
   * Emits a radial glow burst of large soft particles on candy success.
   */
  emitSuccessGlow(scene: Phaser.Scene, x: number, y: number, color: number): void {
    const textureKey = TEXTURE_KEYS.PARTICLE_DOT;
    if (!scene.textures.exists(textureKey)) return;

    // Outer burst
    const outer = scene.add.particles(x, y, textureKey, {
      speed: { min: 60, max: 180 },
      scale: { start: 2.5, end: 0 },
      alpha: { start: 0.7, end: 0 },
      lifespan: 600,
      quantity: 14,
      tint: color,
      angle: { min: 0, max: 360 },
      emitting: false,
    });
    outer.explode(14, x, y);
    scene.time.delayedCall(700, () => { outer.destroy(); });

    // Inner sparkle ring
    const inner = scene.add.particles(x, y, TEXTURE_KEYS.PARTICLE_STAR, {
      speed: { min: 30, max: 100 },
      scale: { start: 1.0, end: 0 },
      alpha: { start: 1, end: 0 },
      lifespan: 800,
      quantity: 8,
      tint: COLORS.CANDY_YELLOW,
      angle: { min: 0, max: 360 },
      emitting: false,
    });
    if (scene.textures.exists(TEXTURE_KEYS.PARTICLE_STAR)) {
      inner.explode(8, x, y);
    } else {
      inner.destroy();
    }
    scene.time.delayedCall(900, () => {
      if (inner.active) inner.destroy();
    });
  }

  // ── Confetti (level complete) ─────────────────────────────────────────────

  /**
   * Creates a full-screen confetti celebration for completing a level.
   * Returns a function to stop the confetti.
   */
  emitConfetti(scene: Phaser.Scene): () => void {
    const { width } = scene.scale;

    const confettiKeys = [
      TEXTURE_KEYS.PARTICLE_CONFETTI_R,
      TEXTURE_KEYS.PARTICLE_CONFETTI_G,
      TEXTURE_KEYS.PARTICLE_CONFETTI_B,
      TEXTURE_KEYS.PARTICLE_CONFETTI_Y,
    ];

    const emitters: Phaser.GameObjects.Particles.ParticleEmitter[] = [];

    for (const key of confettiKeys) {
      if (!scene.textures.exists(key)) continue;

      const em = scene.add.particles(width / 2, -20, key, {
        speedX: { min: -width * 0.4, max: width * 0.4 },
        speedY: { min: 150, max: 420 },
        scale: { min: 0.6, max: 1.2 },
        alpha: { start: 1, end: 0.4 },
        lifespan: 2800,
        quantity: 3,
        frequency: 40,
        gravityY: 200,
        rotate: { min: 0, max: 360 },
        x: { min: 0, max: width },
      });
      emitters.push(em);
    }

    return () => {
      for (const em of emitters) {
        if (em.active) em.destroy();
      }
    };
  }

  // ── Pin trail ─────────────────────────────────────────────────────────────

  /**
   * Creates a subtle glowing trail that follows the pin during cutting.
   * Returns a Phaser ParticleEmitter that should be updated each frame.
   */
  createPinTrail(
    scene: Phaser.Scene,
    color: number
  ): Phaser.GameObjects.Particles.ParticleEmitter | null {
    const textureKey = TEXTURE_KEYS.PARTICLE_DOT;
    if (!scene.textures.exists(textureKey)) return null;

    return scene.add.particles(0, 0, textureKey, {
      speed: { min: 5, max: 20 },
      scale: { start: 0.4, end: 0 },
      alpha: { start: 0.6, end: 0 },
      lifespan: 250,
      quantity: 2,
      frequency: 20,
      tint: color,
      emitting: false,
    });
  }

  // ── Achievement pop ───────────────────────────────────────────────────────

  /**
   * Emits a small celebratory burst when an achievement is unlocked.
   */
  emitAchievementPop(scene: Phaser.Scene, x: number, y: number): void {
    const textureKey = TEXTURE_KEYS.PARTICLE_STAR;
    if (!scene.textures.exists(textureKey)) return;

    const particles = scene.add.particles(x, y, textureKey, {
      speed: { min: 50, max: 180 },
      scale: { start: 1.2, end: 0 },
      alpha: { start: 1, end: 0 },
      lifespan: 900,
      quantity: 10,
      tint: COLORS.CANDY_YELLOW,
      angle: { min: 0, max: 360 },
      gravityY: 100,
      emitting: false,
    });

    particles.explode(10, x, y);
    scene.time.delayedCall(1000, () => { particles.destroy(); });
  }
}
