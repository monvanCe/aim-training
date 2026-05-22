import { IGameMode } from './IGameMode.js';

const MIN_DISTANCE = 80;

/**
 * Flick mode: random targets with min separation (Liskov — substitutable IGameMode).
 */
export class FlickMode extends IGameMode {
  get id() {
    return 'flick';
  }

  get label() {
    return 'FLICK MODE';
  }

  get durationSeconds() {
    return 30;
  }

  createInitialTargets(width, height, radius) {
    const current = this._randomPosition(width, height, radius);
    const next = this.spawnNext(width, height, radius, current);
    return { current, next };
  }

  spawnNext(width, height, radius, exclude) {
    let pos;
    let attempts = 0;
    do {
      pos = this._randomPosition(width, height, radius);
      attempts += 1;
    } while (
      exclude &&
      Math.hypot(pos.x - exclude.x, pos.y - exclude.y) < MIN_DISTANCE &&
      attempts < 50
    );
    return pos;
  }

  _randomPosition(width, height, radius) {
    const pad = radius + 8;
    return {
      x: pad + Math.random() * (width - pad * 2),
      y: pad + Math.random() * (height - pad * 2),
    };
  }
}
