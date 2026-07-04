/**
 * @file AudioManager.ts
 * @description Central audio controller for Candy Snip Saga.
 *              Manages background music, sound effects, volume settings,
 *              and cross-fade transitions. Gracefully handles missing audio
 *              files so the game runs fine without any audio assets.
 *
 *              Usage:
 *                AudioManager.init(game);
 *                AudioManager.getInstance().playMusic(AUDIO_KEYS.MUSIC_MENU);
 */

import * as Phaser from 'phaser';
import { AUDIO_KEYS } from '../data/Constants';
import type { AudioKey } from '../data/Constants';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type AudioSettings = {
  musicVolume: number;   // 0.0 – 1.0
  sfxVolume: number;     // 0.0 – 1.0
  musicEnabled: boolean;
  sfxEnabled: boolean;
};

type SoundInstance = Phaser.Sound.BaseSound | null;

// ---------------------------------------------------------------------------
// AudioManager (singleton)
// ---------------------------------------------------------------------------

export class AudioManager {
  private static _instance: AudioManager | null = null;

  private game!: Phaser.Game;
  private currentMusic: SoundInstance = null;
  private currentMusicKey: AudioKey | null = null;

  private settings: AudioSettings = {
    musicVolume: 0.6,
    sfxVolume: 0.8,
    musicEnabled: true,
    sfxEnabled: true,
  };

  private constructor() {}

  // ── Singleton access ──────────────────────────────────────────────────────

  static getInstance(): AudioManager {
    if (!AudioManager._instance) {
      AudioManager._instance = new AudioManager();
    }
    return AudioManager._instance;
  }

  /**
   * Must be called once during Boot scene with the Phaser Game instance.
   */
  static init(game: Phaser.Game): AudioManager {
    const instance = AudioManager.getInstance();
    instance.game = game;
    return instance;
  }

  // ── Music ─────────────────────────────────────────────────────────────────

  /**
   * Starts playing a looping background music track.
   * Cross-fades from the currently playing track if one is active.
   * Silently ignores missing audio keys.
   *
   * @param key - One of the AUDIO_KEYS.MUSIC_* constants.
   * @param fadeMs - Fade-in/out duration in milliseconds. Default 600.
   */
  playMusic(key: AudioKey, fadeMs = 600): void {
    if (this.currentMusicKey === key) return;
    if (!this.settings.musicEnabled) return;

    if (!this.hasSound(key)) return;

    const prevMusic = this.currentMusic;

    if (prevMusic) {
      this.game.tweens.add({
        targets: prevMusic,
        volume: 0,
        duration: fadeMs,
        onComplete: () => { prevMusic.stop(); },
      });
    }

    const newMusic = this.game.sound.add(key, {
      loop: true,
      volume: 0,
    });

    if (!newMusic) return;

    try {
      const playResult = newMusic.play();
      // Web Audio API returns a Promise; swallow autoplay-policy rejections silently
      if (playResult && typeof (playResult as unknown as Promise<void>).catch === 'function') {
        (playResult as unknown as Promise<void>).catch(() => {
          // Autoplay blocked by browser — music will stay silent until user interaction
        });
      }
    } catch {
      // Autoplay blocked — ignore and continue without music
      return;
    }

    this.game.tweens.add({
      targets: newMusic,
      volume: this.settings.musicVolume,
      duration: fadeMs,
    });

    this.currentMusic = newMusic;
    this.currentMusicKey = key;
  }

  /** Stops the current music with an optional fade-out. */
  stopMusic(fadeMs = 400): void {
    if (!this.currentMusic) return;

    const music = this.currentMusic;
    this.currentMusic = null;
    this.currentMusicKey = null;

    if (fadeMs > 0) {
      this.game.tweens.add({
        targets: music,
        volume: 0,
        duration: fadeMs,
        onComplete: () => { music.stop(); },
      });
    } else {
      music.stop();
    }
  }

  /** Pauses the current music (e.g. when game is backgrounded). */
  pauseMusic(): void {
    this.currentMusic?.pause();
  }

  /** Resumes paused music. */
  resumeMusic(): void {
    this.currentMusic?.resume();
  }

  // ── SFX ──────────────────────────────────────────────────────────────────

  /**
   * Plays a one-shot sound effect.
   * Silently ignores missing audio keys or if SFX is disabled.
   *
   * @param key - One of the AUDIO_KEYS.SFX_* constants.
   * @param volumeScale - Optional multiplier applied on top of sfxVolume. Default 1.
   */
  playSFX(key: AudioKey, volumeScale = 1): void {
    if (!this.settings.sfxEnabled) return;
    if (!this.hasSound(key)) return;

    try {
      this.game.sound.play(key, {
        volume: this.settings.sfxVolume * volumeScale,
      });
    } catch {
      // Autoplay blocked or sound unavailable — ignore silently
    }
  }

  // ── Tension music (last N seconds countdown) ──────────────────────────────

  /**
   * Switches from gameplay music to the tension loop.
   * Called by UIManager when the timer hits the tension threshold.
   */
  startTension(): void {
    this.playMusic(AUDIO_KEYS.MUSIC_TENSION, 300);
  }

  /** Restores normal gameplay music after tension ends. */
  endTension(): void {
    this.playMusic(AUDIO_KEYS.MUSIC_GAMEPLAY, 300);
  }

  // ── Volume control ────────────────────────────────────────────────────────

  /** Sets music volume (0–1) and applies it immediately. */
  setMusicVolume(volume: number): void {
    this.settings = { ...this.settings, musicVolume: Math.max(0, Math.min(1, volume)) };

    if (this.currentMusic && this.currentMusic instanceof Phaser.Sound.BaseSound) {
      if ('setVolume' in this.currentMusic) {
        (this.currentMusic as Phaser.Sound.WebAudioSound | Phaser.Sound.HTML5AudioSound)
          .setVolume(this.settings.musicVolume);
      }
    }
  }

  /** Sets SFX volume (0–1). Applied to the next played SFX. */
  setSFXVolume(volume: number): void {
    this.settings = { ...this.settings, sfxVolume: Math.max(0, Math.min(1, volume)) };
  }

  /** Toggles music on/off. */
  setMusicEnabled(enabled: boolean): void {
    this.settings = { ...this.settings, musicEnabled: enabled };
    if (!enabled) {
      this.stopMusic(200);
    }
  }

  /** Toggles SFX on/off. */
  setSFXEnabled(enabled: boolean): void {
    this.settings = { ...this.settings, sfxEnabled: enabled };
  }

  /** Returns a snapshot of the current audio settings. */
  getSettings(): Readonly<AudioSettings> {
    return { ...this.settings };
  }

  /** Applies a full settings object (e.g. loaded from storage). */
  applySettings(settings: AudioSettings): void {
    this.settings = { ...settings };
  }

  // ── Convenience SFX shortcuts ─────────────────────────────────────────────

  playCutSound(): void    { this.playSFX(AUDIO_KEYS.SFX_CUT); }
  playCrackSound(): void  { this.playSFX(AUDIO_KEYS.SFX_CRACK); }
  playSuccess(): void     { this.playSFX(AUDIO_KEYS.SFX_SUCCESS); }
  playFail(): void        { this.playSFX(AUDIO_KEYS.SFX_FAIL); }
  playButton(): void      { this.playSFX(AUDIO_KEYS.SFX_BUTTON); }
  playCountdown(): void   { this.playSFX(AUDIO_KEYS.SFX_COUNTDOWN, 0.7); }
  playConfetti(): void    { this.playSFX(AUDIO_KEYS.SFX_CONFETTI); }
  playAchievement(): void { this.playSFX(AUDIO_KEYS.SFX_ACHIEVEMENT); }

  // ── Internal helpers ──────────────────────────────────────────────────────

  /**
   * Returns true if the given audio key has been loaded into Phaser's cache.
   * Prevents crashes when audio files are absent.
   */
  private hasSound(key: AudioKey): boolean {
    return this.game.cache.audio.has(key);
  }
}
