




/**
 * @file Preloader.ts
 * @description Loads all gameplay assets (audio tracks, textures, web fonts)
 *              and generates procedural assets prior to launching the animated splash screen.
 */

import { Scene } from 'phaser';
import { SCENE_KEYS, AUDIO_KEYS } from '../data/Constants';
import { TextureFactory } from '../textures/TextureFactory';
import { StorageManager } from '../managers/StorageManager';
import { BackgroundRenderer } from '../textures/BackgroundRenderer';
import { AudioManager } from '../managers/AudioManager';

export class Preloader extends Scene {
  private progressFill!: Phaser.GameObjects.Graphics;
  private progressOutline!: Phaser.GameObjects.Graphics;
  private statusText!: Phaser.GameObjects.Text;
  private bgGraphics!: Phaser.GameObjects.Graphics;

  constructor() {
    super(SCENE_KEYS.PRELOADER);
  }

  init(): void {
    const { width, height } = this.scale;

    // Draw background grid/fill
    this.bgGraphics = this.add.graphics();
    BackgroundRenderer.drawBackground(this.bgGraphics, width, height);

    // Dynamic centered loading bar
    const barW = Math.min(width * 0.75, 450);
    const barH = 14;
    const barX = width / 2;
    const barY = height * 0.65;

    this.progressOutline = this.add.graphics();
    this.progressOutline.lineStyle(2, 0xa855f7, 0.85);
    this.progressOutline.strokeRoundedRect(barX - barW / 2, barY - barH / 2, barW, barH, barH / 2);

    this.progressFill = this.add.graphics();

    // Centered loading/status labels
    this.statusText = this.add.text(width / 2, barY - 32, 'Loading assets...', {
      fontFamily: '"Nunito", "Arial Rounded MT Bold", Arial',
      fontSize: '22px',
      color: '#ffd700'
    }).setOrigin(0.5);

    // Track loading progress
    this.load.on('progress', (progress: number) => {
      this.progressFill.clear();
      this.progressFill.fillStyle(0x4ecdc4, 1.0);
      this.progressFill.fillRoundedRect(
        barX - barW / 2 + 2,
        barY - barH / 2 + 2,
        (barW - 4) * progress,
        barH - 4,
        (barH - 4) / 2
      );
      this.statusText.setText(`Preparing resources: ${Math.round(progress * 100)}%`);
    });

    this.scale.on('resize', this.onResize, this);
  }

  preload(): void {
    // ── Load audio assets ──────────────────────────────────────────────────
    this.load.setPath('../assets/audio');

    // Music
    this.load.audio(AUDIO_KEYS.MUSIC_MENU, 'music-menu.mp3');
    this.load.audio(AUDIO_KEYS.MUSIC_GAMEPLAY, 'music-gameplay.mp3');
    this.load.audio(AUDIO_KEYS.MUSIC_VICTORY, 'music-victory.mp3');
    this.load.audio(AUDIO_KEYS.MUSIC_TENSION, 'music-tension.mp3');

    // SFX
    this.load.audio(AUDIO_KEYS.SFX_CUT, 'sfx-cut.mp3');
    this.load.audio(AUDIO_KEYS.SFX_CRACK, 'sfx-crack.mp3');
    this.load.audio(AUDIO_KEYS.SFX_SUCCESS, 'sfx-success.mp3');
    this.load.audio(AUDIO_KEYS.SFX_FAIL, 'sfx-fail.mp3');
    this.load.audio(AUDIO_KEYS.SFX_BUTTON, 'sfx-button.mp3');
    this.load.audio(AUDIO_KEYS.SFX_COUNTDOWN, 'sfx-countdown.mp3');
    this.load.audio(AUDIO_KEYS.SFX_CONFETTI, 'sfx-confetti.mp3');
    this.load.audio(AUDIO_KEYS.SFX_ACHIEVEMENT, 'sfx-achievement.mp3');
  }

  create(): void {
    // ── Procedural Asset Assembly ──────────────────────────────────────────
    TextureFactory.generateTextures(this);

    // ── Async init wrapped in IIFE — Phaser does NOT await async create() ──
    // Run initialization in a self-contained promise with timeout + fallback.
    void this.initAsync();
  }

  private async initAsync(): Promise<void> {
    const TIMEOUT_MS = 8000;

    this.statusText.setText('Authenticating account...');

    try {
      const storage = StorageManager.getInstance();

      // Race the load against a timeout so we never hang forever
      await Promise.race([
        storage.load(),
        new Promise<void>((_, reject) =>
          setTimeout(() => reject(new Error('Init timed out')), TIMEOUT_MS)
        ),
      ]);

      // Apply audio configurations from loaded settings
      const settings = storage.getSettings();
      AudioManager.getInstance().applySettings({
        musicVolume: settings.musicVolume,
        sfxVolume: settings.sfxVolume,
        musicEnabled: settings.musicEnabled,
        sfxEnabled: settings.sfxEnabled,
      });

      this.statusText.setText('Done!');
      this.time.delayedCall(300, () => {
        try {
          this.cameras.main.fadeOut(400, 0, 0, 0);
          this.cameras.main.once('camerafadeoutcomplete', () => {
            this.scene.start(SCENE_KEYS.SPLASH_SCREEN);
          });
        } catch (err) {
          console.error('[Preloader] Scene transition failed:', err);
          // Fallback: try direct start without fade
          this.scene.start(SCENE_KEYS.SPLASH_SCREEN);
        }
      });
    } catch (error) {
      console.error('[Preloader] Authentication failed:', error);
      this.statusText.setText('Authentication failed!\nTap screen to retry.');
      this.statusText.setColor('#ff4757');
      
      this.input.once('pointerdown', () => {
        this.statusText.setColor('#ffd700');
        void this.initAsync();
      });
    }
  }

  private onResize(gameSize: Phaser.Structs.Size): void {
    const { width, height } = gameSize;
    this.cameras.resize(width, height);
    BackgroundRenderer.drawBackground(this.bgGraphics, width, height);
  }
}
