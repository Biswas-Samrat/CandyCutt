/**
 * @file game.ts
 * @description Main entry point for the Phaser 4 game instance. Registers all 9 scenes
 *              and initializes global responsive layout configuration parameters.
 */

import * as Phaser from 'phaser';
import { AUTO, Game } from 'phaser';

// Import all 9 Scenes
import { Boot } from './scenes/Boot';
import { Preloader } from './scenes/Preloader';
import { SplashScreen } from './scenes/SplashScreen';
import { MainMenu } from './scenes/MainMenu';
import { LevelSelect } from './scenes/LevelSelect';
import { Tutorial } from './scenes/Tutorial';
import { Gameplay } from './scenes/Gameplay';
import { Results } from './scenes/Results';
import { Leaderboard } from './scenes/Leaderboard';

const config: Phaser.Types.Core.GameConfig = {
  type: AUTO,
  parent: 'game-container',
  backgroundColor: '#1a0a2e',
  scale: {
    mode: Phaser.Scale.RESIZE,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: 1080,
    height: 1920
  },
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 0 },
      debug: false
    }
  },
  // Register all 9 game scenes sequentially
  scene: [
    Boot,
    Preloader,
    SplashScreen,
    MainMenu,
    LevelSelect,
    Tutorial,
    Gameplay,
    Results,
    Leaderboard
  ]
};

const StartGame = (parent: string) => {
  return new Game({ ...config, parent });
};

document.addEventListener('DOMContentLoaded', () => {
  StartGame('game-container');
});
