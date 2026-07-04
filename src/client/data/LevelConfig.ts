/**
 * @file LevelConfig.ts
 * @description Defines all level parameters for each difficulty tier.
 *              CandyFactory and GameManager read from here to build a round.
 */

import type { Difficulty } from './Constants';
import type { CandyShapeType } from './CandyShapes';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type LevelConfig = {
  /** Difficulty identifier */
  readonly difficulty: Difficulty;
  /** Display label shown to the player */
  readonly label: string;
  /** Brief description on the level select card */
  readonly description: string;
  /** Number of candies to cut to complete the level */
  readonly candyCount: number;
  /** Total time allowed for the level in seconds */
  readonly timeLimit: number;
  /** Pool of candy shapes available on this difficulty */
  readonly shapePool: readonly CandyShapeType[];
  /** Score multiplier applied to the final round score */
  readonly scoreMultiplier: number;
  /** Stars awarded thresholds — [1-star, 2-star, 3-star] as score values */
  readonly starThresholds: readonly [number, number, number];
  /** Color for the difficulty badge (hex string) */
  readonly badgeColor: string;
  /** Emoji shown next to difficulty name */
  readonly emoji: string;
  /**
   * How forgiving the boundary tolerance is, expressed as a multiplier
   * applied to GAMEPLAY_CONST.BOUNDARY_TOLERANCE. >1 = more forgiving.
   */
  readonly toleranceMultiplier: number;
  /**
   * How much of the cut path must be completed before the candy splits.
   * Value 0–1 (fraction of total path length).
   */
  readonly completionThreshold: number;
};

// ---------------------------------------------------------------------------
// Level Definitions
// ---------------------------------------------------------------------------

export const LEVEL_CONFIGS: Readonly<Record<Difficulty, LevelConfig>> = {
  easy: {
    difficulty: 'easy',
    label: 'Easy',
    description: '3 Candies · 60 Seconds · Simple Shapes',
    candyCount: 3,
    timeLimit: 60,
    shapePool: ['bonbon', 'stardrop', 'cloudpuff'],
    scoreMultiplier: 1.0,
    starThresholds: [1000, 2000, 3000],
    badgeColor: '#4ECDC4',
    emoji: '🍬',
    toleranceMultiplier: 1.5,
    completionThreshold: 0.90,
  },
  medium: {
    difficulty: 'medium',
    label: 'Medium',
    description: '4 Candies · 45 Seconds · Medium Shapes',
    candyCount: 4,
    timeLimit: 45,
    shapePool: ['heartbit', 'diamondgem', 'crescentmoon', 'bonbon'],
    scoreMultiplier: 1.5,
    starThresholds: [2000, 3500, 5000],
    badgeColor: '#A855F7',
    emoji: '💎',
    toleranceMultiplier: 1.0,
    completionThreshold: 0.92,
  },
  hard: {
    difficulty: 'hard',
    label: 'Hard',
    description: '5 Candies · 30 Seconds · Complex Shapes',
    candyCount: 5,
    timeLimit: 30,
    shapePool: ['swirlypop', 'ribbontwist', 'heartbit', 'diamondgem', 'crescentmoon'],
    scoreMultiplier: 2.0,
    starThresholds: [3500, 5500, 8000],
    badgeColor: '#FF4757',
    emoji: '🔥',
    toleranceMultiplier: 0.75,
    completionThreshold: 0.95,
  },
} as const;

// ---------------------------------------------------------------------------
// Daily Challenge Config
// ---------------------------------------------------------------------------

export type DailyChallengeConfig = {
  /** Date string YYYY-MM-DD identifying the challenge */
  readonly date: string;
  /** Fixed sequence of shapes for today's challenge */
  readonly shapes: readonly CandyShapeType[];
  /** Time limit for the daily challenge */
  readonly timeLimit: number;
  /** Score multiplier (daily challenges score higher) */
  readonly scoreMultiplier: number;
};

/**
 * Derives a daily challenge config from a seed string (e.g. date string).
 * Uses a deterministic algorithm so all players get the same challenge.
 */
export const buildDailyChallengeConfig = (seed: string): DailyChallengeConfig => {
  const allShapes: CandyShapeType[] = [
    'bonbon', 'stardrop', 'heartbit', 'swirlypop',
    'ribbontwist', 'diamondgem', 'cloudpuff', 'crescentmoon',
  ];

  // Simple hash from seed string to deterministic numbers
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }

  const shuffle = (arr: CandyShapeType[], h: number): CandyShapeType[] => {
    const copy = [...arr];
    for (let i = copy.length - 1; i > 0; i--) {
      h = (h * 1664525 + 1013904223) >>> 0;
      const j = h % (i + 1);
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  };

  const shuffled = shuffle(allShapes, hash);
  const shapes = shuffled.slice(0, 5);

  return {
    date: seed,
    shapes,
    timeLimit: 40,
    scoreMultiplier: 2.5,
  };
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Returns the config for a given difficulty, throwing on unknown input. */
export const getLevelConfig = (difficulty: Difficulty): LevelConfig =>
  LEVEL_CONFIGS[difficulty];

/** Calculates the star count (1–3) earned for a given score on a difficulty. */
export const getStarCount = (difficulty: Difficulty, score: number): 1 | 2 | 3 => {
  const { starThresholds } = LEVEL_CONFIGS[difficulty];
  if (score >= starThresholds[2]) return 3;
  if (score >= starThresholds[1]) return 2;
  return 1;
};
