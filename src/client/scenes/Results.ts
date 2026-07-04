/**
 * @file Results.ts
 * @description Round results details showing scores, accuracies, daily streaks,
 *              Reddit custom posts sharing triggers, and navigation controls.
 */

import { Scene } from 'phaser';
import { SCENE_KEYS, COLORS, COLOR_STR } from '../data/Constants';
import { BackgroundRenderer } from '../textures/BackgroundRenderer';
import { AnimationManager } from '../managers/AnimationManager';
import { StorageManager } from '../managers/StorageManager';
import { AchievementManager } from '../managers/AchievementManager';
import { PopupPanel } from '../ui/PopupPanel';
import { Button } from '../ui/Button';
import { getStarCount } from '../data/LevelConfig';
import { apiShare } from '../utils/DevvitBridge';

export class Results extends Scene {
  private bgGraphics!: Phaser.GameObjects.Graphics;
  private popupPanel!: PopupPanel;
  
  private resultData: any = null;
  private starIcons: Phaser.GameObjects.Image[] = [];

  constructor() {
    super(SCENE_KEYS.RESULTS);
  }

  init(data: { result: any }): void {
    this.resultData = data.result;
  }

  async create(): Promise<void> {
    const { width, height } = this.scale;

    this.bgGraphics = this.add.graphics();
    BackgroundRenderer.drawBackground(this.bgGraphics, width, height);

    // Save and submit scores in background
    const storage = StorageManager.getInstance();
    const prevBest = storage.getPersonalBest(this.resultData.difficulty);
    
    const entry = await storage.submitScore(
      this.resultData.score,
      this.resultData.difficulty,
      this.resultData.candiesCut,
      this.resultData.accuracy,
      this.resultData.timeRemaining
    );

    const isNewBest = this.resultData.score > prevBest;
    this.resultData.isNewPersonalBest = isNewBest;

    // Trigger post-game achievement criteria checks
    AchievementManager.getInstance().registerNotificationHandler((ach) => {
      // Trigger achievements toasts locally
      const alert = this.add.text(width / 2, height * 0.08, `🏆 Achievement Unlocked: ${ach.name}!`, {
        fontFamily: '"Nunito", Arial',
        fontSize: '18px',
        color: COLOR_STR.CANDY_YELLOW,
        stroke: '#000',
        strokeThickness: 3
      }).setOrigin(0.5).setDepth(25);
      
      this.tweens.add({
        targets: alert,
        y: height * 0.05,
        alpha: { from: 1, to: 0 },
        delay: 2000,
        duration: 800,
        onComplete: () => alert.destroy()
      });
    });

    this.showResultsModal(isNewBest, entry?.rank);

    this.scale.on('resize', this.onResize, this);
    AnimationManager.getInstance().fadeIn(this, 300);
  }

  private showResultsModal(isNewBest: boolean, globalRank?: number): void {
    const { width, height } = this.scale;
    const panelW = Math.min(width * 0.88, 460);
    const panelH = Math.min(height * 0.72, 600);

    const title = isNewBest ? '🎉 NEW PERSONAL BEST! 🎉' : 'ROUND RESULTS';

    this.popupPanel = new PopupPanel({
      scene: this,
      title,
      width: panelW,
      height: panelH,
      showCloseButton: false
    });

    const content = this.add.container(0, -panelH * 0.15);
    this.popupPanel.add(content);

    // Star rating POP animation
    const starCount = getStarCount(this.resultData.difficulty, this.resultData.score);
    this.buildStars(content, starCount);

    // Build stats content list
    const stats = [
      { label: 'Difficulty', val: this.resultData.difficulty.toUpperCase(), color: '#c084fc' },
      { label: 'Candies Cleared', val: `${this.resultData.candiesCut}/${this.resultData.candiesTotal}`, color: COLOR_STR.UI_WHITE },
      { label: 'Time Remaining', val: `${this.resultData.timeRemaining}s`, color: COLOR_STR.CANDY_MINT },
      { label: 'Avg Accuracy', val: `${Math.round(this.resultData.accuracy * 100)}%`, color: COLOR_STR.CANDY_YELLOW },
      { label: 'Final Score', val: this.resultData.score.toLocaleString(), color: '#ff6b9d' }
    ];

    if (globalRank !== undefined) {
      stats.push({ label: 'Global Rank', val: `#${globalRank}`, color: '#ffd700' });
    }

    stats.forEach((item, idx) => {
      const rowY = idx * 36 + 60;
      
      const labelText = this.add.text(-panelW * 0.35, rowY, item.label, {
        fontFamily: '"Nunito", Arial',
        fontSize: '16px',
        color: COLOR_STR.UI_GREY
      }).setOrigin(0, 0.5);

      const valText = this.add.text(panelW * 0.35, rowY, item.val, {
        fontFamily: '"Nunito", Arial',
        fontSize: '17px',
        color: item.color,
        fontStyle: 'bold'
      }).setOrigin(1, 0.5);

      content.add([labelText, valText]);
    });

    // ── Build Interactive Buttons ──────────────────────────────────────────
    const btnW = panelW * 0.72;
    const btnYStart = panelH * 0.25;

    // Retry/Play Again
    const playAgainBtn = new Button({
      scene: this,
      x: 0,
      y: btnYStart,
      label: 'Play Again',
      variant: 'primary',
      width: btnW,
      onClick: () => {
        this.popupPanel.dismiss();
        AnimationManager.getInstance().fadeOut(this, 300, () => {
          this.scene.start(SCENE_KEYS.GAMEPLAY, { difficulty: this.resultData.difficulty });
        });
      }
    });

    // Share Score on Reddit Post
    const shareBtn = new Button({
      scene: this,
      x: 0,
      y: btnYStart + 60,
      label: 'Share on Reddit',
      variant: 'secondary',
      width: btnW,
      onClick: () => this.shareScore()
    });

    // Leaderboards shortcut
    const leaderBtn = new Button({
      scene: this,
      x: 0,
      y: btnYStart + 120,
      label: 'Leaderboard',
      variant: 'secondary',
      width: btnW,
      onClick: () => {
        this.popupPanel.dismiss();
        AnimationManager.getInstance().fadeOut(this, 300, () => {
          this.scene.start(SCENE_KEYS.LEADERBOARD);
        });
      }
    });

    // Back to Menu
    const quitBtn = new Button({
      scene: this,
      x: 0,
      y: btnYStart + 180,
      label: 'Back to Menu',
      variant: 'ghost',
      width: btnW,
      onClick: () => {
        this.popupPanel.dismiss();
        AnimationManager.getInstance().fadeOut(this, 300, () => {
          this.scene.start(SCENE_KEYS.MAIN_MENU);
        });
      }
    });

    content.add([playAgainBtn.container, shareBtn.container, leaderBtn.container, quitBtn.container]);
  }

  private buildStars(container: Phaser.GameObjects.Container, starCount: number): void {
    const starSpacing = 50;
    const count = 3;

    for (let i = 0; i < count; i++) {
      const isFilled = i < starCount;
      const key = isFilled ? TEXTURE_KEYS_STAR_FULL() : TEXTURE_KEYS_STAR_EMPTY();
      
      const star = this.add.image((i - 1) * starSpacing, 0, key);
      star.setScale(0.85);
      container.add(star);
      this.starIcons.push(star);
    }

    AnimationManager.getInstance().animateStars(this, this.starIcons, starCount);
  }

  private async shareScore(): Promise<void> {
    try {
      const username = StorageManager.getInstance().getUsername();
      const title = `I cut ${this.resultData.candiesCut}/${this.resultData.candiesTotal} candies in Candy Snip Saga with ${Math.round(this.resultData.accuracy * 100)}% accuracy! Can you beat me?`;

      // Call server custom post sharing API
      const res = await apiShare({ title, score: this.resultData.score });

      // Notify user share success and prompt post URL
      FloatingText.spawn({
        scene: this,
        x: this.scale.width / 2,
        y: this.scale.height * 0.22,
        text: 'Post Shared Successfully!',
        color: COLOR_STR.CANDY_MINT
      });

      // Keep record of shared counts
      AchievementManager.getInstance().onShare();
    } catch (err) {
      console.warn('Failed to share score on Reddit:', err);
    }
  }

  private onResize(gameSize: Phaser.Structs.Size): void {
    const { width, height } = gameSize;
    this.cameras.resize(width, height);
    BackgroundRenderer.drawBackground(this.bgGraphics, width, height);

    this.popupPanel?.dismiss();
    this.showResultsModal(this.resultData.isNewPersonalBest);
  }

  shutdown(): void {
    this.starIcons = [];
  }
}

// Fallback texture triggers
function TEXTURE_KEYS_STAR_FULL(): any {
  return 'star-full';
}

function TEXTURE_KEYS_STAR_EMPTY(): any {
  return 'star-empty';
}
