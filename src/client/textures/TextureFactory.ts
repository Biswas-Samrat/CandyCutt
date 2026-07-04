/**
 * @file TextureFactory.ts
 * @description Generates all secondary textures (particles, icons, shape components, stars)
 *              procedurally on the fly during game preloading to avoid asset overhead.
 */

import * as Phaser from 'phaser';
import { TEXTURE_KEYS, COLORS } from '../data/Constants';

export class TextureFactory {
  /**
   * Builds all procedural textures needed by the game.
   * Call from the Preloader or Boot scene's create/init sequence.
   */
  static generateTextures(scene: Phaser.Scene): void {
    this.createDotParticle(scene);
    this.createStarParticle(scene);
    this.createShardParticle(scene);
    this.createConfettis(scene);
    this.createStars(scene);
    this.createIcons(scene);
  }

  private static createDotParticle(scene: Phaser.Scene): void {
    if (scene.textures.exists(TEXTURE_KEYS.PARTICLE_DOT)) return;

    // Draw small white circle with soft edges to draw glow trail and dust
    const key = TEXTURE_KEYS.PARTICLE_DOT;
    const size = 16;
    const canvas = scene.textures.createCanvas(key, size, size);
    if (!canvas) return;

    const ctx = canvas.getContext();

    // Create radial smooth drop-off gradient
    const grad = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    grad.addColorStop(0, 'rgba(255, 255, 255, 1.0)');
    grad.addColorStop(0.35, 'rgba(255, 255, 255, 0.85)');
    grad.addColorStop(1.0, 'rgba(255, 255, 255, 0.0)');

    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, size, size);

    canvas.refresh();
  }

  private static createStarParticle(scene: Phaser.Scene): void {
    if (scene.textures.exists(TEXTURE_KEYS.PARTICLE_STAR)) return;

    const key = TEXTURE_KEYS.PARTICLE_STAR;
    const size = 24;
    const canvas = scene.textures.createCanvas(key, size, size);
    if (!canvas) return;

    const ctx = canvas.getContext();
    const cx = size / 2;
    const cy = size / 2;

    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    // Simple 4-point sparkle star
    ctx.moveTo(cx, 0);
    ctx.quadraticCurveTo(cx, cy, size, cy);
    ctx.quadraticCurveTo(cx, cy, cx, size);
    ctx.quadraticCurveTo(cx, cy, 0, cy);
    ctx.quadraticCurveTo(cx, cy, cx, 0);
    ctx.closePath();
    ctx.fill();

    canvas.refresh();
  }

  private static createShardParticle(scene: Phaser.Scene): void {
    if (scene.textures.exists(TEXTURE_KEYS.PARTICLE_SHARD)) return;

    const key = TEXTURE_KEYS.PARTICLE_SHARD;
    const size = 16;
    const canvas = scene.textures.createCanvas(key, size, size);
    if (!canvas) return;

    const ctx = canvas.getContext();
    ctx.fillStyle = '#ffffff';
    
    // Draw a sharp irregular shard triangle
    ctx.beginPath();
    ctx.moveTo(size / 2, 0);
    ctx.lineTo(size, size);
    ctx.lineTo(0, size * 0.75);
    ctx.closePath();
    ctx.fill();

    canvas.refresh();
  }

  private static createConfettis(scene: Phaser.Scene): void {
    const list = [
      { key: TEXTURE_KEYS.PARTICLE_CONFETTI_R, color: '#FF4757' },
      { key: TEXTURE_KEYS.PARTICLE_CONFETTI_G, color: '#2ED573' },
      { key: TEXTURE_KEYS.PARTICLE_CONFETTI_B, color: '#1E90FF' },
      { key: TEXTURE_KEYS.PARTICLE_CONFETTI_Y, color: '#FFA502' }
    ];

    for (const item of list) {
      if (scene.textures.exists(item.key)) continue;

      const size = 10;
      const canvas = scene.textures.createCanvas(item.key, size, size * 2);
      if (!canvas) continue;

      const ctx = canvas.getContext();
      ctx.fillStyle = item.color;
      ctx.fillRect(0, 0, size, size * 1.5); // long paper strip shape
      
      canvas.refresh();
    }
  }

  private static createStars(scene: Phaser.Scene): void {
    // Star Rating textures
    const starKeys = [
      { key: TEXTURE_KEYS.STAR_FULL, filled: true },
      { key: TEXTURE_KEYS.STAR_EMPTY, filled: false }
    ];

    for (const star of starKeys) {
      if (scene.textures.exists(star.key)) continue;

      const size = 48;
      const canvas = scene.textures.createCanvas(star.key, size, size);
      if (!canvas) continue;

      const ctx = canvas.getContext();
      const cx = size / 2;
      const cy = size / 2;
      const spikes = 5;
      const outerRadius = size / 2 - 2;
      const innerRadius = outerRadius * 0.45;

      let rot = (Math.PI / 2) * 3;
      let x = cx;
      let y = cy;
      const step = Math.PI / spikes;

      ctx.beginPath();
      ctx.moveTo(cx, cy - outerRadius);

      for (let i = 0; i < spikes; i++) {
        x = cx + Math.cos(rot) * outerRadius;
        y = cy + Math.sin(rot) * outerRadius;
        ctx.lineTo(x, y);
        rot += step;

        x = cx + Math.cos(rot) * innerRadius;
        y = cy + Math.sin(rot) * innerRadius;
        ctx.lineTo(x, y);
        rot += step;
      }

      ctx.lineTo(cx, cy - outerRadius);
      ctx.closePath();

      if (star.filled) {
        ctx.fillStyle = '#FFD700'; // Golden star
        ctx.fill();
        ctx.strokeStyle = '#D99B00';
        ctx.lineWidth = 3;
        ctx.stroke();
      } else {
        ctx.strokeStyle = '#A855F7'; // Lavender border outline star
        ctx.lineWidth = 3.5;
        ctx.stroke();
      }

      canvas.refresh();
    }
  }

  private static createIcons(scene: Phaser.Scene): void {
    // Crown badge icon
    if (!scene.textures.exists(TEXTURE_KEYS.CROWN_ICON)) {
      const size = 32;
      const canvas = scene.textures.createCanvas(TEXTURE_KEYS.CROWN_ICON, size, size);
      if (canvas) {
        const ctx = canvas.getContext();
        ctx.fillStyle = '#FFD700';
        ctx.strokeStyle = '#B8860B';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(2, 28);
        ctx.lineTo(30, 28);
        ctx.lineTo(26, 10);
        ctx.lineTo(20, 20);
        ctx.lineTo(16, 6);
        ctx.lineTo(12, 20);
        ctx.lineTo(6, 10);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        canvas.refresh();
      }
    }

    // Fire streak icon
    if (!scene.textures.exists(TEXTURE_KEYS.FIRE_ICON)) {
      const size = 32;
      const canvas = scene.textures.createCanvas(TEXTURE_KEYS.FIRE_ICON, size, size);
      if (canvas) {
        const ctx = canvas.getContext();
        ctx.fillStyle = '#FF4757';
        ctx.beginPath();
        ctx.moveTo(16, 2);
        ctx.quadraticCurveTo(24, 10, 24, 20);
        ctx.quadraticCurveTo(24, 30, 16, 30);
        ctx.quadraticCurveTo(8, 30, 8, 20);
        ctx.quadraticCurveTo(8, 12, 16, 2);
        ctx.closePath();
        ctx.fill();
        
        ctx.fillStyle = '#FFA502';
        ctx.beginPath();
        ctx.moveTo(16, 12);
        ctx.quadraticCurveTo(20, 18, 20, 24);
        ctx.quadraticCurveTo(20, 28, 16, 28);
        ctx.quadraticCurveTo(12, 28, 12, 24);
        ctx.quadraticCurveTo(12, 18, 16, 12);
        ctx.closePath();
        ctx.fill();
        canvas.refresh();
      }
    }
  }
}
