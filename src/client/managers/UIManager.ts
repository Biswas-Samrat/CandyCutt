/**
 * @file UIManager.ts
 * @description Creates and manages the gameplay HUD (timer, score, progress bar)
 *              and handles any in-scene overlay feedback (countdown, candy labels).
 *              All elements are positioned as percentages of the canvas size.
 */

import * as Phaser from 'phaser';
import {
  EVENTS,
  COLOR_STR,
  GAMEPLAY_CONST,
} from '../data/Constants';
import { AudioManager } from './AudioManager';
import { AnimationManager } from './AnimationManager';

// ---------------------------------------------------------------------------
// HUD element config
// ---------------------------------------------------------------------------

type HUDConfig = {
  scene: Phaser.Scene;
  totalCandies: number;
  timeLimit: number;
  difficulty: string;
};

type HUDElements = {
  container: Phaser.GameObjects.Container;
  scoreText: Phaser.GameObjects.Text;
  timerText: Phaser.GameObjects.Text;
  timerBar: Phaser.GameObjects.Rectangle;
  timerBarBg: Phaser.GameObjects.Rectangle;
  progressDots: Phaser.GameObjects.Arc[];
  flavourText: Phaser.GameObjects.Text;
};

// ---------------------------------------------------------------------------
// UIManager (singleton)
// ---------------------------------------------------------------------------

export class UIManager {
  private static _instance: UIManager | null = null;

  private hud: HUDElements | null = null;
  private hudConfig: HUDConfig | null = null;
  private timerBarWidth = 0;
  private countdownText: Phaser.GameObjects.Text | null = null;

  private constructor() {}

  static getInstance(): UIManager {
    if (!UIManager._instance) {
      UIManager._instance = new UIManager();
    }
    return UIManager._instance;
  }

  // ── HUD creation ──────────────────────────────────────────────────────────

  /**
   * Creates the entire HUD for the Gameplay scene.
   * Must be called once from Gameplay.create().
   */
  createHUD(config: HUDConfig): void {
    this.destroyHUD();
    this.hudConfig = config;

    const { scene, totalCandies, timeLimit } = config;
    const { width, height } = scene.scale;

    const hudH = Math.min(height * 0.10, 80);
    const pad = width * 0.04;
    const fs = Math.min(width, height) * 0.038;

    // Container at the top
    const container = scene.add.container(0, 0).setDepth(10);

    // ── Timer bar background ────────────────────────────────────────────────
    const barW = width - pad * 2;
    const barH = 8;
    const barY = hudH * 0.75;

    const timerBarBg = scene.add.rectangle(pad, barY, barW, barH, 0x2d1b69, 0.8)
      .setOrigin(0, 0.5);
    this.timerBarWidth = barW;

    const timerBar = scene.add.rectangle(pad, barY, barW, barH, 0x4ecdc4, 1)
      .setOrigin(0, 0.5);

    container.add([timerBarBg, timerBar]);

    // ── Score text ──────────────────────────────────────────────────────────
    const scoreText = scene.add.text(pad, hudH * 0.3, 'Score: 0', {
      fontFamily: '"Nunito", "Arial Rounded MT Bold", Arial',
      fontSize: `${fs}px`,
      color: COLOR_STR.CANDY_YELLOW,
      stroke: COLOR_STR.SHADOW,
      strokeThickness: 3,
    }).setOrigin(0, 0.5);
    container.add(scoreText);

    // ── Timer text ──────────────────────────────────────────────────────────
    const timerText = scene.add.text(width - pad, hudH * 0.3, `${timeLimit}s`, {
      fontFamily: '"Nunito", "Arial Rounded MT Bold", Arial',
      fontSize: `${fs}px`,
      color: COLOR_STR.UI_WHITE,
      stroke: COLOR_STR.SHADOW,
      strokeThickness: 3,
    }).setOrigin(1, 0.5);
    container.add(timerText);

    // ── Progress dots (one per candy) ──────────────────────────────────────
    const dotRadius = Math.min(10, width * 0.012);
    const dotSpacing = dotRadius * 2.8;
    const totalDotsW = totalCandies * dotSpacing;
    const dotStartX = width / 2 - totalDotsW / 2 + dotRadius;
    const dotY = hudH * 0.3;

    const progressDots: Phaser.GameObjects.Arc[] = [];
    for (let i = 0; i < totalCandies; i++) {
      const dot = scene.add.circle(dotStartX + i * dotSpacing, dotY, dotRadius, 0x4a1d96, 1)
        .setStrokeStyle(2, 0xa855f7);
      container.add(dot);
      progressDots.push(dot);
    }

    // ── Flavour text ────────────────────────────────────────────────────────
    const flavourText = scene.add.text(width / 2, hudH + 16, '', {
      fontFamily: '"Nunito", Arial',
      fontSize: `${fs * 0.7}px`,
      color: COLOR_STR.UI_GREY,
      align: 'center',
    }).setOrigin(0.5, 0);
    container.add(flavourText);

    this.hud = {
      container,
      scoreText,
      timerText,
      timerBar,
      timerBarBg,
      progressDots,
      flavourText,
    };
  }

  // ── HUD updates ───────────────────────────────────────────────────────────

  /** Updates the score display. Called by GameManager's SCORE_UPDATE event. */
  updateScore(score: number): void {
    if (!this.hud) return;
    this.hud.scoreText.setText(`${score.toLocaleString()}`);
  }

  /**
   * Updates the timer display and progress bar.
   * Switches to red/tension colours below the threshold.
   */
  updateTimer(secondsRemaining: number): void {
    if (!this.hud || !this.hudConfig) return;

    const { timeLimit } = this.hudConfig;
    const ratio = Math.max(0, secondsRemaining / timeLimit);
    const barW = this.timerBarWidth * ratio;

    this.hud.timerText.setText(`${secondsRemaining}s`);
    this.hud.timerBar.setSize(Math.max(0, barW), this.hud.timerBar.height);

    // Colour shift: green → yellow → red
    if (secondsRemaining <= GAMEPLAY_CONST.TENSION_THRESHOLD_SEC) {
      this.hud.timerBar.setFillStyle(0xff4757);
      this.hud.timerText.setStyle({ color: COLOR_STR.CANDY_RED });
      AudioManager.getInstance().startTension();
    } else if (secondsRemaining <= this.hudConfig.timeLimit * 0.4) {
      this.hud.timerBar.setFillStyle(0xffd700);
    } else {
      this.hud.timerBar.setFillStyle(0x4ecdc4);
    }

    // Countdown SFX for last 5 seconds
    if (secondsRemaining <= GAMEPLAY_CONST.TENSION_THRESHOLD_SEC && secondsRemaining > 0) {
      AudioManager.getInstance().playCountdown();
    }
  }

  /**
   * Marks a progress dot as completed (filled candy colour).
   * @param index - Zero-based candy index.
   * @param success - Whether the candy was successfully cut.
   */
  markProgressDot(index: number, success: boolean): void {
    if (!this.hud) return;
    const dot = this.hud.progressDots[index];
    if (!dot) return;

    dot.setFillStyle(success ? 0x4ecdc4 : 0xff4757);
    dot.setStrokeStyle(2, success ? 0x2db3a8 : 0xc43b30);

    // Pop animation
    if (this.hudConfig) {
      AnimationManager.getInstance().buttonPress(this.hudConfig.scene, dot);
    }
  }

  /** Updates the flavour text below the HUD. */
  setFlavourText(text: string): void {
    if (!this.hud) return;
    this.hud.flavourText.setText(text);
  }

  // ── Countdown ─────────────────────────────────────────────────────────────

  /**
   * Shows the 3-2-1-GO countdown overlay.
   * @param onComplete - Called when GO! disappears.
   */
  showCountdown(scene: Phaser.Scene, onComplete: () => void): void {
    const { width, height } = scene.scale;
    const fs = Math.min(width, height) * 0.22;

    const text = scene.add.text(width / 2, height / 2, '3', {
      fontFamily: '"Nunito", "Arial Rounded MT Bold", Arial',
      fontSize: `${fs}px`,
      color: COLOR_STR.CANDY_YELLOW,
      stroke: COLOR_STR.SHADOW,
      strokeThickness: 8,
    }).setOrigin(0.5).setDepth(20);

    this.countdownText = text;

    const counts = ['3', '2', '1', 'GO!'];
    let idx = 0;

    const step = (): void => {
      text.setText(counts[idx]);
      text.setScale(1.6).setAlpha(1);

      AudioManager.getInstance().playCountdown();

      scene.tweens.add({
        targets: text,
        scaleX: 1,
        scaleY: 1,
        alpha: idx < 3 ? 0.6 : 1,
        duration: 700,
        ease: 'Quad.easeOut',
        onComplete: () => {
          idx++;
          if (idx < counts.length) {
            step();
          } else {
            scene.tweens.add({
              targets: text,
              alpha: 0,
              scaleY: 0.5,
              duration: 300,
              ease: 'Quad.easeIn',
              onComplete: () => {
                text.destroy();
                this.countdownText = null;
                onComplete();
              },
            });
          }
        },
      });
    };

    step();
  }

  // ── Layout refresh ────────────────────────────────────────────────────────

  /** Re-positions HUD elements on resize. */
  refreshLayout(width: number, height: number): void {
    if (!this.hud || !this.hudConfig) return;

    const hudH = Math.min(height * 0.10, 80);
    const pad = width * 0.04;
    const fs = Math.min(width, height) * 0.038;
    const barW = width - pad * 2;

    this.timerBarWidth = barW;
    this.hud.timerBarBg.setPosition(pad, hudH * 0.75).setSize(barW, 8);
    this.hud.scoreText.setPosition(pad, hudH * 0.3).setFontSize(`${fs}px`);
    this.hud.timerText.setPosition(width - pad, hudH * 0.3).setFontSize(`${fs}px`);
    this.hud.flavourText.setPosition(width / 2, hudH + 16).setFontSize(`${fs * 0.7}px`);
  }

  // ── Destroy ───────────────────────────────────────────────────────────────

  destroyHUD(): void {
    if (this.hud) {
      this.hud.container.destroy(true);
      this.hud = null;
      this.hudConfig = null;
    }
    this.countdownText?.destroy();
    this.countdownText = null;
  }
}
