/**
 * @file Button.ts
 * @description Reusable candy-themed Phaser button component.
 *              Supports primary, secondary, and danger variants with
 *              hover/press animations, icons, and disabled state.
 */

import * as Phaser from 'phaser';
import { COLOR_STR, COLORS } from '../data/Constants';
import { AudioManager } from '../managers/AudioManager';
import { AnimationManager } from '../managers/AnimationManager';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';

export type ButtonConfig = {
  scene: Phaser.Scene;
  x: number;
  y: number;
  label: string;
  variant?: ButtonVariant;
  width?: number;
  height?: number;
  fontSize?: number;
  icon?: string;           // Emoji or single character prepended to label
  disabled?: boolean;
  onClick: () => void;
};

// ── Variant colour tables ──────────────────────────────────────────────────

const VARIANT_COLORS: Record<ButtonVariant, {
  bg: number; bgHover: number; bgPress: number; text: string; stroke: number;
}> = {
  primary: {
    bg: 0xa855f7,
    bgHover: 0xb96cff,
    bgPress: 0x8b3de3,
    text: COLOR_STR.UI_WHITE,
    stroke: 0x7c3aed,
  },
  secondary: {
    bg: 0x2d1b69,
    bgHover: 0x3d2880,
    bgPress: 0x1e1050,
    text: COLOR_STR.UI_WHITE,
    stroke: 0x4a1d96,
  },
  danger: {
    bg: 0xff4757,
    bgHover: 0xff6270,
    bgPress: 0xe0303f,
    text: COLOR_STR.UI_WHITE,
    stroke: 0xc43040,
  },
  ghost: {
    bg: 0x000000,
    bgHover: 0x1a0a2e,
    bgPress: 0x0d0520,
    text: COLOR_STR.CANDY_PINK,
    stroke: 0xff6b9d,
  },
};

// ---------------------------------------------------------------------------
// Button class
// ---------------------------------------------------------------------------

export class Button {
  readonly container: Phaser.GameObjects.Container;

  private bg: Phaser.GameObjects.Graphics;
  private label: Phaser.GameObjects.Text;
  private hitArea: Phaser.GameObjects.Rectangle;
  private shimmer: Phaser.GameObjects.Graphics;

  private readonly cfg: Required<Omit<ButtonConfig, 'onClick'>> & { onClick: () => void };
  private isDisabled: boolean;
  private isHovered = false;
  private anim = AnimationManager.getInstance();

  constructor(config: ButtonConfig) {
    const defaults = {
      variant: 'primary' as ButtonVariant,
      width: 280,
      height: 64,
      fontSize: 22,
      icon: '',
      disabled: false,
    };

    this.cfg = { ...defaults, ...config };
    this.isDisabled = this.cfg.disabled;

    const { scene, x, y } = this.cfg;
    this.container = scene.add.container(x, y);

    // ── Background ────────────────────────────────────────────────────────
    this.bg = scene.add.graphics();
    this.shimmer = scene.add.graphics();

    // ── Label ─────────────────────────────────────────────────────────────
    const labelText = this.cfg.icon
      ? `${this.cfg.icon}  ${this.cfg.label}`
      : this.cfg.label;

    this.label = scene.add.text(0, 0, labelText, {
      fontFamily: '"Nunito", "Arial Rounded MT Bold", Arial',
      fontSize: `${this.cfg.fontSize}px`,
      color: VARIANT_COLORS[this.cfg.variant].text,
      fontStyle: 'bold',
    }).setOrigin(0.5);

    // ── Hit area (invisible, larger than visual for touch comfort) ─────────
    this.hitArea = scene.add.rectangle(
      0, 0,
      this.cfg.width + 16,
      this.cfg.height + 16,
      0x000000, 0
    ).setInteractive({ useHandCursor: !this.isDisabled });

    this.container.add([this.bg, this.shimmer, this.label, this.hitArea]);

    this.drawBg(false, false);
    this.registerEvents();
  }

  // ── Public API ────────────────────────────────────────────────────────────

  setDisabled(disabled: boolean): this {
    this.isDisabled = disabled;
    this.hitArea.input!.cursor = disabled ? '' : 'pointer';
    this.label.setAlpha(disabled ? 0.4 : 1);
    this.bg.setAlpha(disabled ? 0.5 : 1);
    return this;
  }

  setLabel(text: string): this {
    const labelText = this.cfg.icon ? `${this.cfg.icon}  ${text}` : text;
    this.label.setText(labelText);
    return this;
  }

  setPosition(x: number, y: number): this {
    this.container.setPosition(x, y);
    return this;
  }

  setScale(s: number): this {
    this.container.setScale(s);
    return this;
  }

  destroy(): void {
    this.container.destroy(true);
  }

  // ── Drawing ───────────────────────────────────────────────────────────────

  private drawBg(hovered: boolean, pressed: boolean): void {
    const { width, height, variant } = this.cfg;
    const colors = VARIANT_COLORS[variant];
    const w = width;
    const h = height;
    const r = h / 2;  // Pill-shaped corners

    const bgColor = pressed ? colors.bgPress : hovered ? colors.bgHover : colors.bg;

    this.bg.clear();

    // Drop shadow
    this.bg.fillStyle(0x000000, 0.3);
    this.bg.fillRoundedRect(-w / 2 + 2, -h / 2 + 4, w, h, r);

    // Button body
    this.bg.fillStyle(bgColor, 1);
    this.bg.fillRoundedRect(-w / 2, -h / 2, w, h, r);

    // Stroke
    this.bg.lineStyle(2, colors.stroke, 0.8);
    this.bg.strokeRoundedRect(-w / 2, -h / 2, w, h, r);

    // Top highlight (gloss)
    if (!pressed) {
      this.shimmer.clear();
      this.shimmer.fillStyle(0xffffff, 0.12);
      this.shimmer.fillRoundedRect(-w / 2 + 4, -h / 2 + 2, w - 8, h * 0.45, { tl: r, tr: r, bl: 0, br: 0 });
    } else {
      this.shimmer.clear();
    }
  }

  // ── Events ────────────────────────────────────────────────────────────────

  private registerEvents(): void {
    const { scene } = this.cfg;

    this.hitArea.on('pointerover', () => {
      if (this.isDisabled) return;
      this.isHovered = true;
      this.drawBg(true, false);
      this.anim.buttonHoverIn(scene, this.container);
    });

    this.hitArea.on('pointerout', () => {
      if (this.isDisabled) return;
      this.isHovered = false;
      this.drawBg(false, false);
      this.anim.buttonHoverOut(scene, this.container);
    });

    this.hitArea.on('pointerdown', () => {
      if (this.isDisabled) return;
      this.drawBg(this.isHovered, true);
      this.anim.buttonPress(scene, this.container);
      AudioManager.getInstance().playButton();
    });

    this.hitArea.on('pointerup', () => {
      if (this.isDisabled) return;
      this.drawBg(this.isHovered, false);
      this.cfg.onClick();
    });
  }
}
