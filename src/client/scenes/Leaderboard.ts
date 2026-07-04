/**
 * @file Leaderboard.ts
 * @description Tabbed leaderboard scene rendering global, weekly, and daily high score brackets.
 */

import { Scene } from 'phaser';
import { SCENE_KEYS, COLORS, COLOR_STR } from '../data/Constants';
import { BackgroundRenderer } from '../textures/BackgroundRenderer';
import { AnimationManager } from '../managers/AnimationManager';
import { LeaderboardManager } from '../managers/LeaderboardManager';
import type { LeaderboardTab } from '../managers/LeaderboardManager';
import { Button } from '../ui/Button';

export class Leaderboard extends Scene {
  private bgGraphics!: Phaser.GameObjects.Graphics;
  private headerText!: Phaser.GameObjects.Text;
  
  private activeTab: LeaderboardTab = 'global';
  private tabs: Record<LeaderboardTab, Button | null> = { global: null, daily: null, weekly: null };
  private listContainer!: Phaser.GameObjects.Container;
  private backButton!: Button;

  constructor() {
    super(SCENE_KEYS.LEADERBOARD);
  }

  create(): void {
    const { width, height } = this.scale;

    this.bgGraphics = this.add.graphics();
    BackgroundRenderer.drawBackground(this.bgGraphics, width, height);

    this.headerText = this.add.text(width / 2, height * 0.08, 'LEADERBOARDS', {
      fontFamily: '"Nunito", "Arial Rounded MT Bold", Arial',
      fontSize: `${Math.min(width, height) * 0.056}px`,
      color: '#ff6b9d',
      fontStyle: 'bold',
      stroke: '#ffffff',
      strokeThickness: 3
    }).setOrigin(0.5);

    // Score container positioning
    this.listContainer = this.add.container(width / 2, height * 0.26).setDepth(5);

    // Setup interactive category tabs
    this.buildTabs();

    // Load initial listings
    this.loadTab(this.activeTab);

    // Back to menu action
    this.backButton = new Button({
      scene: this,
      x: width / 2,
      y: height * 0.9,
      label: 'Back to Menu',
      variant: 'ghost',
      width: 200,
      onClick: () => {
        AnimationManager.getInstance().fadeOut(this, 300, () => {
          this.scene.start(SCENE_KEYS.MAIN_MENU);
        });
      }
    });

    this.scale.on('resize', this.onResize, this);
    AnimationManager.getInstance().fadeIn(this, 300);
  }

  private buildTabs(): void {
    const { width, height } = this.scale;
    const tabW = Math.min(width * 0.28, 120);
    const startX = width / 2;
    const tabY = height * 0.16;

    const list: LeaderboardTab[] = ['global', 'daily', 'weekly'];

    list.forEach((tabKey, idx) => {
      // Clean previous buttons if any
      this.tabs[tabKey]?.destroy();

      const offset = (idx - 1) * (tabW + 12);

      const tabBtn = new Button({
        scene: this,
        x: startX + offset,
        y: tabY,
        label: tabKey.toUpperCase(),
        variant: this.activeTab === tabKey ? 'primary' : 'secondary',
        width: tabW,
        height: 38,
        fontSize: 13,
        onClick: () => {
          if (this.activeTab === tabKey) return;
          this.activeTab = tabKey;
          this.buildTabs(); // Redraw status colors
          this.loadTab(tabKey);
        }
      });

      this.tabs[tabKey] = tabBtn;
    });
  }

  private async loadTab(tabKey: LeaderboardTab): Promise<void> {
    const { width, height } = this.scale;
    this.listContainer.removeAll(true);

    const loadingMsg = this.add.text(0, height * 0.2, 'Fetching rankings...', {
      fontFamily: '"Nunito", Arial',
      fontSize: '18px',
      color: COLOR_STR.CANDY_YELLOW
    }).setOrigin(0.5);
    this.listContainer.add(loadingMsg);

    const manager = LeaderboardManager.getInstance();
    const data = await manager.getLeaderboard(tabKey, true);
    
    loadingMsg.destroy();

    const entries = data.entries ?? [];
    if (entries.length === 0) {
      const emptyMsg = this.add.text(0, height * 0.2, 'No scores submitted yet.\nBe the first!', {
        fontFamily: '"Nunito", Arial',
        fontSize: '18px',
        color: COLOR_STR.UI_GREY,
        align: 'center'
      }).setOrigin(0.5);
      this.listContainer.add(emptyMsg);
      return;
    }

    const rowH = 46;
    const viewW = Math.min(width * 0.88, 440);

    // List top 10 rankings
    entries.slice(0, 10).forEach((entry, idx) => {
      const rowY = idx * rowH;

      const itemBg = this.add.graphics();
      itemBg.fillStyle(COLORS.BG_MID, 0.75);
      itemBg.fillRoundedRect(-viewW / 2, rowY - 18, viewW, rowH - 6, 8);
      itemBg.lineStyle(1.5, COLORS.BG_GLOW, 0.4);
      itemBg.strokeRoundedRect(-viewW / 2, rowY - 18, viewW, rowH - 6, 8);

      // Gold / Silver / Bronze styles for top 3
      let rankColor = COLOR_STR.UI_WHITE;
      if (idx === 0) rankColor = '#ffd700'; // Gold
      else if (idx === 1) rankColor = '#e0e0e0'; // Silver
      else if (idx === 2) rankColor = '#cd7f32'; // Bronze

      // Rank index
      const rankText = this.add.text(-viewW / 2 + 20, rowY + 2, `#${idx + 1}`, {
        fontFamily: '"Nunito", "Arial Rounded MT Bold", Arial',
        fontSize: '16px',
        color: rankColor,
        fontStyle: 'bold'
      }).setOrigin(0, 0.5);

      // Username
      const nameText = this.add.text(-viewW / 2 + 70, rowY + 2, entry.username, {
        fontFamily: '"Nunito", Arial',
        fontSize: '16px',
        color: COLOR_STR.UI_WHITE
      }).setOrigin(0, 0.5);

      // Score
      const scoreText = this.add.text(viewW / 2 - 20, rowY + 2, entry.score.toLocaleString(), {
        fontFamily: '"Nunito", Arial',
        fontSize: '16px',
        color: COLOR_STR.CANDY_YELLOW,
        fontStyle: 'bold'
      }).setOrigin(1, 0.5);

      this.listContainer.add([itemBg, rankText, nameText, scoreText]);
    });
  }

  private onResize(gameSize: Phaser.Structs.Size): void {
    const { width, height } = gameSize;
    this.cameras.resize(width, height);
    BackgroundRenderer.drawBackground(this.bgGraphics, width, height);

    this.headerText.setPosition(width / 2, height * 0.08).setFontSize(`${Math.min(width, height) * 0.056}px`);
    this.listContainer.setPosition(width / 2, height * 0.26);
    this.backButton.setPosition(width / 2, height * 0.9);
    
    this.buildTabs();
    this.loadTab(this.activeTab);
  }

  shutdown(): void {
    this.listContainer.removeAll(true);
  }
}
