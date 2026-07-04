/**
 * @file StorageManager.ts
 * @description Handles all client-side persistence via the Devvit server API.
 *              Caches data in memory to minimize server round-trips.
 *              All fetch calls are made through DevvitBridge.
 */

import {
  apiInit,
  apiSubmitScore,
  apiGetSettings,
  apiSaveSettings,
  apiGetAchievements,
  apiUnlockAchievement,
  apiUpdateStreak,
} from '../utils/DevvitBridge';
import type {
  PlayerData,
  GameSettings,
  ScoreEntry,
} from '../../shared/api';
import type { Difficulty } from '../data/Constants';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type StoredPlayerData = {
  username: string;
  postId: string;
  personalBests: Record<Difficulty, number>;
  totalRoundCount: number;
  totalCandiesCut: number;
  dailyChallengeCompletedToday: boolean;
  loginStreak: number;
  lastLoginDate: string;
  unlockedAchievements: string[];
  settings: GameSettings;
};

const DEFAULT_PLAYER_DATA: StoredPlayerData = {
  username: 'anonymous',
  postId: '',
  personalBests: { easy: 0, medium: 0, hard: 0 },
  totalRoundCount: 0,
  totalCandiesCut: 0,
  dailyChallengeCompletedToday: false,
  loginStreak: 0,
  lastLoginDate: '',
  unlockedAchievements: [],
  settings: {
    musicVolume: 0.6,
    sfxVolume: 0.8,
    musicEnabled: true,
    sfxEnabled: true,
    vibrationEnabled: true,
  },
};

// ---------------------------------------------------------------------------
// StorageManager (singleton)
// ---------------------------------------------------------------------------

export class StorageManager {
  private static _instance: StorageManager | null = null;

  private playerData: StoredPlayerData = { ...DEFAULT_PLAYER_DATA };
  private isLoaded = false;
  private loadPromise: Promise<void> | null = null;

  private constructor() {}

  // ── Singleton ─────────────────────────────────────────────────────────────

  static getInstance(): StorageManager {
    if (!StorageManager._instance) {
      StorageManager._instance = new StorageManager();
    }
    return StorageManager._instance;
  }

  // ── Initialization ────────────────────────────────────────────────────────

  async load(): Promise<void> {
    if (this.isLoaded) return;
    if (this.loadPromise) return this.loadPromise;

    this.loadPromise = (async () => {
      try {
        const [initData, settingsData, achievementsData] = await Promise.all([
          apiInit(),
          apiGetSettings().catch(() => null),
          apiGetAchievements().catch(() => null),
        ]);

        this.playerData = {
          ...DEFAULT_PLAYER_DATA,
          username: initData.username,
          postId: initData.postId,
          personalBests: {
            easy: initData.personalBests?.easy ?? 0,
            medium: initData.personalBests?.medium ?? 0,
            hard: initData.personalBests?.hard ?? 0,
          },
          totalRoundCount: initData.totalRoundCount ?? 0,
          totalCandiesCut: initData.totalCandiesCut ?? 0,
          dailyChallengeCompletedToday: initData.dailyChallengeCompletedToday ?? false,
          loginStreak: initData.loginStreak ?? 0,
          lastLoginDate: initData.lastLoginDate ?? '',
          unlockedAchievements: achievementsData?.unlockedIds ?? [],
          settings: settingsData?.settings ?? DEFAULT_PLAYER_DATA.settings,
        };

        // Update login streak in background
        void apiUpdateStreak().catch(() => {/* non-critical */});
        this.isLoaded = true;
      } catch (error) {
        console.warn('[StorageManager] Failed to load from server (offline mode fallback):', error);
        // Offline fallback: Use default data so the game can still be played!
        this.playerData = { ...DEFAULT_PLAYER_DATA };
        this.isLoaded = true;
      }
    })();

    return this.loadPromise;
  }

  // ── Data accessors ────────────────────────────────────────────────────────

  getPlayerData(): Readonly<StoredPlayerData> {
    return { ...this.playerData };
  }

  getUsername(): string {
    return this.playerData.username;
  }

  getSettings(): Readonly<GameSettings> {
    return { ...this.playerData.settings };
  }

  getPersonalBest(difficulty: Difficulty): number {
    return this.playerData.personalBests[difficulty];
  }

  isAchievementUnlocked(id: string): boolean {
    return this.playerData.unlockedAchievements.includes(id);
  }

  getLoginStreak(): number {
    return this.playerData.loginStreak;
  }

  isDailyChallengeCompleted(): boolean {
    return this.playerData.dailyChallengeCompletedToday;
  }

  getTotalRoundCount(): number {
    return this.playerData.totalRoundCount;
  }

  getTotalCandiesCut(): number {
    return this.playerData.totalCandiesCut;
  }

  // ── Score submission ──────────────────────────────────────────────────────

  /**
   * Submits a completed round score to the server.
   * Updates local personal best immediately for responsive UI.
   *
   * @returns The submitted score entry with global rank, or null on failure.
   */
  async submitScore(
    score: number,
    difficulty: Difficulty,
    candiesCut: number,
    accuracy: number,
    timeRemaining: number
  ): Promise<ScoreEntry | null> {
    // Optimistically update local state
    if (score > this.playerData.personalBests[difficulty]) {
      this.playerData = {
        ...this.playerData,
        personalBests: { ...this.playerData.personalBests, [difficulty]: score },
      };
    }

    this.playerData = {
      ...this.playerData,
      totalRoundCount: this.playerData.totalRoundCount + 1,
      totalCandiesCut: this.playerData.totalCandiesCut + candiesCut,
    };

    try {
      const response = await apiSubmitScore({
        score,
        difficulty,
        candiesCut,
        accuracy,
        timeRemaining,
      });
      return response.entry;
    } catch (error) {
      console.warn('[StorageManager] Failed to submit score:', error);
      return null;
    }
  }

  // ── Settings ──────────────────────────────────────────────────────────────

  /**
   * Saves updated settings both locally and to the server.
   */
  async saveSettings(settings: GameSettings): Promise<void> {
    this.playerData = { ...this.playerData, settings: { ...settings } };
    try {
      await apiSaveSettings({ settings });
    } catch (error) {
      console.warn('[StorageManager] Failed to save settings:', error);
    }
  }

  // ── Achievement unlock ────────────────────────────────────────────────────

  /**
   * Records an achievement as unlocked locally and persists to server.
   * No-op if already unlocked.
   */
  async unlockAchievement(id: string): Promise<void> {
    if (this.isAchievementUnlocked(id)) return;

    this.playerData = {
      ...this.playerData,
      unlockedAchievements: [...this.playerData.unlockedAchievements, id],
    };

    try {
      await apiUnlockAchievement({ achievementId: id });
    } catch (error) {
      console.warn(`[StorageManager] Failed to persist achievement "${id}":`, error);
    }
  }

  // ── Tutorial flag ─────────────────────────────────────────────────────────

  /** Checks localStorage for the tutorial completion flag (client-only). */
  hasTutorialBeenShown(): boolean {
    try {
      return localStorage.getItem('css_tutorial_shown') === '1';
    } catch {
      return false;
    }
  }

  /** Marks the tutorial as shown in localStorage. */
  markTutorialShown(): void {
    try {
      localStorage.setItem('css_tutorial_shown', '1');
    } catch {
      /* localStorage unavailable in some sandboxed iframes */
    }
  }
}
