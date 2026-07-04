/**
 * @file Constants.ts
 * @description Central repository for all game-wide constants.
 *              Import only what you need — avoid importing the whole module.
 */

// ---------------------------------------------------------------------------
// Reference resolution (portrait-first design)
// ---------------------------------------------------------------------------
export const DESIGN_WIDTH = 1080;
export const DESIGN_HEIGHT = 1920;

/** Fraction of the shorter screen edge kept as a safe inset from borders. */
export const SAFE_PADDING = 0.04;

// ---------------------------------------------------------------------------
// Scene Keys
// ---------------------------------------------------------------------------
export const SCENE_KEYS = {
  BOOT: 'Boot',
  PRELOADER: 'Preloader',
  SPLASH_SCREEN: 'SplashScreen',
  MAIN_MENU: 'MainMenu',
  LEVEL_SELECT: 'LevelSelect',
  TUTORIAL: 'Tutorial',
  GAMEPLAY: 'Gameplay',
  RESULTS: 'Results',
  LEADERBOARD: 'Leaderboard',
} as const;

export type SceneKey = (typeof SCENE_KEYS)[keyof typeof SCENE_KEYS];

// ---------------------------------------------------------------------------
// Phaser Registry Keys (global data accessible from any scene)
// ---------------------------------------------------------------------------
export const REGISTRY_KEYS = {
  AUDIO_MANAGER: 'audioManager',
  GAME_MANAGER: 'gameManager',
  STORAGE_MANAGER: 'storageManager',
  ACHIEVEMENT_MANAGER: 'achievementManager',
  LEADERBOARD_MANAGER: 'leaderboardManager',
} as const;

// ---------------------------------------------------------------------------
// Audio Keys
// ---------------------------------------------------------------------------
export const AUDIO_KEYS = {
  MUSIC_MENU: 'music-menu',
  MUSIC_GAMEPLAY: 'music-gameplay',
  MUSIC_VICTORY: 'music-victory',
  MUSIC_TENSION: 'music-tension',
  SFX_CUT: 'sfx-cut',
  SFX_CRACK: 'sfx-crack',
  SFX_SUCCESS: 'sfx-success',
  SFX_FAIL: 'sfx-fail',
  SFX_BUTTON: 'sfx-button',
  SFX_COUNTDOWN: 'sfx-countdown',
  SFX_CONFETTI: 'sfx-confetti',
  SFX_ACHIEVEMENT: 'sfx-achievement',
} as const;

export type AudioKey = (typeof AUDIO_KEYS)[keyof typeof AUDIO_KEYS];

// ---------------------------------------------------------------------------
// Texture / Asset Keys
// ---------------------------------------------------------------------------
export const TEXTURE_KEYS = {
  BACKGROUND: 'background',
  BG_GRADIENT: 'bg-gradient',
  PIN: 'pin',
  PIN_GLOW: 'pin-glow',
  PIN_SHADOW: 'pin-shadow',
  CANDY_BONBON: 'candy-bonbon',
  CANDY_STARDROP: 'candy-stardrop',
  CANDY_HEARTBIT: 'candy-heartbit',
  CANDY_SWIRLYPOP: 'candy-swirlypop',
  CANDY_RIBBONTWIST: 'candy-ribbontwist',
  CANDY_DIAMONDGEM: 'candy-diamondgem',
  CANDY_CLOUDPUFF: 'candy-cloudpuff',
  CANDY_CRESCENTMOON: 'candy-crescentmoon',
  CANDY_BONBON_HALF_L: 'candy-bonbon-half-l',
  CANDY_BONBON_HALF_R: 'candy-bonbon-half-r',
  PARTICLE_DOT: 'particle-dot',
  PARTICLE_STAR: 'particle-star',
  PARTICLE_CONFETTI_R: 'particle-confetti-r',
  PARTICLE_CONFETTI_G: 'particle-confetti-g',
  PARTICLE_CONFETTI_B: 'particle-confetti-b',
  PARTICLE_CONFETTI_Y: 'particle-confetti-y',
  PARTICLE_SHARD: 'particle-shard',
  BUTTON_PRIMARY: 'button-primary',
  BUTTON_SECONDARY: 'button-secondary',
  BUTTON_DANGER: 'button-danger',
  PANEL_BG: 'panel-bg',
  PANEL_GLOW: 'panel-glow',
  LOGO: 'logo',
  SPLASH_BG: 'splash-bg',
  STAR_FULL: 'star-full',
  STAR_EMPTY: 'star-empty',
  PROGRESS_FILL: 'progress-fill',
  PROGRESS_BG: 'progress-bg',
  CROWN_ICON: 'crown-icon',
  FIRE_ICON: 'fire-icon',
  TROPHY_ICON: 'trophy-icon',
  LOCK_ICON: 'lock-icon',
} as const;

export type TextureKey = (typeof TEXTURE_KEYS)[keyof typeof TEXTURE_KEYS];

// ---------------------------------------------------------------------------
// Color Palette (hex numbers for Phaser)
// ---------------------------------------------------------------------------
export const COLORS = {
  CANDY_PINK: 0xff6b9d,
  CANDY_PINK_DARK: 0xe0527a,
  CANDY_PURPLE: 0xa855f7,
  CANDY_PURPLE_DARK: 0x7c3aed,
  CANDY_YELLOW: 0xffd700,
  CANDY_MINT: 0x4ecdc4,
  CANDY_MINT_DARK: 0x2db3a8,
  CANDY_RED: 0xff4757,
  CANDY_ORANGE: 0xff8c42,
  CANDY_BLUE: 0x45b7d1,
  CANDY_TEAL: 0x11998e,
  CANDY_LAVENDER: 0xc084fc,
  CANDY_PEACH: 0xffb347,
  BG_DARK: 0x1a0a2e,
  BG_MID: 0x2d1b69,
  BG_LIGHT: 0x11998e,
  BG_GLOW: 0x4a1d96,
  UI_WHITE: 0xf8f4ff,
  UI_GLASS: 0xffffff,
  UI_GREY: 0x8b7fb8,
  SUCCESS_GREEN: 0x4ecdc4,
  FAIL_RED: 0xff4757,
  GOLD: 0xffd700,
  SILVER: 0xc0c0c0,
  BRONZE: 0xcd7f32,
} as const;

export type ColorHex = (typeof COLORS)[keyof typeof COLORS];

// ---------------------------------------------------------------------------
// Color Strings (CSS / Phaser text styles)
// ---------------------------------------------------------------------------
export const COLOR_STR = {
  CANDY_PINK: '#FF6B9D',
  CANDY_PURPLE: '#A855F7',
  CANDY_YELLOW: '#FFD700',
  CANDY_MINT: '#4ECDC4',
  CANDY_RED: '#FF4757',
  CANDY_ORANGE: '#FF8C42',
  BG_DARK: '#1A0A2E',
  BG_MID: '#2D1B69',
  UI_WHITE: '#F8F4FF',
  UI_GREY: '#8B7FB8',
  GOLD: '#FFD700',
  SHADOW: '#000000',
} as const;

// ---------------------------------------------------------------------------
// Gameplay Tuning
// ---------------------------------------------------------------------------
export const GAMEPLAY_CONST = {
  /** Radius of the interactive pin tip in pixels (at reference resolution). */
  PIN_TIP_RADIUS: 14,
  /** How often (px moved) we sample the drag path for validation. */
  PATH_SAMPLE_DISTANCE: 6,
  /** Extra pixels outside the candy polygon before a fail is triggered. */
  BOUNDARY_TOLERANCE: 10,
  /** 0-1 accuracy threshold required to count a candy as successfully cut. */
  MIN_SUCCESS_ACCURACY: 0.85,
  /** Base score awarded per candy cut cleanly. */
  SCORE_BASE: 1000,
  /** Additional score per 0.01 accuracy above MIN_SUCCESS_ACCURACY. */
  SCORE_ACCURACY_BONUS: 5,
  /** Additional score per second of time remaining when a candy is cut. */
  SCORE_TIME_BONUS: 8,
  /** Camera shake magnitude (fraction of screen size). */
  SHAKE_INTENSITY: 0.005,
  /** Camera shake duration in milliseconds. */
  SHAKE_DURATION: 280,
  /** How long (ms) to show the success feedback before advancing. */
  SUCCESS_HOLD_MS: 700,
  /** How long (ms) to show the failure animation before resetting. */
  FAIL_HOLD_MS: 900,
  /** Duration (ms) of the candy entrance tween. */
  CANDY_ENTRANCE_MS: 450,
  /** Duration (ms) of the candy split tween on success. */
  CANDY_SPLIT_MS: 380,
  /** How many seconds before level end the tension music starts. */
  TENSION_THRESHOLD_SEC: 5,
  /** Maximum number of entries shown per leaderboard page. */
  LEADERBOARD_PAGE_SIZE: 20,
  /** Maximum length of a streak displayed with fire emojis. */
  STREAK_FIRE_CAP: 10,
} as const;

// ---------------------------------------------------------------------------
// Difficulty Labels
// ---------------------------------------------------------------------------
export const DIFFICULTY_LABELS = {
  easy: 'Easy',
  medium: 'Medium',
  hard: 'Hard',
} as const;

export type Difficulty = keyof typeof DIFFICULTY_LABELS;

// ---------------------------------------------------------------------------
// Event Bus Keys (Phaser EventEmitter events)
// ---------------------------------------------------------------------------
export const EVENTS = {
  // Gameplay events
  CANDY_SUCCESS: 'candy:success',
  CANDY_FAIL: 'candy:fail',
  LEVEL_COMPLETE: 'level:complete',
  LEVEL_FAILED: 'level:failed',
  SCORE_UPDATE: 'score:update',
  TIMER_UPDATE: 'timer:update',
  TIMER_EXPIRED: 'timer:expired',
  PIN_DRAG_START: 'pin:dragstart',
  PIN_DRAG_MOVE: 'pin:dragmove',
  PIN_DRAG_END: 'pin:dragend',
  // Achievement events
  ACHIEVEMENT_UNLOCKED: 'achievement:unlocked',
  // Audio events
  MUSIC_CHANGED: 'music:changed',
  // Storage events
  DATA_LOADED: 'storage:loaded',
  SCORE_SUBMITTED: 'storage:scoresubmitted',
} as const;

export type GameEvent = (typeof EVENTS)[keyof typeof EVENTS];
