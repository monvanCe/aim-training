const MOUSE_SAMPLE_MS = 1000 / 60;

/**
 * Records mouse samples and target positions during the timed game window only.
 * Positions are stored normalized (0–1) to the canvas size at recording start.
 */
export class SessionRecorder {
  #events = [];
  #gameStart = 0;
  #lastMouseSample = 0;
  #active = false;
  #canvasW = 0;
  #canvasH = 0;

  get isActive() {
    return this.#active;
  }

  /**
   * Called when the game timer starts (first hit).
   * @param {number} width — logical canvas width
   * @param {number} height — logical canvas height
   */
  start(width, height) {
    this.#events = [];
    this.#canvasW = width;
    this.#canvasH = height;
    this.#gameStart = performance.now();
    this.#lastMouseSample = 0;
    this.#active = true;
  }

  stop() {
    this.#active = false;
  }

  #t() {
    return performance.now() - this.#gameStart;
  }

  #normPoint(x, y) {
    return {
      nx: Math.max(0, Math.min(1, x / this.#canvasW)),
      ny: Math.max(0, Math.min(1, y / this.#canvasH)),
    };
  }

  /**
   * @param {{ x: number, y: number }|null} current
   * @param {{ x: number, y: number }|null} next
   */
  recordTargets(current, next) {
    if (!this.#active) return;
    this.#events.push({
      t: this.#t(),
      type: 'targets',
      current: current ? this.#normPoint(current.x, current.y) : null,
      next: next ? this.#normPoint(next.x, next.y) : null,
    });
  }

  /**
   * @param {number} x
   * @param {number} y
   */
  maybeRecordMouse(x, y) {
    if (!this.#active) return;
    const t = this.#t();
    if (t - this.#lastMouseSample < MOUSE_SAMPLE_MS) return;
    this.#lastMouseSample = t;
    const { nx, ny } = this.#normPoint(x, y);
    this.#events.push({ t, type: 'mouse', nx, ny });
  }

  /**
   * @param {number} radius
   * @param {number} durationMs — game length (timer elapsed)
   */
  export(radius, durationMs) {
    return {
      canvas: { width: this.#canvasW, height: this.#canvasH },
      radius,
      durationMs,
      events: this.#events,
    };
  }
}
