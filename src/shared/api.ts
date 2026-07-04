/**
 * @file api.ts
 * @description Shared type definitions between the serverless backend and the Phaser client.
 */

export type GameSettings = {
  musicVolume: number;
  sfxVolume: number;
  musicEnabled: boolean;
  sfxEnabled: boolean;
  vibrationEnabled: boolean;
};

export type PlayerData = {
  username: string;
  postId: string;
  personalBests: Record<string, number>;
  totalRoundCount: number;
  totalCandiesCut: number;
  dailyChallengeCompletedToday: boolean;
  loginStreak: number;
  lastLoginDate: string;
};

export type ScoreEntry = {
  username: string;
  score: number;
  difficulty: string;
  candiesCut: number;
  accuracy: number;
  timestamp: number;
  rank?: number;
};

// ── API request/response pairs ─────────────────────────────────────────────

export type InitResponse = PlayerData & {
  type: 'init';
};

export type SubmitScoreRequest = {
  score: number;
  difficulty: string;
  candiesCut: number;
  accuracy: number;
  timeRemaining: number;
};

export type SubmitScoreResponse = {
  status: 'success';
  entry: ScoreEntry;
};

export type LeaderboardResponse = {
  tab: string;
  entries: ScoreEntry[];
  totalCount: number;
};

export type DailyChallengeResponse = {
  date: string;
  shapes: string[];
  timeLimit: number;
  scoreMultiplier: number;
  completed: boolean;
};

export type StreakResponse = {
  streak: number;
  updated: boolean;
};

export type AchievementsResponse = {
  unlockedIds: string[];
};

export type UnlockAchievementRequest = {
  achievementId: string;
};

export type UnlockAchievementResponse = {
  status: 'success' | 'already_unlocked';
  achievementId: string;
};

export type ShareRequest = {
  title: string;
  score: number;
};

export type ShareResponse = {
  status: 'success';
  postId: string;
};

export type SettingsResponse = {
  settings: GameSettings;
};

export type SaveSettingsRequest = {
  settings: GameSettings;
};
