/**
 * @file MainMenu.ts
 * @description Main Menu hub featuring dynamic candy animations, background tunes on first gesture,
 *              difficulty selections, achievements checklist overlays, settings modals, and daily challenges.
 */

import { Scene } from 'phaser';
import { SCENE_KEYS, COLORS, COLOR_STR, AUDIO_KEYS } from '../data/Constants';
import { BackgroundRenderer } from '../textures/BackgroundRenderer';
import { AnimationManager } from '../managers/AnimationManager';
import { AudioManager } from '../managers/AudioManager';
import { StorageManager } from '../managers/StorageManager';
import { Button } from '../ui/Button';
import { PopupPanel } from '../ui/PopupPanel';
import { ACHIEVEMENTS } from '../data/AchievementData';

export class MainMenu extends Scene {
  private bgGraphics!: Phaser.GameObjects.Graphics;
  private logoTitle!: Phaser.GameObjects.Text;
  
  // Decorative items
  private floatingCandies: Phaser.GameObjects.Arc[] = [];
  private buttons: Button[] = [];
  
  // User status streak indicators
  private streakIndicator!: Phaser.GameObjects.Container;

  constructor() {
    super(SCENE_KEYS.MAIN_MENU);
  }

  create(): void {
    const { width, height } = this.scale;

    // Start background music loop (if permitted by interaction state)
    AudioManager.getInstance().playMusic(AUDIO_KEYS.MUSIC_MENU, 800);

    // Grid Gradient
    this.bgGraphics = this.add.graphics();
    BackgroundRenderer.drawBackground(this.bgGraphics, width, height);

    // Decorative floating candies
    this.createDecorations();

    // Streaks display
    this.createStreakBadge();

    // Centered Title
    this.logoTitle = this.add.text(width / 2, height * 0.18, 'CANDY SNIP\nSAGA', {
      fontFamily: '"Nunito", "Arial Rounded MT Bold", Arial',
      fontSize: `${Math.min(width, height) * 0.088}px`,
      color: '#ff6b9d',
      align: 'center',
      fontStyle: 'bold',
      stroke: '#ffffff',
      strokeThickness: 5
    }).setOrigin(0.5);

    // Build the main action menu button sheet
    this.buildMenuButtons();

    this.scale.on('resize', this.onResize, this);
    AnimationManager.getInstance().fadeIn(this, 300);
  }

  private createDecorations(): void {
    const { width, height } = this.scale;
    const colors = [COLORS.CANDY_PINK, COLORS.CANDY_PURPLE, COLORS.CANDY_YELLOW, COLORS.CANDY_MINT];

    for (let i = 0; i < 6; i++) {
      const radius = 24 + Math.random() * 20;
      const x = 50 + Math.random() * (width - 100);
      const y = 80 + Math.random() * (height - 160);
      
      const col = colors[i % colors.length];
      const candy = this.add.circle(x, y, radius, col, 0.4);
      candy.setStrokeStyle(3, 0xffffff, 0.6);
      
      this.floatingCandies.push(candy);
      AnimationManager.getInstance().menuFloatCandy(this, candy, i * 200, 15 + Math.random() * 15);
      AnimationManager.getInstance().idleRotate(this, candy, 3000 + i * 500, 10 + i * 2);
    }
  }

  private createStreakBadge(): void {
    const { width, height } = this.scale;
    const storage = StorageManager.getInstance();
    const streak = storage.getLoginStreak();

    this.streakIndicator = this.add.container(width / 2, height * 0.28).setDepth(5);
    
    if (streak > 0) {
      const badgeBg = this.add.graphics();
      badgeBg.fillStyle(0x000000, 0.4);
      badgeBg.fillRoundedRect(-120, -20, 240, 40, 20);
      badgeBg.lineStyle(1.5, COLORS.CANDY_YELLOW, 0.7);
      badgeBg.strokeRoundedRect(-120, -20, 240, 40, 20);

      const streakText = this.add.text(0, 0, `🔥 Streak: ${streak} Days!`, {
        fontFamily: '"Nunito", Arial',
        fontSize: '18px',
        color: '#ffd700',
        fontStyle: 'bold'
      }).setOrigin(0.5);

      this.streakIndicator.add([badgeBg, streakText]);
    }
  }

  private buildMenuButtons(): void {
    const { width, height } = this.scale;
    const btnW = Math.min(width * 0.72, 320);
    const startY = height * 0.38;
    const step = height * 0.095;

    // Play Button
    const playBtn = new Button({
      scene: this,
      x: width / 2,
      y: startY,
      label: 'Play Game',
      width: btnW,
      variant: 'primary',
      icon: '🎮',
      onClick: () => {
        AnimationManager.getInstance().fadeOut(this, 300, () => {
          this.scene.start(SCENE_KEYS.LEVEL_SELECT);
        });
      }
    });

    // Daily Challenge
    const dailyBtn = new Button({
      scene: this,
      x: width / 2,
      y: startY + step,
      label: 'Daily Challenge',
      width: btnW,
      variant: 'primary',
      icon: '📅',
      onClick: () => this.launchDailyChallenge()
    });

    // Leaderboards
    const leaderBtn = new Button({
      scene: this,
      x: width / 2,
      y: startY + step * 2,
      label: 'Leaderboards',
      width: btnW,
      variant: 'secondary',
      icon: '🏆',
      onClick: () => {
        AnimationManager.getInstance().fadeOut(this, 300, () => {
          this.scene.start(SCENE_KEYS.LEADERBOARD);
        });
      }
    });

    // Achievements checklist popup
    const achieveBtn = new Button({
      scene: this,
      x: width / 2,
      y: startY + step * 3,
      label: 'Achievements',
      width: btnW,
      variant: 'secondary',
      icon: '🏅',
      onClick: () => this.showAchievements()
    });

    // Settings popup panel
    const settingsBtn = new Button({
      scene: this,
      x: width / 2,
      y: startY + step * 4,
      label: 'Settings',
      width: btnW,
      variant: 'secondary',
      icon: '⚙️',
      onClick: () => this.showSettings()
    });

    // Guide page
    const guideBtn = new Button({
      scene: this,
      x: width / 2,
      y: startY + step * 5,
      label: 'How to Play',
      width: btnW,
      variant: 'ghost',
      icon: '❓',
      onClick: () => this.showTutorialOverlay()
    });

    this.buttons.push(playBtn, dailyBtn, leaderBtn, achieveBtn, settingsBtn, guideBtn);
  }

  private launchDailyChallenge(): void {
    const storage = StorageManager.getInstance();
    if (storage.isDailyChallengeCompleted()) {
      // Prompt user challenge was already cleared
      const popup = new PopupPanel({
        scene: this,
        title: 'Daily Cleared',
        width: 420,
        height: 280
      });
      const alertMsg = this.add.text(0, -20, 'You already cleared today\'s\nDaily Challenge! Check back tomorrow.', {
        fontFamily: '"Nunito", Arial',
        fontSize: '18px',
        color: COLOR_STR.UI_WHITE,
        align: 'center'
      }).setOrigin(0.5);
      popup.add(alertMsg);
      return;
    }

    // Launch daily challenge sequence
    AnimationManager.getInstance().fadeOut(this, 300, () => {
      // Send daily challenge mode flag
      this.scene.start(SCENE_KEYS.GAMEPLAY, { isDailyChallenge: true });
    });
  }

  private showAchievements(): void {
    const popup = new PopupPanel({
      scene: this,
      title: 'Achievements',
      width: 480,
      height: 600
    });

    const storage = StorageManager.getInstance();
    const listContainer = this.add.container(0, -160);
    popup.add(listContainer);

    // List top 5 achievements
    ACHIEVEMENTS.slice(0, 5).forEach((def, index) => {
      const isUnlocked = storage.isAchievementUnlocked(def.id);
      const icon = isUnlocked ? def.icon : '🔒';
      const label = isUnlocked ? def.name : 'Hidden Achievement';
      const descText = isUnlocked ? def.description : 'Keep playing to unlock!';
      const color = isUnlocked ? COLOR_STR.CANDY_MINT : '#8b7fb8';

      const itemBg = this.add.graphics();
      itemBg.fillStyle(COLORS.BG_DARK, 0.6);
      itemBg.fillRoundedRect(-200, index * 65 - 15, 400, 55, 8);

      const title = this.add.text(-180, index * 65, `${icon} ${label}`, {
        fontFamily: '"Nunito", Arial',
        fontSize: '16px',
        color: color,
        fontStyle: 'bold'
      }).setOrigin(0, 0.5);

      const desc = this.add.text(-180, index * 65 + 18, descText, {
        fontFamily: '"Nunito", Arial',
        fontSize: '12px',
        color: COLOR_STR.UI_GREY
      }).setOrigin(0, 0.5);

      listContainer.add([itemBg, title, desc]);
    });
  }

  private showSettings(): void {
    const popup = new PopupPanel({
      scene: this,
      title: 'Settings',
      width: 420,
      height: 480
    });

    const storage = StorageManager.getInstance();
    const audio = AudioManager.getInstance();
    const currentSettings = storage.getSettings();

    const sliderContainer = this.add.container(0, -90);
    popup.add(sliderContainer);

    // Music Volume toggle button
    const musicBtn = new Button({
      scene: this,
      x: 0,
      y: 0,
      label: currentSettings.musicEnabled ? 'Music: ON' : 'Music: OFF',
      variant: currentSettings.musicEnabled ? 'primary' : 'secondary',
      width: 240,
      height: 48,
      onClick: () => {
        const next = !currentSettings.musicEnabled;
        currentSettings.musicEnabled = next;
        audio.setMusicEnabled(next);
        storage.saveSettings(currentSettings);
        musicBtn.setLabel(next ? 'Music: ON' : 'Music: OFF');
      }
    });

    // Sound FX Volume toggle button
    const sfxBtn = new Button({
      scene: this,
      x: 0,
      y: 70,
      label: currentSettings.sfxEnabled ? 'SFX: ON' : 'SFX: OFF',
      variant: currentSettings.sfxEnabled ? 'primary' : 'secondary',
      width: 240,
      height: 48,
      onClick: () => {
        const next = !currentSettings.sfxEnabled;
        currentSettings.sfxEnabled = next;
        audio.setSFXEnabled(next);
        storage.saveSettings(currentSettings);
        sfxBtn.setLabel(next ? 'SFX: ON' : 'SFX: OFF');
      }
    });

    sliderContainer.add([musicBtn.container, sfxBtn.container]);
  }

  private showTutorialOverlay(): void {
    const popup = new PopupPanel({
      scene: this,
      title: 'How to Play',
      width: 450,
      height: 520
    });

    const infoText = this.add.text(0, -110, 
      '1. Position the PIN needle at the\n   Start Indicator ring.\n\n' +
      '2. Drag along the guide path.\n\n' +
      '3. DO NOT drag outside the candy!\n\n' +
      '4. Reach the Target Zone to win.', {
      fontFamily: '"Nunito", Arial',
      fontSize: '18px',
      color: COLOR_STR.UI_WHITE,
      align: 'left',
      lineSpacing: 10
    }).setOrigin(0.5);

    popup.add(infoText);
  }

  private onResize(gameSize: Phaser.Structs.Size): void {
    const { width, height } = gameSize;
    this.cameras.resize(width, height);
    BackgroundRenderer.drawBackground(this.bgGraphics, width, height);

    this.logoTitle.setPosition(width / 2, height * 0.18).setFontSize(`${Math.min(width, height) * 0.088}px`);
    this.streakIndicator.setPosition(width / 2, height * 0.28);

    const btnW = Math.min(width * 0.72, 320);
    const startY = height * 0.38;
    const step = height * 0.095;

    this.buttons.forEach((btn, idx) => {
      btn.setPosition(width / 2, startY + step * idx);
    });
  }
}
