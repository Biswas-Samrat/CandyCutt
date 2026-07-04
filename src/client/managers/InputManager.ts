/**
 * @file InputManager.ts
 * @description Unified input handler for mouse and touch.
 *              Wraps Phaser pointer events and emits strongly-typed game events
 *              so no scene touches raw Phaser input directly for gameplay.
 *
 *              The Gameplay scene registers a game object with this manager;
 *              the manager emits dragging coordinates on the global event bus.
 */

import * as Phaser from 'phaser';
import { EVENTS } from '../data/Constants';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type DragPoint = { readonly x: number; readonly y: number; readonly timestamp: number };

export type InputState = {
  isDragging: boolean;
  dragPoints: DragPoint[];
  lastPoint: DragPoint | null;
};

// ---------------------------------------------------------------------------
// InputManager (singleton)
// ---------------------------------------------------------------------------

export class InputManager {
  private static _instance: InputManager | null = null;

  /** The Phaser EventEmitter used as the game-wide event bus. */
  private eventBus!: Phaser.Events.EventEmitter;

  private state: InputState = {
    isDragging: false,
    dragPoints: [],
    lastPoint: null,
  };

  /** True when the device is touch-capable. */
  private _isTouch = false;

  /** Cleanup functions for the currently registered listeners. */
  private cleanupFns: Array<() => void> = [];

  private constructor() {}

  // ── Singleton ─────────────────────────────────────────────────────────────

  static getInstance(): InputManager {
    if (!InputManager._instance) {
      InputManager._instance = new InputManager();
    }
    return InputManager._instance;
  }

  static init(eventBus: Phaser.Events.EventEmitter): InputManager {
    const instance = InputManager.getInstance();
    instance.eventBus = eventBus;
    return instance;
  }

  // ── Scene registration ────────────────────────────────────────────────────

  /**
   * Registers pointer listeners on a Phaser scene's input plugin.
   * Call this from the Gameplay scene's create() method.
   * Automatically removes old listeners when called again.
   *
   * @param scene - The scene to attach input to.
   * @param constrainToObject - Optional game object; drag only responds within its bounds.
   */
  registerGameplayInput(scene: Phaser.Scene, constrainToObject?: Phaser.GameObjects.GameObject): void {
    this.removeListeners();
    this._isTouch = scene.sys.game.device.input.touch;

    const input = scene.input;

    // Enable multi-touch up to 2 pointers (one for play, one for UI)
    input.addPointer(1);

    const onDown = (pointer: Phaser.Input.Pointer): void => {
      if (constrainToObject) {
        const go = constrainToObject as Phaser.GameObjects.Image | Phaser.GameObjects.Graphics;
        if ('getBounds' in go) {
          const bounds = (go as Phaser.GameObjects.Image).getBounds();
          if (!bounds.contains(pointer.x, pointer.y)) return;
        }
      }

      this.state = {
        isDragging: true,
        dragPoints: [this.makePoint(pointer)],
        lastPoint: this.makePoint(pointer),
      };

      this.eventBus.emit(EVENTS.PIN_DRAG_START, { x: pointer.x, y: pointer.y });
    };

    const onMove = (pointer: Phaser.Input.Pointer): void => {
      if (!this.state.isDragging || !pointer.isDown) return;

      const point = this.makePoint(pointer);

      this.state = {
        ...this.state,
        dragPoints: [...this.state.dragPoints, point],
        lastPoint: point,
      };

      this.eventBus.emit(EVENTS.PIN_DRAG_MOVE, { x: pointer.x, y: pointer.y });
    };

    const onUp = (pointer: Phaser.Input.Pointer): void => {
      if (!this.state.isDragging) return;

      const finalPoints = [...this.state.dragPoints];
      this.state = { isDragging: false, dragPoints: [], lastPoint: null };

      this.eventBus.emit(EVENTS.PIN_DRAG_END, {
        x: pointer.x,
        y: pointer.y,
        path: finalPoints,
      });
    };

    input.on(Phaser.Input.Events.POINTER_DOWN, onDown);
    input.on(Phaser.Input.Events.POINTER_MOVE, onMove);
    input.on(Phaser.Input.Events.POINTER_UP, onUp);
    input.on(Phaser.Input.Events.POINTER_UP_OUTSIDE, onUp);

    this.cleanupFns = [
      () => input.off(Phaser.Input.Events.POINTER_DOWN, onDown),
      () => input.off(Phaser.Input.Events.POINTER_MOVE, onMove),
      () => input.off(Phaser.Input.Events.POINTER_UP, onUp),
      () => input.off(Phaser.Input.Events.POINTER_UP_OUTSIDE, onUp),
    ];
  }

  /**
   * Removes all active input listeners.
   * Call this from the Gameplay scene's shutdown() or when leaving gameplay.
   */
  removeListeners(): void {
    for (const cleanup of this.cleanupFns) cleanup();
    this.cleanupFns = [];
    this.state = { isDragging: false, dragPoints: [], lastPoint: null };
  }

  // ── State accessors ───────────────────────────────────────────────────────

  get isDragging(): boolean { return this.state.isDragging; }
  get lastPoint(): DragPoint | null { return this.state.lastPoint; }
  get isTouch(): boolean { return this._isTouch; }

  /** Returns a copy of all recorded drag points for the current gesture. */
  getDragPoints(): readonly DragPoint[] { return [...this.state.dragPoints]; }

  // ── Internal helpers ──────────────────────────────────────────────────────

  private makePoint(pointer: Phaser.Input.Pointer): DragPoint {
    return { x: pointer.x, y: pointer.y, timestamp: pointer.time };
  }
}
