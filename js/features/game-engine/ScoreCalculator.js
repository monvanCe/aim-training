/**
 * Pure score/stat math (Single Responsibility).
 */
export class ScoreCalculator {
  constructor() {
    this.hits = 0;
    this.misses = 0;
    this.totalReactionMs = 0;
    this._lastHitTime = null;
  }

  reset() {
    this.hits = 0;
    this.misses = 0;
    this.totalReactionMs = 0;
    this._lastHitTime = performance.now();
  }

  recordHit(now = performance.now()) {
    if (this._lastHitTime !== null) {
      this.totalReactionMs += now - this._lastHitTime;
    }
    this.hits += 1;
    this._lastHitTime = now;
  }

  recordMiss() {
    this.misses += 1;
  }

  get accuracy() {
    const total = this.hits + this.misses;
    return total === 0 ? 100 : Math.round((this.hits / total) * 100);
  }

  get avgTimeMs() {
    return this.hits === 0 ? 0 : Math.round(this.totalReactionMs / this.hits);
  }

  /**
   * @param {number} elapsedSeconds
   */
  hitsPerSecond(elapsedSeconds) {
    if (elapsedSeconds <= 0) return 0;
    return this.hits / elapsedSeconds;
  }
}
