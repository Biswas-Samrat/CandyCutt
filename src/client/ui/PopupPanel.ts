/**
 * @file PopupPanel.ts
 * @description A stylized glassmorphic modal overlay panel that slides in/out.
 *              Used for paused screens, settings, level results, and achievements list.
 */

import * as Phaser from 'phaser';
import { COLORS, COLOR_STR } from '../data/Constants';
import { Button } from './Button';
import { AnimationManager } from '../managers/AnimationManager';

export type PopupPanelConfig = {
  scene: Phaser.Scene;
  title: string;
  width?: number;
  height?: number;
  showCloseButton?: boolean;
  onClose?: () => void;
};

export class PopupPanel {
  readonly container: Phaser.GameObjects.Container;
  private overlay: Phaser.GameObjects.Rectangle;
  private background: Phaser.GameObjects.Graphics;
  private titleText: Phaser.GameObjects.Text;
  private closeButton: Button | null = null;

  private scene: Phaser.Scene;
  private targetY: number;
  private onCloseCallback?: () => void;

  constructor(config: PopupPanelConfig) {
    const {
      scene,
      title,
      width = 500,
      height = 650,
      showCloseButton = true,
      onClose
    } = config;

    this.scene = scene;
    this.targetY = scene.scale.height / 2;
    this.onCloseCallback = onClose;

    // Fullscreen semi-transparent backdrop overlay
    this.overlay = scene.add.rectangle(
      scene.scale.width / 2,
      scene.scale.height / 2,
      scene.scale.width,
      scene.scale.height,
      0x0a0518,
      0.65
    ).setDepth(20).setInteractive();

    // Popup container setup
    this.container = scene.add.container(scene.scale.width / 2, scene.scale.height / 2)
      .setDepth(21)
      .setAlpha(0);

    // Draw the rounded panel graphics
    this.background = scene.add.graphics();
    this.drawPanel(width, height);
    this.container.add(this.background);

    // Title label
    this.titleText = scene.add.text(0, -height / 2 + 50, title, {
      fontFamily: '"Nunito", "Arial Rounded MT Bold", Arial',
      fontSize: '36px',
      color: COLOR_STR.CANDY_YELLOW,
      stroke: COLOR_STR.SHADOW,
      strokeThickness: 5
    }).setOrigin(0.5);
    this.container.add(this.titleText);

    // Close button
    if (showCloseButton) {
      this.closeButton = new Button({
        scene,
        x: 0,
        y: height / 2 - 60,
        label: 'Close',
        variant: 'secondary',
        width: 180,
        height: 48,
        fontSize: 18,
        onClick: () => this.dismiss()
      });
      this.container.add(this.closeButton.container);
    }

    // Animate slide-in
    AnimationManager.getInstance().panelSlideIn(scene, this.container, this.targetY);
    scene.tweens.add({
      targets: this.overlay,
      alpha: { from: 0, to: 0.65 },
      duration: 300
    });
  }

  /**
   * Helper to draw a glassmorphism container panel with drop shadow.
   */
  private drawPanel(w: number, h: number): void {
    const r = 24; // Rounded corners radius
    this.background.clear();

    // Shadow
    this.background.fillStyle(0x000000, 0.4);
    this.background.fillRoundedRect(-w / 2 + 5, -h / 2 + 8, w, h, r);

    // Panel Body (Dark Indigo Glass)
    this.background.fillStyle(COLORS.BG_MID, 0.95);
    this.background.fillRoundedRect(-w / 2, -h / 2, w, h, r);

    // Stroke border (Bright Lavender)
    this.background.lineStyle(3, COLORS.CANDY_PURPLE, 0.85);
    this.background.strokeRoundedRect(-w / 2, -h / 2, w, h, r);

    // Subtle header separator line
    this.background.lineStyle(1.5, COLORS.BG_GLOW, 0.6);
    this.background.lineBetween(-w / 2 + 30, -h / 2 + 100, w / 2 - 30, -h / 2 + 100);
  }

  /**
   * Adds custom content gameobjects or panels inside this modal.
   */
  add(gameObject: Phaser.GameObjects.GameObject | Phaser.GameObjects.GameObject[]): void {
    this.container.add(gameObject);
  }

  /**
   * Slides the modal away and invokes completion callbacks.
   */
  dismiss(): void {
    AnimationManager.getInstance().panelSlideOut(this.scene, this.container, () => {
      this.overlay.destroy();
      this.container.destroy(true);
      this.closeButton?.destroy();
      this.onCloseCallback?.();
    });

    this.scene.tweens.add({
      targets: this.overlay,
      alpha: 0,
      duration: 250
    });
  }
}
