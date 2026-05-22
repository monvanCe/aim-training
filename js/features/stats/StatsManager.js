import { StorageService } from '../../core/StorageService.js';
import { RankService } from './RankService.js';

const KEYS = {
  personalBest: 'aimtrainer_pb_flick',
  recentTests: 'aimtrainer_recent',
  totalSessions: 'aimtrainer_total_sessions',
  totalHits: 'aimtrainer_total_hits',
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
      misses: result.misses,
      mode: result.mode,
      rank: this.#ranks.getRank(result.hps).name,
      timestamp: new Date().toISOString(),
    };

    const recent = this.#storage.get(KEYS.recentTests, []);
    recent.unshift(entry);
    this.#storage.set(KEYS.recentTests, recent.slice(0, MAX_RECENT));

    const totalSessions = this.#storage.get(KEYS.totalSessions, 0) + 1;
    this.#storage.set(KEYS.totalSessions, totalSessions);

    const totalHits = this.#storage.get(KEYS.totalHits, 0) + result.hits;
    this.#storage.set(KEYS.totalHits, totalHits);

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

  /**
   * Summary stats for achievement evaluation.
   */
  getAchievementStats() {
    const recent = this.getRecentTests();
    const pb = this.getPersonalBest();

    const totalHits =
      this.#storage.get(KEYS.totalHits, null) ??
      recent.reduce((sum, e) => sum + (e.hits ?? 0), 0);
    const maxHits = recent.reduce((max, e) => Math.max(max, e.hits ?? 0), 0);
    const bestAccuracy = recent.reduce(
      (max, e) => Math.max(max, e.accuracy ?? 0),
      pb?.accuracy ?? 0
    );

    const qualified = recent.filter((e) => (e.hits ?? 0) >= 5 && (e.avgTimeMs ?? 0) > 0);
    const bestAvgMs = qualified.length
      ? Math.min(...qualified.map((e) => e.avgTimeMs))
      : 0;

    const sessions95 = recent.filter((e) => (e.accuracy ?? 0) >= 95).length;

    let accuracyStreak90 = 0;
    for (const e of recent) {
      if ((e.accuracy ?? 0) >= 90) accuracyStreak90 += 1;
      else break;
    }

    return {
      totalHits,
      maxHits,
      bestAccuracy,
      bestAvgMs,
      sessions95,
      accuracyStreak90,
      sessionCount: this.#storage.get(KEYS.totalSessions, recent.length),
    };
  }

  resetPersonalBest() {
    this.#storage.remove(KEYS.personalBest);
  }
}
