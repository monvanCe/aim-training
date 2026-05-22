import { TargetManager } from './TargetManager.js';
import { ScoreCalculator } from './ScoreCalculator.js';

const STATE = {
  IDLE: 'idle',
  RUNNING: 'running',
  FINISHED: 'finished',
};

/**
 * Core loop orchestration — depends on abstractions (mode, renderer via events).
 */
export class GameEngine {
  #mode;
  #targets;
  #scores;
  #state = STATE.IDLE;
  #width = 0;
  #height = 0;
  #startTime = 0;
  #elapsed = 0;
  #timerStarted = false;
  #duration = 30;
  #rafId = null;
  #onTick = null;
  #onStateChange = null;

  /**
   * @param {import('./IGameMode.js').IGameMode} mode
   * @param {{ onTick?: Function, onStateChange?: Function }} callbacks
   */
  constructor(mode, callbacks = {}) {
    this.#mode = mode;
    this.#targets = new TargetManager();
    this.#scores = new ScoreCalculator();
    this.#duration = mode.durationSeconds;
    this.#onTick = callbacks.onTick ?? (() => {});
    this.#onStateChange = callbacks.onStateChange ?? (() => {});
  }

  get state() {
    return this.#state;
  }

  get targets() {
    return this.#targets;
  }

  get scores() {
    return this.#scores;
  }

  get mode() {
    return this.#mode;
  }

  get elapsed() {
    return this.#elapsed;
  }

  get duration() {
    return this.#duration;
  }

  get remaining() {
    return Math.max(0, this.#duration - this.#elapsed);
  }

  /**
   * @param {number} width
   * @param {number} height
   */
  setup(width, height) {
    this.#width = width;
    this.#height = height;
  }

  start() {
    if (this.#state === STATE.RUNNING) return;

    const radius = this.#targets.radius;
    const { current, next } = this.#mode.createInitialTargets(
      this.#width,
      this.#height,
      radius
    );

    this.#targets.initialize(current, next);
    this.#scores.reset();
    this.#elapsed = 0;
    this.#timerStarted = false;
    this.#state = STATE.RUNNING;
    this.#onStateChange(this.#state);
    this.#loop();
  }

  stop() {
    if (this.#state !== STATE.RUNNING) return;
    this.#finish();
  }

  /**
   * @param {number} x
   * @param {number} y
   */
  handleClick(x, y) {
    if (this.#state !== STATE.RUNNING) return;

    if (this.#targets.hitTest(x, y)) {
      const now = performance.now();
      if (!this.#timerStarted) {
        this.#timerStarted = true;
        this.#startTime = now;
        this.#scores.startTiming(now);
      } else {
        this.#scores.recordHit(now);
      }
      const nextPos = this.#mode.spawnNext(
        this.#width,
        this.#height,
        this.#targets.radius,
        this.#targets.current
      );
      this.#targets.advance(nextPos);
    } else if (this.#timerStarted) {
      this.#scores.recordMiss();
    }
    this.#emitTick();
  }

  #loop() {
    if (this.#timerStarted) {
      const now = performance.now();
      this.#elapsed = (now - this.#startTime) / 1000;
    }

    if (this.#timerStarted && this.#elapsed >= this.#duration) {
      this.#finish();
      return;
    }

    this.#emitTick();
    this.#rafId = requestAnimationFrame(() => this.#loop());
  }

  #finish() {
    if (this.#rafId) {
      cancelAnimationFrame(this.#rafId);
      this.#rafId = null;
    }
    this.#elapsed = Math.min(this.#elapsed, this.#duration);
    this.#state = STATE.FINISHED;
    this.#onStateChange(this.#state);
    this.#emitTick();
  }

  #emitTick() {
    this.#onTick({
      state: this.#state,
      elapsed: this.#elapsed,
      remaining: this.remaining,
      targets: {
        current: this.#targets.current,
        next: this.#targets.next,
      },
      scores: {
        hits: this.#scores.hits,
        misses: this.#scores.misses,
        accuracy: this.#scores.accuracy,
        avgTimeMs: this.#scores.avgTimeMs,
        hps: this.#scores.hitsPerSecond(this.#elapsed || 0.001),
      },
    });
  }

  getResults() {
    const elapsed = Math.max(this.#elapsed, 0.001);
    return {
      mode: this.#mode.id,
      modeLabel: this.#mode.label,
      duration: this.#duration,
      hits: this.#scores.hits,
      misses: this.#scores.misses,
      accuracy: this.#scores.accuracy,
      avgTimeMs: this.#scores.avgTimeMs,
      hps: this.#scores.hitsPerSecond(elapsed),
      elapsed,
    };
  }

  resetToIdle() {
    if (this.#rafId) cancelAnimationFrame(this.#rafId);
    this.#rafId = null;
    this.#state = STATE.IDLE;
    this.#targets.reset();
    this.#onStateChange(this.#state);
  }
}
