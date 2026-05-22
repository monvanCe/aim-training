import { StorageService } from '../../core/StorageService.js';
import { RankService } from './RankService.js';

const KEYS = {
  personalBest: 'aimtrainer_pb_flick',
  recentTests: 'aimtrainer_recent',
};

const MAX_RECENT = 20;

/**
 * Persists and aggregates session data (Single Responsibility).
 */
export class StatsManager {
  #storage;
  #ranks;

  constructor(storage = new StorageService()) {
    this.#storage = storage;
    this.#ranks = new RankService();
  }

  get rankService() {
    return this.#ranks;
  }

  getPersonalBest() {
    return this.#storage.get(KEYS.personalBest, null);
  }

  /**
   * @param {import('../game-engine/GameEngine.js').GameEngine['getResults']} result
   */
  saveSession(result) {
    const entry = {
      id: Date.now(),
      hps: result.hps,
      accuracy: result.accuracy,
      avgTimeMs: result.avgTimeMs,
      hits: result.hits,
      mode: result.mode,
      rank: this.#ranks.getRank(result.hps).name,
      timestamp: new Date().toISOString(),
    };

    const recent = this.#storage.get(KEYS.recentTests, []);
    recent.unshift(entry);
    this.#storage.set(KEYS.recentTests, recent.slice(0, MAX_RECENT));

    const pb = this.getPersonalBest();
    if (!pb || result.hps > pb.hps) {
      this.#storage.set(KEYS.personalBest, {
        hps: result.hps,
        accuracy: result.accuracy,
        hits: result.hits,
        savedAt: entry.timestamp,
      });
      return { entry, isNewBest: true };
    }

    return { entry, isNewBest: false };
  }

  getRecentTests() {
    return this.#storage.get(KEYS.recentTests, []);
  }

  resetPersonalBest() {
    this.#storage.remove(KEYS.personalBest);
  }
}
