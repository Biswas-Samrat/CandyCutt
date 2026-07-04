/**
 * @file AchievementManager.ts
 * @description Checks game events against achievement conditions and fires
 *              unlock notifications. Coordinates with StorageManager to persist
 *              and with UIManager to display the notification toast.
 */

import * as Phaser from 'phaser';
import { EVENTS } from '../data/Constants';
import { ACHIEVEMENTS, ACHIEVEMENT_MAP } from '../data/AchievementData';
import type { AchievementDefinition } from '../data/AchievementData';
import { StorageManager } from './StorageManager';
import { AudioManager } from './AudioManager';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Accumulated counters used to check achievement conditions. */
type AchievementCounters = {
  totalCandiesCut: number;
  totalRounds: number;
  dailyChallengesCompleted: number;
  shareCount: number;
  perfectAccuracyRounds: number;
};

// ---------------------------------------------------------------------------
// AchievementManager (singleton)
// ---------------------------------------------------------------------------

export class AchievementManager {
  private static _instance: AchievementManager | null = null;

  private eventBus!: Phaser.Events.EventEmitter;
  private counters: AchievementCounters = {
    totalCandiesCut: 0,
    totalRounds: 0,
    dailyChallengesCompleted: 0,
    shareCount: 0,
    perfectAccuracyRounds: 0,
  };

  /** Queue of achievements to display (avoids stacking overlays). */
  private notificationQueue: AchievementDefinition[] = [];
  private isShowingNotification = false;

  /** Callback provided by the active scene for showing notifications. */
  private showNotificationFn: ((achievement: AchievementDefinition) => void) | null = null;

  private constructor() {}

  // ── Singleton ─────────────────────────────────────────────────────────────

  static getInstance(): AchievementManager {
    if (!AchievementManager._instance) {
      AchievementManager._instance = new AchievementManager();
    }
    return AchievementManager._instance;
  }

  static init(eventBus: Phaser.Events.EventEmitter): AchievementManager {
    const instance = AchievementManager.getInstance();
    instance.eventBus = eventBus;
    instance.syncCountersFromStorage();
    instance.registerEventListeners();
    return instance;
  }

  // ── Scene registration ────────────────────────────────────────────────────

  /**
   * Registers the active scene's notification display function.
   * Call from each scene that should show achievement popups.
   */
  registerNotificationHandler(fn: (achievement: AchievementDefinition) => void): void {
    this.showNotificationFn = fn;
  }

  // ── Manual triggers ───────────────────────────────────────────────────────

  /** Called when the player shares a result. */
  onShare(): void {
    this.counters = { ...this.counters, shareCount: this.counters.shareCount + 1 };
    this.checkAll();
  }

  /** Called when a daily challenge is completed. */
  onDailyChallengeComplete(): void {
    this.counters = {
      ...this.counters,
      dailyChallengesCompleted: this.counters.dailyChallengesCompleted + 1,
    };
    this.checkAll();
  }

  /** Called with the player's global rank after a score submission. */
  onLeaderboardRankAchieved(rank: number): void {
    for (const def of ACHIEVEMENTS) {
      if (def.trigger.type === 'leaderboard_rank' && rank <= def.trigger.rank) {
        void this.unlock(def.id);
      }
    }
  }

  // ── Check all achievements ────────────────────────────────────────────────

  private checkAll(): void {
    for (const def of ACHIEVEMENTS) {
      this.checkSingle(def);
    }
  }

  private checkSingle(def: AchievementDefinition): void {
    const storage = StorageManager.getInstance();
    if (storage.isAchievementUnlocked(def.id)) return;

    const { trigger } = def;

    let shouldUnlock = false;

    switch (trigger.type) {
      case 'candies_cut_total':
        shouldUnlock = this.counters.totalCandiesCut >= trigger.threshold;
        break;
      case 'total_rounds':
        shouldUnlock = this.counters.totalRounds >= trigger.count;
        break;
      case 'daily_challenge_complete':
        shouldUnlock = this.counters.dailyChallengesCompleted >= trigger.days;
        break;
      case 'share_result':
        shouldUnlock = this.counters.shareCount >= trigger.count;
        break;
      case 'accuracy_perfect':
        shouldUnlock = this.counters.perfectAccuracyRounds >= trigger.rounds;
        break;
      case 'login_streak':
        shouldUnlock = storage.getLoginStreak() >= trigger.days;
        break;
      case 'score_single_round':
      case 'difficulty_complete':
      case 'no_fail_round':
      case 'speed_cut':
      case 'leaderboard_rank':
        // These are event-driven and handled by specific callers
        break;
    }

    if (shouldUnlock) {
      void this.unlock(def.id);
    }
  }

  /** Unlocks the achievement with the given ID. Idempotent. */
  async unlock(id: string): Promise<void> {
    const storage = StorageManager.getInstance();
    if (storage.isAchievementUnlocked(id)) return;

    await storage.unlockAchievement(id);

    const def = ACHIEVEMENT_MAP.get(id);
    if (!def) return;

    AudioManager.getInstance().playAchievement();
    this.enqueueNotification(def);
    this.eventBus.emit(EVENTS.ACHIEVEMENT_UNLOCKED, def);
  }

  // ── Event listeners ───────────────────────────────────────────────────────

  private registerEventListeners(): void {
    this.eventBus.on(EVENTS.CANDY_SUCCESS, () => {
      this.counters = {
        ...this.counters,
        totalCandiesCut: this.counters.totalCandiesCut + 1,
      };
    });

    this.eventBus.on(EVENTS.LEVEL_COMPLETE, (result: {
      difficulty: string;
      accuracy: number;
      timeRemaining: number;
      score: number;
      candiesCut: number;
      candiesTotal: number;
    }) => {
      this.counters = {
        ...this.counters,
        totalRounds: this.counters.totalRounds + 1,
      };

      // Perfect accuracy round
      if (result.accuracy >= 0.999) {
        this.counters = {
          ...this.counters,
          perfectAccuracyRounds: this.counters.perfectAccuracyRounds + 1,
        };
      }

      // Check difficulty completion achievements
      for (const def of ACHIEVEMENTS) {
        if (
          def.trigger.type === 'difficulty_complete' &&
          def.trigger.difficulty === result.difficulty
        ) {
          void this.unlock(def.id);
        }
        if (
          def.trigger.type === 'no_fail_round' &&
          def.trigger.difficulty === result.difficulty &&
          result.candiesCut === result.candiesTotal
        ) {
          void this.unlock(def.id);
        }
        if (
          def.trigger.type === 'speed_cut' &&
          def.trigger.difficulty === result.difficulty &&
          result.timeRemaining >= def.trigger.seconds
        ) {
          void this.unlock(def.id);
        }
        if (
          def.trigger.type === 'score_single_round' &&
          result.score >= def.trigger.threshold
        ) {
          void this.unlock(def.id);
        }
      }

      this.checkAll();
    });
  }

  // ── Notification queue ────────────────────────────────────────────────────

  private enqueueNotification(achievement: AchievementDefinition): void {
    this.notificationQueue.push(achievement);
    this.flushNotificationQueue();
  }

  private flushNotificationQueue(): void {
    if (this.isShowingNotification || this.notificationQueue.length === 0) return;
    if (!this.showNotificationFn) return;

    this.isShowingNotification = true;
    const next = this.notificationQueue.shift()!;

    this.showNotificationFn(next);

    // Wait 3.5 seconds before showing the next one
    setTimeout(() => {
      this.isShowingNotification = false;
      this.flushNotificationQueue();
    }, 3500);
  }

  // ── Sync with storage ─────────────────────────────────────────────────────

  private syncCountersFromStorage(): void {
    const storage = StorageManager.getInstance();
    const data = storage.getPlayerData();
    this.counters = {
      totalCandiesCut: data.totalCandiesCut,
      totalRounds: data.totalRoundCount,
      dailyChallengesCompleted: 0,   // fetched separately from daily challenge API
      shareCount: 0,
      perfectAccuracyRounds: 0,
    };
  }
}
