/**
 * @file LeaderboardManager.ts
 * @description Fetches, caches, and exposes leaderboard data.
 *              Maintains a short-lived cache (5 minutes) per tab to avoid
 *              excessive server requests.
 */

import {
  apiLeaderboardGlobal,
  apiLeaderboardDaily,
  apiLeaderboardWeekly,
} from '../utils/DevvitBridge';
import type { LeaderboardResponse, ScoreEntry } from '../../shared/api';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type LeaderboardTab = 'global' | 'daily' | 'weekly';

type CacheEntry = {
  data: LeaderboardResponse;
  fetchedAt: number;
};

// ---------------------------------------------------------------------------
// LeaderboardManager (singleton)
// ---------------------------------------------------------------------------

export class LeaderboardManager {
  private static _instance: LeaderboardManager | null = null;

  /** Cache TTL in milliseconds (5 minutes). */
  private readonly CACHE_TTL_MS = 5 * 60 * 1000;

  private cache: Map<LeaderboardTab, CacheEntry> = new Map();

  /** Pending promise per tab to prevent simultaneous duplicate fetches. */
  private pending: Map<LeaderboardTab, Promise<LeaderboardResponse>> = new Map();

  private constructor() {}

  static getInstance(): LeaderboardManager {
    if (!LeaderboardManager._instance) {
      LeaderboardManager._instance = new LeaderboardManager();
    }
    return LeaderboardManager._instance;
  }

  // ── Data fetching ─────────────────────────────────────────────────────────

  /**
   * Fetches leaderboard entries for the given tab.
   * Returns cached data if still fresh, otherwise fetches from server.
   *
   * @param tab - Which leaderboard to load.
   * @param forceRefresh - If true, bypasses the cache.
   */
  async getLeaderboard(
    tab: LeaderboardTab,
    forceRefresh = false
  ): Promise<LeaderboardResponse> {
    if (!forceRefresh) {
      const cached = this.cache.get(tab);
      if (cached && Date.now() - cached.fetchedAt < this.CACHE_TTL_MS) {
        return cached.data;
      }
    }

    // Return existing pending promise if one is in flight
    const existing = this.pending.get(tab);
    if (existing) return existing;

    const fetchFn = this.getFetchFn(tab);
    const promise = fetchFn()
      .then((data) => {
        this.cache.set(tab, { data, fetchedAt: Date.now() });
        this.pending.delete(tab);
        return data;
      })
      .catch((error: unknown) => {
        this.pending.delete(tab);
        console.warn(`[LeaderboardManager] Failed to fetch ${tab}:`, error);
        // Return stale cache or empty result
        return this.cache.get(tab)?.data ?? { entries: [], tab, totalCount: 0 };
      });

    this.pending.set(tab, promise);
    return promise;
  }

  /** Returns cached entries immediately, or empty array if not cached. */
  getCachedEntries(tab: LeaderboardTab): ScoreEntry[] {
    return this.cache.get(tab)?.data.entries ?? [];
  }

  /** Clears the cache for all tabs (e.g. after submitting a new score). */
  invalidateCache(): void {
    this.cache.clear();
  }

  /**
   * Finds the player's entry in cached global leaderboard data.
   * Returns null if not found.
   */
  findPlayerEntry(username: string, tab: LeaderboardTab = 'global'): ScoreEntry | null {
    const entries = this.getCachedEntries(tab);
    return entries.find((e) => e.username === username) ?? null;
  }

  /**
   * Returns the player's rank in the cached tab, or null if not present.
   */
  getPlayerRank(username: string, tab: LeaderboardTab = 'global'): number | null {
    const entries = this.getCachedEntries(tab);
    const idx = entries.findIndex((e) => e.username === username);
    return idx >= 0 ? idx + 1 : null;
  }

  // ── Internal helpers ──────────────────────────────────────────────────────

  private getFetchFn(tab: LeaderboardTab): () => Promise<LeaderboardResponse> {
    switch (tab) {
      case 'global':  return () => apiLeaderboardGlobal();
      case 'daily':   return apiLeaderboardDaily;
      case 'weekly':  return apiLeaderboardWeekly;
    }
  }
}
