/**
 * @file leaderboard.ts
 * @description Backend leaderboard persistence helpers using JSON-serialized arrays stored in Devvit Redis.
 *              Ensures 100% compatibility with the standard Redis get/set API.
 */

import { redis } from '@devvit/web/server';
import type { ScoreEntry } from '../../shared/api';

// Cache TTL/Size config
const LEADERBOARD_SIZE_LIMIT = 50;

// ── Key Helpers ─────────────────────────────────────────────────────────────

function getGlobalKey(postId: string): string {
  return `lb:${postId}:global`;
}

function getDailyKey(postId: string): string {
  const dateStr = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  return `lb:${postId}:daily:${dateStr}`;
}

function getWeeklyKey(postId: string): string {
  const d = new Date();
  const oneJan = new Date(d.getFullYear(), 0, 1);
  const numberOfDays = Math.floor((d.getTime() - oneJan.getTime()) / (24 * 60 * 60 * 1000));
  const weekNum = Math.ceil((d.getDay() + 1 + numberOfDays) / 7);
  return `lb:${postId}:weekly:${d.getFullYear()}-W${weekNum}`;
}

// ── Score submission/retrieval ──────────────────────────────────────────────

export async function submitUserScore(
  postId: string,
  username: string,
  score: number,
  difficulty: string,
  candiesCut: number,
  accuracy: number
): Promise<ScoreEntry> {
  const timestamp = Date.now();
  const newEntry: ScoreEntry = {
    username,
    score,
    difficulty,
    candiesCut,
    accuracy,
    timestamp
  };

  // Submit to all 3 categories in parallel
  const keys = [
    getGlobalKey(postId),
    getDailyKey(postId),
    getWeeklyKey(postId)
  ];

  await Promise.all(
    keys.map(async (key) => {
      const current = await getLeaderboardEntries(key);
      
      // Check if user has an existing score. Update only if new score is higher
      const existingIdx = current.findIndex((e) => e.username === username);
      if (existingIdx >= 0) {
        if (score > current[existingIdx].score) {
          current[existingIdx] = newEntry;
        }
      } else {
        current.push(newEntry);
      }

      // Sort descending by score, then ascending by timestamp (first to score wins ties)
      current.sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        return a.timestamp - b.timestamp;
      });

      // Keep only top 50
      const trimmed = current.slice(0, LEADERBOARD_SIZE_LIMIT);
      
      await redis.set(key, JSON.stringify(trimmed));
    })
  );

  // Compute player global rank
  const globalEntries = await getLeaderboardEntries(getGlobalKey(postId));
  const rank = globalEntries.findIndex((e) => e.username === username) + 1;

  return {
    ...newEntry,
    rank: rank > 0 ? rank : undefined
  };
}

export async function getLeaderboard(postId: string, tab: string): Promise<ScoreEntry[]> {
  let key = getGlobalKey(postId);
  if (tab === 'daily') key = getDailyKey(postId);
  if (tab === 'weekly') key = getWeeklyKey(postId);

  return await getLeaderboardEntries(key);
}

// ── Internal ────────────────────────────────────────────────────────────────

async function getLeaderboardEntries(key: string): Promise<ScoreEntry[]> {
  try {
    const raw = await redis.get(key);
    if (!raw) return [];
    return JSON.parse(raw) as ScoreEntry[];
  } catch (error) {
    console.warn(`[Leaderboard Core] Failed to parse key ${key}:`, error);
    return [];
  }
}
