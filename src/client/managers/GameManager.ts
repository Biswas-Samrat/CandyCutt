/**
 * @file GameManager.ts
 * @description Central state machine for a single gameplay session.
 *              Tracks difficulty, candy sequence, score, timer, and accuracy.
 *              Emits events on the global bus so UI, audio, and particles can react.
 */

import * as Phaser from 'phaser';
import {
  EVENTS,
  GAMEPLAY_CONST,
} from '../data/Constants';
import type { Difficulty } from '../data/Constants';
import { getLevelConfig } from '../data/LevelConfig';
import type { LevelConfig } from '../data/LevelConfig';
import type { CandyShapeType } from '../data/CandyShapes';
import { randomElement } from '../utils/MathUtils';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type RoundResult = {
  difficulty: Difficulty;
  score: number;
  candiesCut: number;
  candiesTotal: number;
  accuracy: number;         // 0–1
  timeRemaining: number;    // seconds
  isNewPersonalBest: boolean;
};

export type CandyResult = {
  shapeType: CandyShapeType;
  accuracy: number;
  scoreEarned: number;
  success: boolean;
};

type SessionState = {
  phase: 'idle' | 'countdown' | 'playing' | 'candy_feedback' | 'complete';
  difficulty: Difficulty;
  config: LevelConfig;
  candySequence: CandyShapeType[];
  candyIndex: number;
  score: number;
  timeRemaining: number;
  candyResults: CandyResult[];
};

// ---------------------------------------------------------------------------
// GameManager (singleton)
// ---------------------------------------------------------------------------

export class GameManager {
  private static _instance: GameManager | null = null;

  private eventBus!: Phaser.Events.EventEmitter;
  private timerEvent: Phaser.Time.TimerEvent | null = null;
  private scene: Phaser.Scene | null = null;

  private state: SessionState = {
    phase: 'idle',
    difficulty: 'easy',
    config: getLevelConfig('easy'),
    candySequence: [],
    candyIndex: 0,
    score: 0,
    timeRemaining: 60,
    candyResults: [],
  };

  private constructor() {}

  // ── Singleton ─────────────────────────────────────────────────────────────

  static getInstance(): GameManager {
    if (!GameManager._instance) {
      GameManager._instance = new GameManager();
    }
    return GameManager._instance;
  }

  static init(eventBus: Phaser.Events.EventEmitter): GameManager {
    const instance = GameManager.getInstance();
    instance.eventBus = eventBus;
    return instance;
  }

  // ── Session lifecycle ─────────────────────────────────────────────────────

  /**
   * Starts a new gameplay session with the given difficulty.
   * Builds the candy sequence, resets score, starts the timer.
   *
   * @param scene  - The Gameplay scene (needed for time events).
   * @param difficulty - The chosen difficulty.
   * @param customSequence - Optional fixed sequence (e.g. daily challenge).
   */
  startSession(
    scene: Phaser.Scene,
    difficulty: Difficulty,
    customSequence?: CandyShapeType[]
  ): void {
    this.scene = scene;
    const config = getLevelConfig(difficulty);

    const sequence = customSequence ?? this.buildSequence(config);

    this.state = {
      phase: 'countdown',
      difficulty,
      config,
      candySequence: sequence,
      candyIndex: 0,
      score: 0,
      timeRemaining: config.timeLimit,
      candyResults: [],
    };
  }

  /**
   * Called by the Gameplay scene once the countdown finishes.
   * Starts the timer and transitions to 'playing'.
   */
  beginPlay(): void {
    if (!this.scene || this.state.phase !== 'countdown') return;

    this.state = { ...this.state, phase: 'playing' };

    this.timerEvent = this.scene.time.addEvent({
      delay: 1000,
      repeat: this.state.config.timeLimit - 1,
      callback: this.onTimerTick,
      callbackScope: this,
    });
  }

  /**
   * Records the result of a candy cut attempt.
   * Handles score calculation, advances to the next candy or ends the round.
   */
  recordCandyResult(accuracy: number, success: boolean): void {
    if (this.state.phase !== 'playing') return;

    this.state = { ...this.state, phase: 'candy_feedback' };

    const current = this.state.candySequence[this.state.candyIndex];
    const scoreEarned = success ? this.calculateScore(accuracy) : 0;

    const result: CandyResult = {
      shapeType: current,
      accuracy,
      scoreEarned,
      success,
    };

    const newScore = this.state.score + scoreEarned;
    const newResults = [...this.state.candyResults, result];

    this.state = {
      ...this.state,
      score: newScore,
      candyResults: newResults,
    };

    this.eventBus.emit(EVENTS.SCORE_UPDATE, newScore);

    if (success) {
      this.eventBus.emit(EVENTS.CANDY_SUCCESS, result);
    } else {
      this.eventBus.emit(EVENTS.CANDY_FAIL, result);
    }

    const delay = success ? GAMEPLAY_CONST.SUCCESS_HOLD_MS : GAMEPLAY_CONST.FAIL_HOLD_MS;
    this.scene?.time.delayedCall(delay, () => { this.advanceCandy(); });
  }

  /** Manually ends the session early (e.g. time expired from timer). */
  endSession(): void {
    this.stopTimer();
    const isTimeout = this.state.phase === 'playing' || this.state.phase === 'candy_feedback';
    this.state = { ...this.state, phase: 'complete' };

    const result = this.buildRoundResult();
    this.eventBus.emit(isTimeout ? EVENTS.LEVEL_FAILED : EVENTS.LEVEL_COMPLETE, result);
  }

  // ── State accessors ───────────────────────────────────────────────────────

  get phase(): SessionState['phase'] { return this.state.phase; }
  get difficulty(): Difficulty { return this.state.difficulty; }
  get score(): number { return this.state.score; }
  get timeRemaining(): number { return this.state.timeRemaining; }
  get candyIndex(): number { return this.state.candyIndex; }
  get totalCandies(): number { return this.state.config.candyCount; }
  get candiesSuccessful(): number { return this.state.candyResults.filter((r) => r.success).length; }

  getCurrentCandyType(): CandyShapeType | null {
    if (this.state.candyIndex >= this.state.candySequence.length) return null;
    return this.state.candySequence[this.state.candyIndex];
  }

  getProgress(): number {
    return this.state.candyIndex / this.state.config.candyCount;
  }

  getConfig(): Readonly<LevelConfig> {
    return this.state.config;
  }

  getRoundResult(): Readonly<RoundResult> {
    return this.buildRoundResult();
  }

  // ── Internal helpers ──────────────────────────────────────────────────────

  private onTimerTick(): void {
    const newTime = Math.max(0, this.state.timeRemaining - 1);
    this.state = { ...this.state, timeRemaining: newTime };
    this.eventBus.emit(EVENTS.TIMER_UPDATE, newTime);

    if (newTime === 0) {
      this.eventBus.emit(EVENTS.TIMER_EXPIRED);
      this.endSession();
    }
  }

  private advanceCandy(): void {
    const nextIndex = this.state.candyIndex + 1;

    if (nextIndex >= this.state.config.candyCount) {
      // All candies done — complete the level
      this.stopTimer();
      this.state = { ...this.state, candyIndex: nextIndex, phase: 'complete' };
      const result = this.buildRoundResult();
      this.eventBus.emit(EVENTS.LEVEL_COMPLETE, result);
    } else {
      this.state = { ...this.state, candyIndex: nextIndex, phase: 'playing' };
      // The Gameplay scene listens for SCORE_UPDATE to know to spawn next candy.
      // We nudge it by re-emitting the current candy index via score event.
      this.eventBus.emit(EVENTS.SCORE_UPDATE, this.state.score);
    }
  }

  private stopTimer(): void {
    if (this.timerEvent) {
      this.timerEvent.remove(false);
      this.timerEvent = null;
    }
  }

  private buildSequence(config: LevelConfig): CandyShapeType[] {
    const pool = [...config.shapePool];
    const seq: CandyShapeType[] = [];
    for (let i = 0; i < config.candyCount; i++) {
      seq.push(randomElement(pool));
    }
    return seq;
  }

  private calculateScore(accuracy: number): number {
    const base = GAMEPLAY_CONST.SCORE_BASE;
    const accuracyBonus = Math.max(0, (accuracy - GAMEPLAY_CONST.MIN_SUCCESS_ACCURACY) * 100) *
      GAMEPLAY_CONST.SCORE_ACCURACY_BONUS;
    const timeBonus = this.state.timeRemaining * GAMEPLAY_CONST.SCORE_TIME_BONUS;
    const raw = (base + accuracyBonus + timeBonus) * this.state.config.scoreMultiplier;
    return Math.round(raw);
  }

  private buildRoundResult(): RoundResult {
    const results = this.state.candyResults;
    const successful = results.filter((r) => r.success);
    const avgAccuracy = results.length > 0
      ? results.reduce((sum, r) => sum + r.accuracy, 0) / results.length
      : 0;

    return {
      difficulty: this.state.difficulty,
      score: this.state.score,
      candiesCut: successful.length,
      candiesTotal: this.state.config.candyCount,
      accuracy: avgAccuracy,
      timeRemaining: this.state.timeRemaining,
      isNewPersonalBest: false, // StorageManager sets this after comparing
    };
  }
}
