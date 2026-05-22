import { StorageService } from '../../core/StorageService.js';
import { RANKS } from '../stats/RankService.js';

const STORAGE_KEY = 'aimtrainer_achievements';

/** Maps legacy achievement ids to current ids */
const LEGACY_ID_MAP = {
  flick_rank_beginner: 'rank_beginner',
  flick_rank_casual: 'rank_casual',
  flick_rank_good: 'rank_good',
  flick_rank_skilled: 'rank_skilled',
  flick_rank_expert: 'rank_expert',
  flick_rank_master: 'rank_master',
  flick_50_hits: 'speed_hits_50',
  flick_95_acc: 'acc_95',
  flick_500ms: 'react_500',
  flick_10_sessions: 'prog_sessions_10',
};

export const CATEGORIES = [
  { id: 'rank', label: 'Rank' },
  { id: 'speed', label: 'Speed' },
  { id: 'accuracy', label: 'Accuracy' },
  { id: 'reaction', label: 'Reaction' },
  { id: 'progress', label: 'Progress' },
];

const MIN_HITS_FOR_REACT = 5;

/** @type {Record<string, Array<{ id: string, label: string, description: string, icon: string, check: (ctx: object) => boolean }>>} */
const DEFINITIONS = {
  rank: RANKS.map((r) => ({
    id: `rank_${r.id}`,
    label: r.name,
    description: `Reach ${r.threshold}+ hits/s on your personal best`,
    icon: '★',
    check: (c) => c.bestHps >= r.threshold,
  })),

  speed: [
    {
      id: 'speed_run_1',
      label: 'Warm-Up Run',
      description: 'Score 1.0+ hits/s in a single run',
      icon: '▶',
      check: (c) => c.lastHps >= 1,
    },
    {
      id: 'speed_run_15',
      label: 'Tempo',
      description: 'Score 1.5+ hits/s in a single run',
      icon: '▶',
      check: (c) => c.lastHps >= 1.5,
    },
    {
      id: 'speed_run_2',
      label: 'Quick Fingers',
      description: 'Score 2.0+ hits/s in a single run',
      icon: '⚡',
      check: (c) => c.lastHps >= 2,
    },
    {
      id: 'speed_run_25',
      label: 'Burst Fire',
      description: 'Score 2.5+ hits/s in a single run',
      icon: '⚡',
      check: (c) => c.lastHps >= 2.5,
    },
    {
      id: 'speed_run_3',
      label: 'Full Auto',
      description: 'Score 3.0+ hits/s in a single run',
      icon: '🔥',
      check: (c) => c.lastHps >= 3,
    },
    {
      id: 'speed_hits_10',
      label: 'Ten Pack',
      description: 'Land 10 hits in a single run',
      icon: '🎯',
      check: (c) => c.lastHits >= 10,
    },
    {
      id: 'speed_hits_25',
      label: 'Quarter Century',
      description: 'Land 25 hits in a single run',
      icon: '🎯',
      check: (c) => c.lastHits >= 25,
    },
    {
      id: 'speed_hits_40',
      label: 'Forty Club',
      description: 'Land 40 hits in a single run',
      icon: '🎯',
      check: (c) => c.lastHits >= 40,
    },
    {
      id: 'speed_hits_50',
      label: 'Half Century',
      description: 'Land 50 hits in a single run',
      icon: '🏅',
      check: (c) => c.lastHits >= 50,
    },
    {
      id: 'speed_hits_60',
      label: 'Sixty Gate',
      description: 'Land 60 hits in a single run',
      icon: '🏅',
      check: (c) => c.lastHits >= 60,
    },
    {
      id: 'speed_total_100',
      label: 'Century',
      description: 'Land 100 total hits across all runs',
      icon: '📊',
      check: (c) => c.totalHits >= 100,
    },
    {
      id: 'speed_total_500',
      label: 'Five Hundred',
      description: 'Land 500 total hits across all runs',
      icon: '📊',
      check: (c) => c.totalHits >= 500,
    },
    {
      id: 'speed_total_1000',
      label: 'Thousand Hits',
      description: 'Land 1,000 total hits across all runs',
      icon: '💎',
      check: (c) => c.totalHits >= 1000,
    },
  ],

  accuracy: [
    {
      id: 'acc_80',
      label: 'Solid',
      description: 'Finish a run with 80%+ accuracy (min. 5 clicks)',
      icon: '◎',
      check: (c) => c.lastHits + c.lastMisses >= 5 && c.lastAccuracy >= 80,
    },
    {
      id: 'acc_90',
      label: 'Sharp',
      description: 'Finish a run with 90%+ accuracy (min. 5 clicks)',
      icon: '◎',
      check: (c) => c.lastHits + c.lastMisses >= 5 && c.lastAccuracy >= 90,
    },
    {
      id: 'acc_95',
      label: 'Marksman',
      description: 'Finish a run with 95%+ accuracy (min. 5 clicks)',
      icon: '🎯',
      check: (c) => c.lastHits + c.lastMisses >= 5 && c.lastAccuracy >= 95,
    },
    {
      id: 'acc_100',
      label: 'Flawless Run',
      description: 'Finish a run with 100% accuracy (min. 10 clicks)',
      icon: '✦',
      check: (c) =>
        c.lastAccuracy === 100 && c.lastHits + c.lastMisses >= 10,
    },
    {
      id: 'acc_best_90',
      label: 'Consistent',
      description: 'Record 90%+ accuracy in any run',
      icon: '✓',
      check: (c) => c.bestAccuracy >= 90,
    },
    {
      id: 'acc_best_95',
      label: 'Elite Aim',
      description: 'Record 95%+ accuracy in any run',
      icon: '✓',
      check: (c) => c.bestAccuracy >= 95,
    },
    {
      id: 'acc_streak_3',
      label: 'Triple Streak',
      description: 'Three consecutive recent runs at 90%+ accuracy',
      icon: '🔗',
      check: (c) => c.accuracyStreak90 >= 3,
    },
    {
      id: 'acc_sessions_95_x3',
      label: 'Three Star',
      description: 'Complete 3 runs with 95%+ accuracy',
      icon: '⭐',
      check: (c) => c.sessions95 >= 3,
    },
  ],

  reaction: [
    {
      id: 'react_700',
      label: 'Agile',
      description: 'Avg. reaction ≤700 ms in one run (min. 5 hits)',
      icon: '⏱',
      check: (c) => c.lastHits >= MIN_HITS_FOR_REACT && c.lastAvgMs > 0 && c.lastAvgMs <= 700,
    },
    {
      id: 'react_600',
      label: 'Quick Reflex',
      description: 'Avg. reaction ≤600 ms in one run (min. 5 hits)',
      icon: '⏱',
      check: (c) => c.lastHits >= MIN_HITS_FOR_REACT && c.lastAvgMs > 0 && c.lastAvgMs <= 600,
    },
    {
      id: 'react_500',
      label: 'Reflex',
      description: 'Avg. reaction ≤500 ms in one run (min. 5 hits)',
      icon: '⚡',
      check: (c) => c.lastHits >= MIN_HITS_FOR_REACT && c.lastAvgMs > 0 && c.lastAvgMs <= 500,
    },
    {
      id: 'react_400',
      label: 'Lightning',
      description: 'Avg. reaction ≤400 ms in one run (min. 5 hits)',
      icon: '⚡',
      check: (c) => c.lastHits >= MIN_HITS_FOR_REACT && c.lastAvgMs > 0 && c.lastAvgMs <= 400,
    },
    {
      id: 'react_350',
      label: 'Predator',
      description: 'Avg. reaction ≤350 ms in one run (min. 5 hits)',
      icon: '🔥',
      check: (c) => c.lastHits >= MIN_HITS_FOR_REACT && c.lastAvgMs > 0 && c.lastAvgMs <= 350,
    },
    {
      id: 'react_best_500',
      label: 'Best Reflex',
      description: 'Best recorded run average ≤500 ms',
      icon: '🏆',
      check: (c) => c.bestAvgMs > 0 && c.bestAvgMs <= 500,
    },
    {
      id: 'react_best_400',
      label: 'Top Tier',
      description: 'Best recorded run average ≤400 ms',
      icon: '🏆',
      check: (c) => c.bestAvgMs > 0 && c.bestAvgMs <= 400,
    },
  ],

  progress: [
    {
      id: 'prog_first',
      label: 'First Run',
      description: 'Complete your first training run',
      icon: '🚀',
      check: (c) => c.sessionCount >= 1,
    },
    {
      id: 'prog_sessions_5',
      label: 'Habit',
      description: 'Complete 5 runs',
      icon: '🔁',
      check: (c) => c.sessionCount >= 5,
    },
    {
      id: 'prog_sessions_10',
      label: 'Regular',
      description: 'Complete 10 runs',
      icon: '🔁',
      check: (c) => c.sessionCount >= 10,
    },
    {
      id: 'prog_sessions_25',
      label: 'Dedicated',
      description: 'Complete 25 runs',
      icon: '💪',
      check: (c) => c.sessionCount >= 25,
    },
    {
      id: 'prog_sessions_50',
      label: 'Veteran',
      description: 'Complete 50 runs',
      icon: '💪',
      check: (c) => c.sessionCount >= 50,
    },
    {
      id: 'prog_pb_improve',
      label: 'New Record',
      description: 'Beat your personal best',
      icon: '📈',
      check: (c) => c.isNewBest,
    },
    {
      id: 'prog_rank_good',
      label: 'Good Rank',
      description: 'Reach Good rank (2.0+ /s personal best)',
      icon: '★',
      check: (c) => c.bestHps >= 2,
    },
    {
      id: 'prog_rank_master',
      label: 'Master Rank',
      description: 'Reach Master rank (3.0+ /s personal best)',
      icon: '👑',
      check: (c) => c.bestHps >= 3,
    },
  ],
};

/**
 * Achievement unlock logic (Single Responsibility).
 */
export class AchievementService {
  #storage;

  constructor(storage = new StorageService()) {
    this.#storage = storage;
  }

  #normalizeIds(ids) {
    const out = new Set();
    for (const id of ids) {
      out.add(LEGACY_ID_MAP[id] ?? id);
    }
    return [...out];
  }

  getUnlockedIds() {
    return this.#normalizeIds(this.#storage.get(STORAGE_KEY, []));
  }

  /**
   * @param {object} context
   */
  evaluate(context) {
    const unlocked = new Set(this.getUnlockedIds());
    let changed = false;

    for (const cat of CATEGORIES) {
      for (const def of DEFINITIONS[cat.id] ?? []) {
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
   * @param {string} categoryId
   * @param {string[]} unlockedIds
   */
  getForCategory(categoryId, unlockedIds) {
    const normalized = new Set(this.#normalizeIds(unlockedIds));
    const defs = DEFINITIONS[categoryId] ?? [];
    return defs.map((def) => ({
      ...def,
      unlocked: normalized.has(def.id),
    }));
  }

  getTotalCount() {
    return Object.values(DEFINITIONS).flat().length;
  }

  getCategories() {
    return CATEGORIES;
  }
}
