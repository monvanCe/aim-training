/**
 * Contract for game modes (Open/Closed — extend without modifying engine).
 * @typedef {Object} Target
 * @property {number} x
 * @property {number} y
 * @property {'current' | 'next'} role
 */

/**
 * @interface IGameMode
 */
export class IGameMode {
  get id() {
    throw new Error('Not implemented');
  }

  get label() {
    throw new Error('Not implemented');
  }

  get durationSeconds() {
    throw new Error('Not implemented');
  }

  /**
   * @param {number} width
   * @param {number} height
   * @param {number} radius
   * @returns {Target}
   */
  createInitialTargets(width, height, radius) {
    throw new Error('Not implemented');
  }

  /**
   * @param {number} width
   * @param {number} height
   * @param {number} radius
   * @param {{ x: number, y: number }} exclude
   * @returns {{ x: number, y: number }}
   */
  spawnNext(width, height, radius, exclude) {
    throw new Error('Not implemented');
  }
}
