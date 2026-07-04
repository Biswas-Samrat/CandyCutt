/**
 * @file SplashScreen.ts
 * @description Branded intro sequence revealing the game logo with sparkle animations.
 */

import * as Phaser from 'phaser';
import { Scene } from 'phaser';
import { SCENE_KEYS, COLORS } from '../data/Constants';
import { BackgroundRenderer } from '../textures/BackgroundRenderer';
import { AnimationManager } from '../managers/AnimationManager';
import { ParticleManager } from '../managers/ParticleManager';
import { AudioManager } from '../managers/AudioManager';

export class SplashScreen extends Scene {
  private bgGraphics!: Phaser.GameObjects.Graphics;
  private logoGO!: Phaser.GameObjects.GameObject; // Image OR Text
  private taglineText!: Phaser.GameObjects.Text;
  private promptText!: Phaser.GameObjects.Text;
  private _transitioning = false;

  constructor() {
    super(SCENE_KEYS.SPLASH_SCREEN);
  }

  create(): void {
    this._transitioning = false;
    const { width, height } = this.scale;

    this.bgGraphics = this.add.graphics();
    BackgroundRenderer.drawBackground(this.bgGraphics, width, height);

    const logoScale = Math.min(width / 1024, height / 768) * 0.85;

    // Try to use the loaded logo image; fall back to a styled text banner
    const hasLogo = this.textures.exists('logo') && this.textures.get('logo').source[0]?.width > 0;

    if (hasLogo) {
      const img = this.add.image(width / 2, height * 0.38, 'logo');
      img.setScale(logoScale);
      this.logoGO = img;
    } else {
      const txt = this.add.text(width / 2, height * 0.38, 'CANDY\nSNIP SAGA', {
        fontFamily: '"Nunito", "Arial Rounded MT Bold", Arial',
        fontSize: `${Math.min(width, height) * 0.1}px`,
        color: '#ff6b9d',
        fontStyle: 'bold',
        align: 'center',
        stroke: '#ffffff',
        strokeThickness: 6
      }).setOrigin(0.5);
      this.logoGO = txt;
    }

    // Tagline text
    this.taglineText = this.add.text(width / 2, height * 0.58, 'SNIP WITH PRECISION', {
      fontFamily: '"Nunito", Arial',
      fontSize: `${Math.min(width, height) * 0.038}px`,
      color: '#ffd700',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 3
    }).setOrigin(0.5).setAlpha(0);

    // Click/Touch prompt
    this.promptText = this.add.text(width / 2, height * 0.8, 'Tap to Start', {
      fontFamily: '"Nunito", Arial',
      fontSize: `${Math.min(width, height) * 0.038}px`,
      color: '#c084fc',
      fontStyle: 'bold',
      align: 'center'
    }).setOrigin(0.5).setAlpha(0);

    // Run logo entrance animation
    AnimationManager.getInstance().logoReveal(this, this.logoGO, () => {
      // Burst particles on reveal
      try {
        ParticleManager.getInstance().emitSuccessGlow(this, width / 2, height * 0.38, COLORS.CANDY_PINK);
      } catch { /* particles are non-critical */ }

      // Fade in labels
      this.tweens.add({
        targets: [this.taglineText, this.promptText],
        alpha: 1,
        duration: 400,
        onComplete: () => {
          this.tweens.add({
            targets: this.promptText,
            alpha: 0.3,
            duration: 800,
            yoyo: true,
            repeat: -1
          });
        }
      });
    });

    // Touch/click starts game menu — guarded against double-fire
    this.input.on('pointerdown', () => {
      if (this._transitioning) return;
      this._transitioning = true;

      try { AudioManager.getInstance().playButton(); } catch { /* ignore */ }
      this.tweens.killTweensOf(this.promptText);

      // Fade out then transition — with a safety timeout fallback
      this.cameras.main.fadeOut(300, 0, 0, 0);

      let started = false;
      const startNext = () => {
        if (started) return;
        started = true;
        this.goToMainMenu();
      };

      this.time.delayedCall(600, startNext);
      this.cameras.main.once('camerafadeoutcomplete', startNext);
    });

    this.scale.on('resize', this.onResize, this);
  }

  private goToMainMenu(): void {
    try {
      this.scene.start(SCENE_KEYS.MAIN_MENU);
    } catch (err) {
      console.error('[SplashScreen] Failed to start MainMenu:', err);
    }
  }

  private onResize(gameSize: Phaser.Structs.Size): void {
    const { width, height } = gameSize;
    this.cameras.resize(width, height);
    BackgroundRenderer.drawBackground(this.bgGraphics, width, height);

    const logoScale = Math.min(width / 1024, height / 768) * 0.85;

    if (this.logoGO instanceof Phaser.GameObjects.Image) {
      (this.logoGO as Phaser.GameObjects.Image).setPosition(width / 2, height * 0.38).setScale(logoScale);
    } else if (this.logoGO instanceof Phaser.GameObjects.Text) {
      (this.logoGO as Phaser.GameObjects.Text)
        .setPosition(width / 2, height * 0.38)
        .setFontSize(`${Math.min(width, height) * 0.1}px`);
    }

    this.taglineText.setPosition(width / 2, height * 0.58).setFontSize(`${Math.min(width, height) * 0.038}px`);
    this.promptText.setPosition(width / 2, height * 0.8).setFontSize(`${Math.min(width, height) * 0.038}px`);
  }
}
