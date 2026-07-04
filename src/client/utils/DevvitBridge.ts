/**
 * @file DevvitBridge.ts
 * @description Typed fetch wrapper for all /api server calls.
 *              All network communication in the game MUST go through this
 *              module — no scene or manager calls fetch() directly.
 */

import type {
  InitResponse,
  SubmitScoreRequest,
  SubmitScoreResponse,
  LeaderboardResponse,
  DailyChallengeResponse,
  StreakResponse,
  AchievementsResponse,
  UnlockAchievementRequest,
  UnlockAchievementResponse,
  ShareRequest,
  ShareResponse,
  SettingsResponse,
  SaveSettingsRequest,
} from '../../shared/api';

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

type FetchMethod = 'GET' | 'POST';

/**
 * Internal typed fetch helper. Throws on non-OK HTTP status.
 */
async function apiFetch<TResponse>(
  path: string,
  method: FetchMethod,
  body?: unknown
): Promise<TResponse> {
  const options: RequestInit = { method };

  if (body !== undefined) {
    options.headers = { 'Content-Type': 'application/json' };
    options.body = JSON.stringify(body);
  }

  const response = await fetch(path, options);

  if (!response.ok) {
    const errorText = await response.text().catch(() => 'Unknown error');
    throw new Error(`API ${method} ${path} failed [${response.status}]: ${errorText}`);
  }

  return response.json() as Promise<TResponse>;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Fetches initial player data, username, daily challenge flag, and streak.
 * Called once when the game first loads.
 */
export const apiInit = (): Promise<InitResponse> =>
  apiFetch<InitResponse>('/api/init', 'GET');

/**
 * Submits a completed round score to the server.
 * Returns the updated personal best and global rank.
 */
export const apiSubmitScore = (request: SubmitScoreRequest): Promise<SubmitScoreResponse> =>
  apiFetch<SubmitScoreResponse>('/api/score/submit', 'POST', request);

/**
 * Retrieves the global all-time leaderboard.
 * @param page - Zero-based page index.
 */
export const apiLeaderboardGlobal = (page = 0): Promise<LeaderboardResponse> =>
  apiFetch<LeaderboardResponse>(`/api/leaderboard/global?page=${page}`, 'GET');

/**
 * Retrieves today's leaderboard.
 */
export const apiLeaderboardDaily = (): Promise<LeaderboardResponse> =>
  apiFetch<LeaderboardResponse>('/api/leaderboard/daily', 'GET');

/**
 * Retrieves this week's leaderboard.
 */
export const apiLeaderboardWeekly = (): Promise<LeaderboardResponse> =>
  apiFetch<LeaderboardResponse>('/api/leaderboard/weekly', 'GET');

/**
 * Fetches today's daily challenge configuration.
 */
export const apiDailyChallenge = (): Promise<DailyChallengeResponse> =>
  apiFetch<DailyChallengeResponse>('/api/daily-challenge', 'GET');

/**
 * Updates the player's login streak on the server.
 * Should be called once per session, after apiInit.
 */
export const apiUpdateStreak = (): Promise<StreakResponse> =>
  apiFetch<StreakResponse>('/api/streak/update', 'POST');

/**
 * Fetches all achievements and their unlock status for the current user.
 */
export const apiGetAchievements = (): Promise<AchievementsResponse> =>
  apiFetch<AchievementsResponse>('/api/achievements', 'GET');

/**
 * Marks an achievement as unlocked on the server.
 */
export const apiUnlockAchievement = (
  request: UnlockAchievementRequest
): Promise<UnlockAchievementResponse> =>
  apiFetch<UnlockAchievementResponse>('/api/achievement/unlock', 'POST', request);

/**
 * Creates a viral Reddit post with the player's result.
 * Returns the URL of the new post.
 */
export const apiShare = (request: ShareRequest): Promise<ShareResponse> =>
  apiFetch<ShareResponse>('/api/share', 'POST', request);

/**
 * Fetches the player's saved settings.
 */
export const apiGetSettings = (): Promise<SettingsResponse> =>
  apiFetch<SettingsResponse>('/api/settings', 'GET');

/**
 * Saves the player's settings to the server.
 */
export const apiSaveSettings = (request: SaveSettingsRequest): Promise<void> =>
  apiFetch<void>('/api/settings/save', 'POST', request);
