/**
 * @file api.ts
 * @description Hono API routes handling score submissions, leaderboard lists, daily challenges,
 *              achievements, settings saving, streak tracking, and Reddit post shares.
 */

import { Hono } from 'hono';
import { context, redis, reddit } from '@devvit/web/server';
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
import { submitUserScore, getLeaderboard } from '../core/leaderboard';
import { buildDailyChallengeConfig } from '../../client/data/LevelConfig';
import { createPost } from '../core/post';

type ErrorResponse = {
  status: 'error';
  message: string;
};

export const api = new Hono();

// ── GET /init ───────────────────────────────────────────────────────────────
api.get('/init', async (c) => {
  const { postId } = context;
  if (!postId) {
    return c.json<ErrorResponse>({ status: 'error', message: 'postId is required' }, 400);
  }

  try {
    const rawUsername = await reddit.getCurrentUsername();
    const username = rawUsername ?? 'anonymous';

    const keys = {
      bests: `usr:${username}:bests`,
      stats: `usr:${username}:stats`,
      dailyCompleted: `usr:${username}:dc:${new Date().toISOString().split('T')[0]}`
    };

    const [bestsRaw, statsRaw, dcCompleted] = await Promise.all([
      redis.get(keys.bests),
      redis.get(keys.stats),
      redis.get(keys.dailyCompleted)
    ]);

    const bests = bestsRaw ? JSON.parse(bestsRaw) : { easy: 0, medium: 0, hard: 0 };
    const stats = statsRaw ? JSON.parse(statsRaw) : { totalRounds: 0, totalCandies: 0, loginStreak: 1, lastLoginDate: '' };

    return c.json<InitResponse>({
      type: 'init',
      postId,
      username,
      personalBests: bests,
      totalRoundCount: stats.totalRounds,
      totalCandiesCut: stats.totalCandies,
      dailyChallengeCompletedToday: !!dcCompleted,
      loginStreak: stats.loginStreak,
      lastLoginDate: stats.lastLoginDate
    });
  } catch (error) {
    console.error('API /init error:', error);
    return c.json<ErrorResponse>({ status: 'error', message: 'Initialization failed' }, 500);
  }
});

// ── POST /score/submit ───────────────────────────────────────────────────────
api.post('/score/submit', async (c) => {
  const { postId } = context;
  if (!postId) {
    return c.json<ErrorResponse>({ status: 'error', message: 'postId is required' }, 400);
  }

  try {
    const rawUsername = await reddit.getCurrentUsername();
    const username = rawUsername ?? 'anonymous';
    const req = await c.req.json<SubmitScoreRequest>();

    // 1. Submit score to Leaderboard Sorted Lists
    const entry = await submitUserScore(
      postId,
      username,
      req.score,
      req.difficulty,
      req.candiesCut,
      req.accuracy
    );

    // 2. Update player stats and personal bests in Redis
    const keys = {
      bests: `usr:${username}:bests`,
      stats: `usr:${username}:stats`
    };

    const [bestsRaw, statsRaw] = await Promise.all([
      redis.get(keys.bests),
      redis.get(keys.stats)
    ]);

    const bests = bestsRaw ? JSON.parse(bestsRaw) : { easy: 0, medium: 0, hard: 0 };
    const stats = statsRaw ? JSON.parse(statsRaw) : { totalRounds: 0, totalCandies: 0, loginStreak: 1, lastLoginDate: '' };

    // Update PB
    const currentBest = bests[req.difficulty] ?? 0;
    if (req.score > currentBest) {
      bests[req.difficulty] = req.score;
      await redis.set(keys.bests, JSON.stringify(bests));
    }

    // Update Totals
    stats.totalRounds += 1;
    stats.totalCandies += req.candiesCut;
    await redis.set(keys.stats, JSON.stringify(stats));

    return c.json<SubmitScoreResponse>({
      status: 'success',
      entry
    });
  } catch (error) {
    console.error('API /score/submit error:', error);
    return c.json<ErrorResponse>({ status: 'error', message: 'Score submission failed' }, 500);
  }
});

// ── GET /leaderboard/:tab ────────────────────────────────────────────────────
api.get('/leaderboard/:tab', async (c) => {
  const { postId } = context;
  const tab = c.req.param('tab');

  if (!postId) {
    return c.json<ErrorResponse>({ status: 'error', message: 'postId is required' }, 400);
  }

  try {
    const entries = await getLeaderboard(postId, tab);
    return c.json<LeaderboardResponse>({
      tab,
      entries,
      totalCount: entries.length
    });
  } catch (error) {
    console.error(`API /leaderboard/${tab} error:`, error);
    return c.json<ErrorResponse>({ status: 'error', message: 'Failed to fetch rankings' }, 500);
  }
});

// ── GET /daily-challenge ─────────────────────────────────────────────────────
api.get('/daily-challenge', async (c) => {
  const dateStr = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  const cfg = buildDailyChallengeConfig(dateStr);

  try {
    const rawUsername = await reddit.getCurrentUsername();
    const username = rawUsername ?? 'anonymous';
    
    const dcCompleted = await redis.get(`usr:${username}:dc:${dateStr}`);

    return c.json<DailyChallengeResponse>({
      date: cfg.date,
      shapes: [...cfg.shapes],
      timeLimit: cfg.timeLimit,
      scoreMultiplier: cfg.scoreMultiplier,
      completed: !!dcCompleted
    });
  } catch (error) {
    console.error('API /daily-challenge error:', error);
    return c.json<ErrorResponse>({ status: 'error', message: 'Failed to fetch challenge' }, 500);
  }
});

// ── POST /streak/update ──────────────────────────────────────────────────────
api.post('/streak/update', async (c) => {
  try {
    const rawUsername = await reddit.getCurrentUsername();
    const username = rawUsername ?? 'anonymous';
    
    const key = `usr:${username}:stats`;
    const statsRaw = await redis.get(key);
    const stats = statsRaw ? JSON.parse(statsRaw) : { totalRounds: 0, totalCandies: 0, loginStreak: 0, lastLoginDate: '' };

    const todayStr = new Date().toISOString().split('T')[0];
    let updated = false;

    if (stats.lastLoginDate !== todayStr) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      if (stats.lastLoginDate === yesterdayStr) {
        // Consecutive streak
        stats.loginStreak += 1;
      } else {
        // Reset streak
        stats.loginStreak = 1;
      }

      stats.lastLoginDate = todayStr;
      await redis.set(key, JSON.stringify(stats));
      updated = true;
    }

    return c.json<StreakResponse>({
      streak: stats.loginStreak,
      updated
    });
  } catch (error) {
    console.error('API /streak/update error:', error);
    return c.json<ErrorResponse>({ status: 'error', message: 'Streak update failed' }, 500);
  }
});

// ── GET /achievements ────────────────────────────────────────────────────────
api.get('/achievements', async (c) => {
  try {
    const rawUsername = await reddit.getCurrentUsername();
    const username = rawUsername ?? 'anonymous';
    
    const raw = await redis.get(`usr:${username}:ach`);
    const unlockedIds = raw ? JSON.parse(raw) : [];

    return c.json<AchievementsResponse>({ unlockedIds });
  } catch (error) {
    console.error('API /achievements error:', error);
    return c.json<ErrorResponse>({ status: 'error', message: 'Achievements fetch failed' }, 500);
  }
});

// ── POST /achievement/unlock ─────────────────────────────────────────────────
api.post('/achievement/unlock', async (c) => {
  try {
    const rawUsername = await reddit.getCurrentUsername();
    const username = rawUsername ?? 'anonymous';
    const req = await c.req.json<UnlockAchievementRequest>();

    const key = `usr:${username}:ach`;
    const raw = await redis.get(key);
    const unlockedIds: string[] = raw ? JSON.parse(raw) : [];

    if (unlockedIds.includes(req.achievementId)) {
      return c.json<UnlockAchievementResponse>({
        status: 'already_unlocked',
        achievementId: req.achievementId
      });
    }

    unlockedIds.push(req.achievementId);
    await redis.set(key, JSON.stringify(unlockedIds));

    return c.json<UnlockAchievementResponse>({
      status: 'success',
      achievementId: req.achievementId
    });
  } catch (error) {
    console.error('API /achievement/unlock error:', error);
    return c.json<ErrorResponse>({ status: 'error', message: 'Unlock persist failed' }, 500);
  }
});

// ── POST /share ──────────────────────────────────────────────────────────────
api.post('/share', async (c) => {
  try {
    const req = await c.req.json<ShareRequest>();
    const post = await createPost(req.title);

    return c.json<ShareResponse>({
      status: 'success',
      postId: post.id
    });
  } catch (error) {
    console.error('API /share error:', error);
    return c.json<ErrorResponse>({ status: 'error', message: 'Reddit post share failed' }, 500);
  }
});

// ── GET /settings ────────────────────────────────────────────────────────────
api.get('/settings', async (c) => {
  try {
    const rawUsername = await reddit.getCurrentUsername();
    const username = rawUsername ?? 'anonymous';
    
    const raw = await redis.get(`usr:${username}:sett`);
    const settings = raw ? JSON.parse(raw) : { musicVolume: 0.6, sfxVolume: 0.8, musicEnabled: true, sfxEnabled: true, vibrationEnabled: true };

    return c.json<SettingsResponse>({ settings });
  } catch (error) {
    console.error('API /settings error:', error);
    return c.json<ErrorResponse>({ status: 'error', message: 'Fetch settings failed' }, 500);
  }
});

// ── POST /settings/save ──────────────────────────────────────────────────────
api.post('/settings/save', async (c) => {
  try {
    const rawUsername = await reddit.getCurrentUsername();
    const username = rawUsername ?? 'anonymous';
    const req = await c.req.json<SaveSettingsRequest>();

    await redis.set(`usr:${username}:sett`, JSON.stringify(req.settings));
    return c.json({ status: 'success' });
  } catch (error) {
    console.error('API /settings/save error:', error);
    return c.json<ErrorResponse>({ status: 'error', message: 'Save settings failed' }, 500);
  }
});
