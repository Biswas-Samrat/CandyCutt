/**
 * @file AchievementData.ts
 * @description All achievement definitions.
 *              AchievementManager checks these conditions against game events.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type AchievementCategory = 'skill' | 'progression' | 'social' | 'daily' | 'collection';

export type AchievementTrigger =
  | { type: 'score_single_round'; threshold: number }
  | { type: 'candies_cut_total'; threshold: number }
  | { type: 'accuracy_perfect'; rounds: number }
  | { type: 'difficulty_complete'; difficulty: string }
  | { type: 'daily_challenge_complete'; days: number }
  | { type: 'login_streak'; days: number }
  | { type: 'share_result'; count: number }
  | { type: 'leaderboard_rank'; rank: number }
  | { type: 'no_fail_round'; difficulty: string }
  | { type: 'speed_cut'; seconds: number; difficulty: string }
  | { type: 'total_rounds'; count: number };

export type AchievementDefinition = {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly category: AchievementCategory;
  readonly icon: string;
  /** Points awarded on unlock (contributes to achievement score). */
  readonly points: number;
  /** Colour of the achievement badge (hex string). */
  readonly color: string;
  readonly trigger: AchievementTrigger;
  /** If true, this achievement is hidden until unlocked. */
  readonly secret: boolean;
};

// ---------------------------------------------------------------------------
// Achievement Definitions
// ---------------------------------------------------------------------------

export const ACHIEVEMENTS: readonly AchievementDefinition[] = [
  // ── Skill ─────────────────────────────────────────────────────────────────
  {
    id: 'first_cut',
    name: 'First Snip',
    description: 'Cut your very first candy.',
    category: 'skill',
    icon: '✂️',
    points: 10,
    color: '#4ECDC4',
    trigger: { type: 'candies_cut_total', threshold: 1 },
    secret: false,
  },
  {
    id: 'ten_cuts',
    name: 'Getting Sharp',
    description: 'Cut 10 candies across all rounds.',
    category: 'skill',
    icon: '🍬',
    points: 25,
    color: '#4ECDC4',
    trigger: { type: 'candies_cut_total', threshold: 10 },
    secret: false,
  },
  {
    id: 'hundred_cuts',
    name: 'Candy Surgeon',
    description: 'Cut 100 candies total.',
    category: 'skill',
    icon: '🏥',
    points: 100,
    color: '#A855F7',
    trigger: { type: 'candies_cut_total', threshold: 100 },
    secret: false,
  },
  {
    id: 'perfect_accuracy',
    name: 'Flawless',
    description: 'Complete a round with 100% accuracy on every candy.',
    category: 'skill',
    icon: '💯',
    points: 150,
    color: '#FFD700',
    trigger: { type: 'accuracy_perfect', rounds: 1 },
    secret: false,
  },
  {
    id: 'three_perfect',
    name: 'Precision Master',
    description: 'Achieve 100% accuracy in 3 separate rounds.',
    category: 'skill',
    icon: '🎯',
    points: 300,
    color: '#FFD700',
    trigger: { type: 'accuracy_perfect', rounds: 3 },
    secret: false,
  },
  {
    id: 'no_fail_easy',
    name: 'Smooth Operator',
    description: 'Complete Easy mode without a single boundary violation.',
    category: 'skill',
    icon: '😎',
    points: 50,
    color: '#4ECDC4',
    trigger: { type: 'no_fail_round', difficulty: 'easy' },
    secret: false,
  },
  {
    id: 'no_fail_medium',
    name: 'Steady Hands',
    description: 'Complete Medium mode without a single boundary violation.',
    category: 'skill',
    icon: '🤙',
    points: 100,
    color: '#A855F7',
    trigger: { type: 'no_fail_round', difficulty: 'medium' },
    secret: false,
  },
  {
    id: 'no_fail_hard',
    name: 'Ice Veins',
    description: 'Complete Hard mode without a single boundary violation.',
    category: 'skill',
    icon: '🧊',
    points: 250,
    color: '#FF4757',
    trigger: { type: 'no_fail_round', difficulty: 'hard' },
    secret: true,
  },
  {
    id: 'speed_demon',
    name: 'Speed Demon',
    description: 'Complete Hard mode with 15+ seconds remaining.',
    category: 'skill',
    icon: '⚡',
    points: 200,
    color: '#FF8C42',
    trigger: { type: 'speed_cut', seconds: 15, difficulty: 'hard' },
    secret: false,
  },
  {
    id: 'high_score_5k',
    name: 'Sweet Five-K',
    description: 'Score 5,000 points in a single round.',
    category: 'skill',
    icon: '🌟',
    points: 75,
    color: '#FFD700',
    trigger: { type: 'score_single_round', threshold: 5000 },
    secret: false,
  },
  {
    id: 'high_score_10k',
    name: 'Sugar Rush',
    description: 'Score 10,000 points in a single round.',
    category: 'skill',
    icon: '💥',
    points: 200,
    color: '#FF6B9D',
    trigger: { type: 'score_single_round', threshold: 10000 },
    secret: false,
  },

  // ── Progression ───────────────────────────────────────────────────────────
  {
    id: 'beat_easy',
    name: 'Taste Tester',
    description: 'Complete your first Easy round.',
    category: 'progression',
    icon: '🍭',
    points: 20,
    color: '#4ECDC4',
    trigger: { type: 'difficulty_complete', difficulty: 'easy' },
    secret: false,
  },
  {
    id: 'beat_medium',
    name: 'Candy Crafter',
    description: 'Complete your first Medium round.',
    category: 'progression',
    icon: '🎨',
    points: 50,
    color: '#A855F7',
    trigger: { type: 'difficulty_complete', difficulty: 'medium' },
    secret: false,
  },
  {
    id: 'beat_hard',
    name: 'Pin Master',
    description: 'Complete your first Hard round.',
    category: 'progression',
    icon: '📍',
    points: 120,
    color: '#FF4757',
    trigger: { type: 'difficulty_complete', difficulty: 'hard' },
    secret: false,
  },
  {
    id: 'ten_rounds',
    name: 'Dedicated Snipper',
    description: 'Play 10 total rounds.',
    category: 'progression',
    icon: '🎮',
    points: 40,
    color: '#45B7D1',
    trigger: { type: 'total_rounds', count: 10 },
    secret: false,
  },
  {
    id: 'fifty_rounds',
    name: 'Candy Veteran',
    description: 'Play 50 total rounds.',
    category: 'progression',
    icon: '🏆',
    points: 150,
    color: '#FFD700',
    trigger: { type: 'total_rounds', count: 50 },
    secret: false,
  },

  // ── Daily ─────────────────────────────────────────────────────────────────
  {
    id: 'daily_1',
    name: 'Day One',
    description: 'Complete your first daily challenge.',
    category: 'daily',
    icon: '📅',
    points: 30,
    color: '#FF8C42',
    trigger: { type: 'daily_challenge_complete', days: 1 },
    secret: false,
  },
  {
    id: 'daily_7',
    name: 'Weekly Warrior',
    description: 'Complete 7 daily challenges.',
    category: 'daily',
    icon: '📆',
    points: 100,
    color: '#FF8C42',
    trigger: { type: 'daily_challenge_complete', days: 7 },
    secret: false,
  },
  {
    id: 'streak_3',
    name: 'On a Roll',
    description: 'Log in 3 days in a row.',
    category: 'daily',
    icon: '🔥',
    points: 30,
    color: '#FF6B9D',
    trigger: { type: 'login_streak', days: 3 },
    secret: false,
  },
  {
    id: 'streak_7',
    name: 'Week Flame',
    description: 'Log in 7 days in a row.',
    category: 'daily',
    icon: '🔥🔥',
    points: 75,
    color: '#FF6B9D',
    trigger: { type: 'login_streak', days: 7 },
    secret: false,
  },
  {
    id: 'streak_30',
    name: 'Eternal Flame',
    description: 'Log in 30 days in a row.',
    category: 'daily',
    icon: '🌋',
    points: 500,
    color: '#FF4757',
    trigger: { type: 'login_streak', days: 30 },
    secret: true,
  },

  // ── Social ─────────────────────────────────────────────────────────────────
  {
    id: 'first_share',
    name: 'Show Off',
    description: 'Share your first result on Reddit.',
    category: 'social',
    icon: '📣',
    points: 50,
    color: '#FF6B9D',
    trigger: { type: 'share_result', count: 1 },
    secret: false,
  },
  {
    id: 'five_shares',
    name: 'Community Candy',
    description: 'Share your result 5 times.',
    category: 'social',
    icon: '🎉',
    points: 100,
    color: '#A855F7',
    trigger: { type: 'share_result', count: 5 },
    secret: false,
  },
  {
    id: 'top_10',
    name: 'Top of the Jar',
    description: 'Reach the Top 10 on the global leaderboard.',
    category: 'social',
    icon: '🏅',
    points: 250,
    color: '#FFD700',
    trigger: { type: 'leaderboard_rank', rank: 10 },
    secret: false,
  },
  {
    id: 'top_1',
    name: 'The Candy Overlord',
    description: 'Claim #1 on the global leaderboard.',
    category: 'social',
    icon: '👑',
    points: 1000,
    color: '#FFD700',
    trigger: { type: 'leaderboard_rank', rank: 1 },
    secret: true,
  },
] as const;

// ---------------------------------------------------------------------------
// Lookup map for O(1) access by ID
// ---------------------------------------------------------------------------

export const ACHIEVEMENT_MAP: ReadonlyMap<string, AchievementDefinition> = new Map(
  ACHIEVEMENTS.map((a) => [a.id, a])
);
