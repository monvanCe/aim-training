/**
 * Manages current + next target positions (Single Responsibility).
 */
/** Extra pixels beyond drawn radius so edge/glow clicks register. */
const HIT_PADDING = 14;

export class TargetManager {
  #current = null;
  #next = null;
  #radius = 18;

  constructor(radius = 18) {
    this.#radius = radius;
  }

  get hitRadius() {
    return this.#radius + HIT_PADDING;
  }

  get current() {
    return this.#current;
  }

  get next() {
    return this.#next;
  }

  get radius() {
    return this.#radius;
  }

  /**
   * @param {{ x: number, y: number }} currentPos
   * @param {{ x: number, y: number }} nextPos
   */
  initialize(currentPos, nextPos) {
    this.#current = { ...currentPos, role: 'current' };
    this.#next = { ...nextPos, role: 'next' };
  }

  /** Promote next → current and set new next. */
  advance(nextPos) {
    this.#current = { ...this.#next, role: 'current' };
    this.#next = { ...nextPos, role: 'next' };
  }

  /**
   * @param {number} px
   * @param {number} py
   * @returns {boolean}
   */
  hitTest(px, py) {
    if (!this.#current) return false;
    const dx = px - this.#current.x;
    const dy = py - this.#current.y;
    return Math.hypot(dx, dy) <= this.hitRadius;
  }

  reset() {
    this.#current = null;
    this.#next = null;
  }
}
