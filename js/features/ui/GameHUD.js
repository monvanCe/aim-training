/**
 * In-game HUD overlay (Single Responsibility).
 */
export class GameHUD {
  /**
   * @param {object} elements
   */
  constructor(elements) {
    this._el = elements;
  }

  /**
   * @param {object} tick
   */
  update(tick) {
    const remaining = Math.ceil(tick.remaining);
    this._el.time.textContent = `${remaining} s`;
    this._el.score.textContent = `${tick.scores.hps.toFixed(1)} /s`;
    this._el.acc.textContent = `${tick.scores.accuracy} %`;
  }
}
