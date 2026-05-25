import { CanvasRenderer } from '../rendering/CanvasRenderer.js';

/**
 * Plays back a recorded session on a canvas (play / pause only).
 */
export class ReplayPlayer {
  #data;
  #renderer;
  #radius;
  #durationMs;
  #recordedW;
  #recordedH;
  #virtualMs = 0;
  #playing = false;
  #rafId = null;
  #lastFrameTime = 0;
  #onTimeUpdate = null;

  /**
   * @param {object} replayData
   * @param {HTMLCanvasElement} canvas
   * @param {{ wrap?: HTMLElement, onTimeUpdate?: (ms: number, durationMs: number) => void }} options
   */
  constructor(replayData, canvas, options = {}) {
    this.#data = replayData;
    this.#radius = replayData.radius;
    this.#durationMs = replayData.durationMs || 0;
    this.#recordedW = replayData.canvas.width;
    this.#recordedH = replayData.canvas.height;
    this.#renderer = new CanvasRenderer(canvas);
    this.#onTimeUpdate = options.onTimeUpdate ?? (() => {});

    const wrap = options.wrap ?? canvas.parentElement;
    const maxW = wrap?.clientWidth || this.#recordedW;
    const scale = Math.min(1, maxW / this.#recordedW);
    const displayW = Math.round(this.#recordedW * scale);
    const displayH = Math.round(this.#recordedH * scale);
    this.#renderer.resize(displayW, displayH);
  }

  get durationMs() {
    return this.#durationMs;
  }

  get virtualMs() {
    return this.#virtualMs;
  }

  get isPlaying() {
    return this.#playing;
  }

  get isAtEnd() {
    return this.#durationMs > 0 && this.#virtualMs >= this.#durationMs;
  }

  play() {
    if (this.isAtEnd) {
      this.#virtualMs = 0;
    }
    this.#playing = true;
    this.#lastFrameTime = performance.now();
    this.#scheduleFrame();
  }

  pause() {
    this.#playing = false;
    if (this.#rafId) {
      cancelAnimationFrame(this.#rafId);
      this.#rafId = null;
    }
  }

  togglePlayPause() {
    if (this.#playing) {
      this.pause();
      return false;
    }
    this.play();
    return true;
  }

  destroy() {
    this.pause();
  }

  #scheduleFrame() {
    if (this.#rafId) cancelAnimationFrame(this.#rafId);
    this.#rafId = requestAnimationFrame(() => this.#frame());
  }

  #frame() {
    if (!this.#playing) return;

    const now = performance.now();
    const delta = now - this.#lastFrameTime;
    this.#lastFrameTime = now;
    this.#virtualMs = Math.min(this.#virtualMs + delta, this.#durationMs);

    this.#drawFrame();
    this.#onTimeUpdate(this.#virtualMs, this.#durationMs);

    if (this.#virtualMs >= this.#durationMs) {
      this.#playing = false;
      this.#rafId = null;
      return;
    }

    this.#scheduleFrame();
  }

  resetToStart() {
    this.pause();
    this.#virtualMs = 0;
    this.paint();
  }

  paint() {
    this.#drawFrame();
    this.#onTimeUpdate(this.#virtualMs, this.#durationMs);
  }

  #drawFrame() {
    const { targets, mouse } = this.#stateAt(this.#virtualMs);
    this.#renderer.render(targets, this.#radius, mouse ? { mouse } : undefined);
  }

  #toCanvasPoint(e) {
    const { width, height } = this.#renderer.logicalSize;
    if (e.nx != null && e.ny != null) {
      return { x: e.nx * width, y: e.ny * height };
    }
    return {
      x: (e.x / this.#recordedW) * width,
      y: (e.y / this.#recordedH) * height,
    };
  }

  #stateAt(tMs) {
    let current = null;
    let next = null;
    let mouse = null;

    for (const e of this.#data.events) {
      if (e.t > tMs) break;
      if (e.type === 'targets') {
        if (e.current) {
          const p = this.#toCanvasPoint(e.current);
          current = { x: p.x, y: p.y, role: 'current' };
        }
        if (e.next) {
          const p = this.#toCanvasPoint(e.next);
          next = { x: p.x, y: p.y, role: 'next' };
        }
      } else if (e.type === 'mouse') {
        mouse = this.#toCanvasPoint(e);
      }
    }

    return { targets: { current, next }, mouse };
  }
}
