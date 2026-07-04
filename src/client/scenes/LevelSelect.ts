/**
 * @file LevelSelect.ts
 * @description Card selection panel for game difficulty levels (Easy, Medium, Hard).
 */

import { Scene } from 'phaser';
import { SCENE_KEYS, COLORS, COLOR_STR } from '../data/Constants';
import { BackgroundRenderer } from '../textures/BackgroundRenderer';
import { AnimationManager } from '../managers/AnimationManager';
import { Button } from '../ui/Button';
import { LEVEL_CONFIGS } from '../data/LevelConfig';
import type { Difficulty } from '../data/Constants';

export class LevelSelect extends Scene {
  private bgGraphics!: Phaser.GameObjects.Graphics;
  private headerText!: Phaser.GameObjects.Text;
  private levelCards: Phaser.GameObjects.Container[] = [];
  private backButton!: Button;

  constructor() {
    super(SCENE_KEYS.LEVEL_SELECT);
  }

  create(): void {
    const { width, height } = this.scale;

    this.bgGraphics = this.add.graphics();
    BackgroundRenderer.drawBackground(this.bgGraphics, width, height);

    this.headerText = this.add.text(width / 2, height * 0.12, 'CHOOSE DIFFICULTY', {
      fontFamily: '"Nunito", "Arial Rounded MT Bold", Arial',
      fontSize: `${Math.min(width, height) * 0.052}px`,
      color: '#ff6b9d',
      fontStyle: 'bold',
      stroke: '#ffffff',
      strokeThickness: 3
    }).setOrigin(0.5);

    this.buildLevelCards();

    // Bottom back button
    this.backButton = new Button({
      scene: this,
      x: width / 2,
      y: height * 0.88,
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

  private buildLevelCards(): void {
    const { width, height } = this.scale;
    const cardW = Math.min(width * 0.85, 420);
    const cardH = Math.min(height * 0.18, 140);
    const startY = height * 0.24;
    const spacing = cardH + height * 0.035;

    const list: Difficulty[] = ['easy', 'medium', 'hard'];

    // Destroy existing cards
    this.levelCards.forEach((c) => c.destroy());
    this.levelCards = [];

    list.forEach((diffKey, index) => {
      const cfg = LEVEL_CONFIGS[diffKey];
      const cardY = startY + index * spacing;
      
      const container = this.add.container(width / 2, cardY).setDepth(5);
      this.levelCards.push(container);

      // Card Background Glass Panel
      const cardBg = this.add.graphics();
      cardBg.fillStyle(COLORS.BG_MID, 0.9);
      cardBg.fillRoundedRect(-cardW / 2, -cardH / 2, cardW, cardH, 16);
      cardBg.lineStyle(2.5, Phaser.Display.Color.HexStringToColor(cfg.badgeColor).color, 0.85);
      cardBg.strokeRoundedRect(-cardW / 2, -cardH / 2, cardW, cardH, 16);

      // Shadow overlay
      cardBg.fillStyle(0x000000, 0.2);
      cardBg.fillRoundedRect(-cardW / 2 + 3, -cardH / 2 + 5, cardW, cardH, 16);

      // Difficulty Badge
      const diffTitle = this.add.text(-cardW / 2 + 25, -cardH / 2 + 22, `${cfg.emoji} ${cfg.label}`, {
        fontFamily: '"Nunito", "Arial Rounded MT Bold", Arial',
        fontSize: '22px',
        color: cfg.badgeColor,
        fontStyle: 'bold'
      }).setOrigin(0, 0.5);

      // Multiplier Label
      const multText = this.add.text(cardW / 2 - 25, -cardH / 2 + 22, `${cfg.scoreMultiplier}x Score`, {
        fontFamily: '"Nunito", Arial',
        fontSize: '15px',
        color: COLOR_STR.CANDY_YELLOW,
        fontStyle: 'bold'
      }).setOrigin(1, 0.5);

      // Description text
      const descText = this.add.text(-cardW / 2 + 25, cardH / 2 - 40, cfg.description, {
        fontFamily: '"Nunito", Arial',
        fontSize: '15px',
        color: COLOR_STR.UI_GREY
      }).setOrigin(0, 0.5);

      container.add([cardBg, diffTitle, multText, descText]);

      // Interactive hit area wrapper
      const hitArea = this.add.rectangle(0, 0, cardW, cardH, 0, 0)
        .setInteractive({ useHandCursor: true })
        .on('pointerover', () => {
          container.setScale(1.03);
          cardBg.lineStyle(3, Phaser.Display.Color.HexStringToColor(cfg.badgeColor).color, 1.0);
          cardBg.strokeRoundedRect(-cardW / 2, -cardH / 2, cardW, cardH, 16);
        })
        .on('pointerout', () => {
          container.setScale(1.0);
          cardBg.lineStyle(2.5, Phaser.Display.Color.HexStringToColor(cfg.badgeColor).color, 0.85);
          cardBg.strokeRoundedRect(-cardW / 2, -cardH / 2, cardW, cardH, 16);
        })
        .on('pointerdown', () => {
          AnimationManager.getInstance().buttonPress(this, container);
          this.time.delayedCall(120, () => {
            AnimationManager.getInstance().fadeOut(this, 300, () => {
              // Pass selected level details to Gameplay Scene
              this.scene.start(SCENE_KEYS.GAMEPLAY, { difficulty: diffKey });
            });
          });
        });
      container.add(hitArea);
    });
  }

  private onResize(gameSize: Phaser.Structs.Size): void {
    const { width, height } = gameSize;
    this.cameras.resize(width, height);
    BackgroundRenderer.drawBackground(this.bgGraphics, width, height);

    this.headerText.setPosition(width / 2, height * 0.12).setFontSize(`${Math.min(width, height) * 0.052}px`);
    this.backButton.setPosition(width / 2, height * 0.88);
    this.buildLevelCards();
  }
}
