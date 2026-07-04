/**
 * @file Gameplay.ts
 * @description Core gameplay loop coordinating pin dragging, cut validations,
 *              candy breaking/splitting visual FX, and HUD managers.
 */

import { Scene } from 'phaser';
import { SCENE_KEYS, EVENTS, COLORS, AUDIO_KEYS } from '../data/Constants';
import type { Difficulty } from '../data/Constants';
import { BackgroundRenderer } from '../textures/BackgroundRenderer';
import { GameManager } from '../managers/GameManager';
import { StorageManager } from '../managers/StorageManager';
import { UIManager } from '../managers/UIManager';
import { CandyFactory } from '../gameplay/CandyFactory';
import { CandyShapeRenderer } from '../textures/CandyShapeRenderer';
import { PinController } from '../gameplay/PinController';
import { CutValidator } from '../gameplay/CutValidator';
import { CandyBreaker } from '../gameplay/CandyBreaker';
import { AudioManager } from '../managers/AudioManager';
import { InputManager } from '../managers/InputManager';
import { FloatingText } from '../ui/FloatingText';
import { Button } from '../ui/Button';

export class Gameplay extends Scene {
  private bgGraphics!: Phaser.GameObjects.Graphics;
  private candyGraphics!: Phaser.GameObjects.Graphics;
  
  private pinController!: PinController;
  private activeValidator: CutValidator | null = null;
  private activeGeometry: any = null;

  // Level modes
  private chosenDifficulty: Difficulty = 'easy';
  private isDailyChallenge = false;
  
  // Pause controls
  private pauseButton!: Button;
  private isRoundOver = false;

  constructor() {
    super(SCENE_KEYS.GAMEPLAY);
  }

  init(data: { difficulty?: Difficulty; isDailyChallenge?: boolean }): void {
    this.chosenDifficulty = data.difficulty ?? 'easy';
    this.isDailyChallenge = data.isDailyChallenge ?? false;
    this.isRoundOver = false;
  }

  create(): void {
    const { width, height } = this.scale;

    // Check tutorial state on first time
    const storage = StorageManager.getInstance();
    if (!this.isDailyChallenge && !storage.hasTutorialBeenShown()) {
      this.scene.start(SCENE_KEYS.TUTORIAL, { difficulty: this.chosenDifficulty });
      return;
    }

    // Grid backdrop
    this.bgGraphics = this.add.graphics();
    BackgroundRenderer.drawBackground(this.bgGraphics, width, height);

    this.candyGraphics = this.add.graphics();

    // Start background music loop
    AudioManager.getInstance().playMusic(AUDIO_KEYS.MUSIC_GAMEPLAY);

    // Initialize Game state manager
    const gameMgr = GameManager.getInstance();
    gameMgr.startSession(this, this.chosenDifficulty);

    // Initial HUD layout setup
    UIManager.getInstance().createHUD({
      scene: this,
      totalCandies: gameMgr.totalCandies,
      timeLimit: gameMgr.timeRemaining,
      difficulty: this.chosenDifficulty
    });

    // Interactive needle pin
    this.pinController = new PinController(this, this.events);

    // Attach gestures
    InputManager.getInstance().registerGameplayInput(this);

    // Pause HUD button (top right)
    this.pauseButton = new Button({
      scene: this,
      x: width - 80,
      y: height * 0.92,
      label: 'Quit',
      variant: 'danger',
      width: 110,
      height: 40,
      fontSize: 14,
      onClick: () => {
        AudioManager.getInstance().stopMusic();
        this.scene.start(SCENE_KEYS.MAIN_MENU);
      }
    });

    // Start round countdown
    UIManager.getInstance().showCountdown(this, () => {
      gameMgr.beginPlay();
      this.spawnNextCandy();
    });

    this.registerGameEventListeners();
    this.scale.on('resize', this.onResize, this);
    AnimationManager.getInstance().fadeIn(this, 300);
  }

  private spawnNextCandy(): void {
    if (this.isRoundOver) return;

    const gameMgr = GameManager.getInstance();
    const candyType = gameMgr.getCurrentCandyType();
    if (!candyType) return;

    const { width, height } = this.scale;
    const candySize = Math.min(width * 0.62, 300);

    // Reposition coordinates dynamically
    const geom = CandyFactory.getInstance().getGeometry(
      candyType,
      width / 2,
      height * 0.48,
      candySize
    );

    this.activeGeometry = geom;

    // Draw the procedural candy body details
    CandyShapeRenderer.drawCandy(this.candyGraphics, geom, true);
    
    // Set instruction text below HUD
    UIManager.getInstance().setFlavourText(`Shape: ${geom.shapeDef.name} — ${geom.shapeDef.flavourText}`);

    // Drop candy in with nice bounce entrance
    this.candyGraphics.y = -100;
    this.pinController.hide();
    
    this.tweens.killTweensOf(this.candyGraphics);
    
    AnimationManager.getInstance().candyEntrance(this, this.candyGraphics, 0, () => {
      // Place the interactive Pin needle at the start position
      this.pinController.presentForCandy(geom.shapeDef, geom.bounds);
      
      const config = gameMgr.getConfig();
      this.activeValidator = new CutValidator(
        geom.shapeDef,
        geom.bounds,
        config.toleranceMultiplier,
        config.completionThreshold
      );
    });
  }

  private registerGameEventListeners(): void {
    const gameMgr = GameManager.getInstance();

    // Track path changes
    this.events.on(EVENTS.PIN_DRAG_MOVE, (pt: { x: number; y: number }) => {
      if (!this.activeValidator || this.isRoundOver) return;

      // Fail check on boundary trespass
      if (!this.activeValidator.isPointValid(pt.x, pt.y)) {
        this.pinController.showFail();
        gameMgr.recordCandyResult(0, false);
      }
    });

    // Track pointer lift
    this.events.on(EVENTS.PIN_DRAG_END, () => {
      if (!this.activeValidator || this.isRoundOver) return;

      const path = this.pinController.getDragPath();
      const validation = this.activeValidator.validate(path);

      if (validation.success) {
        this.pinController.showSuccess();
        gameMgr.recordCandyResult(validation.accuracy, true);
      } else {
        this.pinController.showFail();
        gameMgr.recordCandyResult(validation.accuracy, false);
      }
    });

    // Score / Progression
    this.events.on(EVENTS.SCORE_UPDATE, (score: number) => {
      UIManager.getInstance().updateScore(score);
    });

    this.events.on(EVENTS.TIMER_UPDATE, (secs: number) => {
      UIManager.getInstance().updateTimer(secs);
    });

    // Successful cut FX
    this.events.on(EVENTS.CANDY_SUCCESS, (res: { scoreEarned: number }) => {
      this.activeValidator = null;
      this.pinController.hide();
      AudioManager.getInstance().playSuccess();

      // Show floaty arcade points text
      FloatingText.spawn({
        scene: this,
        x: this.scale.width / 2,
        y: this.scale.height * 0.4,
        text: `+${res.scoreEarned.toLocaleString()}`,
        color: '#ffd700'
      });

      // Split animation
      CandyBreaker.getInstance().splitCandy(this, this.activeGeometry, () => {
        this.candyGraphics.clear();
        UIManager.getInstance().markProgressDot(gameMgr.candyIndex - 1, true);
        
        // Spawn next candy automatically
        this.spawnNextCandy();
      });
    });

    // Failure break FX
    this.events.on(EVENTS.CANDY_FAIL, () => {
      this.activeValidator = null;
      this.pinController.hide();
      AudioManager.getInstance().playFail();
      AudioManager.getInstance().playCrackSound();

      FloatingText.spawn({
        scene: this,
        x: this.scale.width / 2,
        y: this.scale.height * 0.45,
        text: 'BROKEN!',
        color: '#ff4757'
      });

      // Shaking and shattering animation
      AnimationManager.getInstance().candyFailShake(this, this.candyGraphics, () => {
        CandyBreaker.getInstance().shatterCandy(this, this.activeGeometry, null, () => {
          this.candyGraphics.clear();
          UIManager.getInstance().markProgressDot(gameMgr.candyIndex - 1, false);

          // Spawn next candy automatically
          this.spawnNextCandy();
        });
      });
    });

    // Level finished listeners
    this.events.on(EVENTS.LEVEL_COMPLETE, (res: any) => {
      this.triggerRoundEnd(res);
    });

    this.events.on(EVENTS.LEVEL_FAILED, (res: any) => {
      this.triggerRoundEnd(res);
    });
  }

  private triggerRoundEnd(result: any): void {
    if (this.isRoundOver) return;
    this.isRoundOver = true;
    this.activeValidator = null;

    AudioManager.getInstance().stopMusic(100);

    // Confetti on clean win
    let confettiCleanup: (() => void) | null = null;
    if (result.candiesCut === result.candiesTotal) {
      AudioManager.getInstance().playVictory();
      AudioManager.getInstance().playConfetti();
      confettiCleanup = ParticleManager.getInstance().emitConfetti(this);
    }

    this.time.delayedCall(1600, () => {
      confettiCleanup?.();
      AnimationManager.getInstance().fadeOut(this, 300, () => {
        this.scene.start(SCENE_KEYS.RESULTS, { result });
      });
    });
  }

  private onResize(gameSize: Phaser.Structs.Size): void {
    const { width, height } = gameSize;
    this.cameras.resize(width, height);
    BackgroundRenderer.drawBackground(this.bgGraphics, width, height);

    this.pauseButton.setPosition(width - 80, height * 0.92);
    UIManager.getInstance().refreshLayout(width, height);

    if (this.activeGeometry) {
      const candySize = Math.min(width * 0.62, 300);
      const geom = CandyFactory.getInstance().getGeometry(
        this.activeGeometry.shapeDef.type,
        width / 2,
        height * 0.48,
        candySize
      );
      this.activeGeometry = geom;
      CandyShapeRenderer.drawCandy(this.candyGraphics, geom, true);
    }
  }

  shutdown(): void {
    this.events.off(EVENTS.PIN_DRAG_MOVE);
    this.events.off(EVENTS.PIN_DRAG_END);
    this.events.off(EVENTS.SCORE_UPDATE);
    this.events.off(EVENTS.TIMER_UPDATE);
    this.events.off(EVENTS.CANDY_SUCCESS);
    this.events.off(EVENTS.CANDY_FAIL);
    this.events.off(EVENTS.LEVEL_COMPLETE);
    this.events.off(EVENTS.LEVEL_FAILED);

    UIManager.getInstance().destroyHUD();
    InputManager.getInstance().removeListeners();
    this.pinController.destroy();
  }
}

