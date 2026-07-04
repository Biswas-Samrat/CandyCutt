/**
 * @file Tutorial.ts
 * @description First-time interactive training screen instructing users how to snip candies correctly.
 */

import { Scene } from 'phaser';
import { SCENE_KEYS, COLORS, COLOR_STR } from '../data/Constants';
import { BackgroundRenderer } from '../textures/BackgroundRenderer';
import { AnimationManager } from '../managers/AnimationManager';
import { StorageManager } from '../managers/StorageManager';
import { CandyFactory } from '../gameplay/CandyFactory';
import { CandyShapeRenderer } from '../textures/CandyShapeRenderer';
import { PinController } from '../gameplay/PinController';
import { CutValidator } from '../gameplay/CutValidator';
import { Button } from '../ui/Button';

export class Tutorial extends Scene {
  private bgGraphics!: Phaser.GameObjects.Graphics;
  private candyGraphics!: Phaser.GameObjects.Graphics;
  private headerText!: Phaser.GameObjects.Text;
  private descText!: Phaser.GameObjects.Text;
  
  private pinController!: PinController;
  private startDifficulty: string = 'easy';

  constructor() {
    super(SCENE_KEYS.TUTORIAL);
  }

  init(data: { difficulty?: string }): void {
    this.startDifficulty = data.difficulty ?? 'easy';
  }

  create(): void {
    const { width, height } = this.scale;

    this.bgGraphics = this.add.graphics();
    BackgroundRenderer.drawBackground(this.bgGraphics, width, height);

    // Title / Instructions
    this.headerText = this.add.text(width / 2, height * 0.12, 'HOW TO SNIP', {
      fontFamily: '"Nunito", "Arial Rounded MT Bold", Arial',
      fontSize: `${Math.min(width, height) * 0.056}px`,
      color: '#ff6b9d',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    this.descText = this.add.text(width / 2, height * 0.2, 'DRAG PIN FROM WHITE RING TO GOLD TARGET\nSTAY INSIDE THE SHAPE!', {
      fontFamily: '"Nunito", Arial',
      fontSize: '16px',
      color: COLOR_STR.UI_WHITE,
      align: 'center',
      lineSpacing: 8
    }).setOrigin(0.5);

    this.candyGraphics = this.add.graphics();

    // Create Pin needle controller
    this.pinController = new PinController(this, this.events);

    // Render simple bonbon candy in the center
    const size = Math.min(width * 0.58, 280);
    const geom = CandyFactory.getInstance().getGeometry('bonbon', width / 2, height * 0.5, size);
    
    CandyShapeRenderer.drawCandy(this.candyGraphics, geom, true);
    
    // Position pin needle at the beginning
    this.pinController.presentForCandy(geom.shapeDef, geom.bounds);

    // Register simple input listener constraint
    this.input.setDraggable(this.candyGraphics);
    
    // Track pointer actions
    const validator = new CutValidator(geom.shapeDef, geom.bounds, 1.5, 0.85);

    this.events.on('pin:dragmove', (pt: { x: number; y: number }) => {
      // Real-time fail check
      if (!validator.isPointValid(pt.x, pt.y)) {
        this.pinController.showFail();
        this.tweens.add({
          targets: this.descText,
          scaleX: 1.15,
          scaleY: 1.15,
          duration: 100,
          yoyo: true,
          onComplete: () => {
            this.descText.setText('OUT OF BOUNDS! Try again.');
          }
        });
        
        // Reset pin needle
        this.time.delayedCall(800, () => {
          this.descText.setText('DRAG PIN FROM WHITE RING TO GOLD TARGET\nSTAY INSIDE THE SHAPE!');
          this.pinController.presentForCandy(geom.shapeDef, geom.bounds);
        });
      }
    });

    this.events.on('pin:dragend', () => {
      const result = validator.validate(this.pinController.getDragPath());
      if (result.success) {
        this.pinController.showSuccess();
        this.descText.setText('SUCCESS! PREPARATION COMPLETE.');
        
        // Save tutorial completed flag
        StorageManager.getInstance().markTutorialShown();

        // Bottom continue button
        const startBtn = new Button({
          scene: this,
          x: width / 2,
          y: height * 0.82,
          label: 'Start Round',
          variant: 'primary',
          width: 220,
          onClick: () => {
            AnimationManager.getInstance().fadeOut(this, 300, () => {
              this.scene.start(SCENE_KEYS.GAMEPLAY, { difficulty: this.startDifficulty });
            });
          }
        });
        
        // Pulse continue button
        this.tweens.add({
          targets: startBtn.container,
          scaleX: 1.05,
          scaleY: 1.05,
          duration: 500,
          yoyo: true,
          repeat: -1
        });
      } else {
        this.pinController.showFail();
        this.descText.setText('Cut incomplete. Follow the guide line!');
        this.time.delayedCall(800, () => {
          this.descText.setText('DRAG PIN FROM WHITE RING TO GOLD TARGET\nSTAY INSIDE THE SHAPE!');
          this.pinController.presentForCandy(geom.shapeDef, geom.bounds);
        });
      }
    });

    this.scale.on('resize', this.onResize, this);
    AnimationManager.getInstance().fadeIn(this, 300);
  }

  private onResize(gameSize: Phaser.Structs.Size): void {
    const { width, height } = gameSize;
    this.cameras.resize(width, height);
    BackgroundRenderer.drawBackground(this.bgGraphics, width, height);

    this.headerText.setPosition(width / 2, height * 0.12).setFontSize(`${Math.min(width, height) * 0.056}px`);
    this.descText.setPosition(width / 2, height * 0.2);
    
    // Refresh candy drawing
    const size = Math.min(width * 0.58, 280);
    const geom = CandyFactory.getInstance().getGeometry('bonbon', width / 2, height * 0.5, size);
    CandyShapeRenderer.drawCandy(this.candyGraphics, geom, true);
    
    this.pinController.presentForCandy(geom.shapeDef, geom.bounds);
  }

  shutdown(): void {
    this.events.off('pin:dragmove');
    this.events.off('pin:dragend');
    this.pinController.destroy();
  }
}
