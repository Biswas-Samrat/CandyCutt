/**
 * @file Boot.ts
 * @description The very first Phaser scene. Initializes managers, sets up game settings,
 *              loads minimal splash assets, and transitions to Preloader.
 */

import { Scene } from 'phaser';
import { SCENE_KEYS, REGISTRY_KEYS } from '../data/Constants';
import { AudioManager } from '../managers/AudioManager';
import { InputManager } from '../managers/InputManager';
import { GameManager } from '../managers/GameManager';
import { StorageManager } from '../managers/StorageManager';
import { AchievementManager } from '../managers/AchievementManager';

export class Boot extends Scene {
  constructor() {
    super(SCENE_KEYS.BOOT);
  }

  preload(): void {
    // Load absolute minimum layout items needed by the preloader
    this.load.setPath('../assets');
    
    // Load background image or fallback splash logo if exists
    this.load.image('logo', 'logo.png');
    this.load.image('background', 'bg.png');
  }

  create(): void {
    // ── Manager initialization & registration in Phaser Registry ────────────
    const audioMgr = AudioManager.init(this.game);
    const inputMgr = InputManager.init(this.events);
    const gameMgr = GameManager.init(this.events);
    const storageMgr = StorageManager.getInstance();
    const achievementMgr = AchievementManager.init(this.events);

    this.registry.set(REGISTRY_KEYS.AUDIO_MANAGER, audioMgr);
    this.registry.set(REGISTRY_KEYS.GAME_MANAGER, gameMgr);
    this.registry.set(REGISTRY_KEYS.STORAGE_MANAGER, storageMgr);
    this.registry.set(REGISTRY_KEYS.ACHIEVEMENT_MANAGER, achievementMgr);

    // Setup default aspect-ratio scaling
    this.scale.resize(this.scale.width, this.scale.height);

    // Progress to Asset Preloader
    this.scene.start(SCENE_KEYS.PRELOADER);
  }
}
