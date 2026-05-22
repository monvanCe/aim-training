import { StorageService } from '../../core/StorageService.js';
import { RANKS } from '../stats/RankService.js';

const STORAGE_KEY = 'aimtrainer_achievements';

const MODES = ['flick', 'grid', 'spider', 'track'];

/** Achievement definitions per mode (Open/Closed). */
const DEFINITIONS = {
  flick: [
    ...RANKS.map((r) => ({
      id: `flick_rank_${r.id}`,
      label: r.name,
      icon: '★',
      check: (ctx) => ctx.bestHps >= r.threshold,
    })),
    { id: 'flick_50_hits', label: '50 Hits', icon: '🎯', check: (c) => c.lastHits >= 50 },
    { id: 'flick_95_acc', label: '95% Acc', icon: '◎', check: (c) => c.lastAccuracy >= 95 },
    { id: 'flick_500ms', label: '<500ms', icon: '⚡', check: (c) => c.lastAvgMs > 0 && c.lastAvgMs <= 500 },
    { id: 'flick_10_sessions', label: '10 Runs', icon: '🔁', check: (c) => c.sessionCount >= 10 },
  ],
  grid: Array.from({ length: 6 }, (_, i) => ({
    id: `grid_locked_${i}`,
    label: 'Coming Soon',
    icon: '🔒',
    check: () => false,
  })),
  spider: Array.from({ length: 6 }, (_, i) => ({
    id: `spider_locked_${i}`,
    label: 'Coming Soon',
    icon: '🔒',
    check: () => false,
  })),
  track: Array.from({ length: 5 }, (_, i) => ({
    id: `track_locked_${i}`,
    label: 'Coming Soon',
    icon: '🔒',
    check: () => false,
  })),
};

/**
 * Achievement unlock logic (Single Responsibility).
 */
export class AchievementService {
  #storage;

  constructor(storage = new StorageService()) {
    this.#storage = storage;
  }

  getUnlockedIds() {
    return this.#storage.get(STORAGE_KEY, []);
  }

  /**
   * @param {object} context
   */
  evaluate(context) {
    const unlocked = new Set(this.getUnlockedIds());
    let changed = false;

    for (const mode of MODES) {
      for (const def of DEFINITIONS[mode] ?? []) {
        if (!unlocked.has(def.id) && def.check(context)) {
          unlocked.add(def.id);
          changed = true;
        }
      }
    }

    if (changed) {
      this.#storage.set(STORAGE_KEY, [...unlocked]);
    }

    return [...unlocked];
  }

  /**
   * @param {string} mode
   * @param {string[]} unlockedIds
   */
  getForMode(mode, unlockedIds) {
    const defs = DEFINITIONS[mode] ?? [];
    return defs.map((def) => ({
      ...def,
      unlocked: unlockedIds.includes(def.id),
    }));
  }

  getTotalCount() {
    return Object.values(DEFINITIONS).flat().length;
  }

  getModes() {
    return MODES;
  }
}
