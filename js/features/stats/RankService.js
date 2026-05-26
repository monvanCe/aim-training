export const RANKS = [
  { id: 'beginner', name: 'Beginner', threshold: 0 },
  { id: 'casual', name: 'Casual', threshold: 1 },
  { id: 'good', name: 'Good', threshold: 1.5 },
  { id: 'skilled', name: 'Skilled', threshold: 2 },
  { id: 'expert', name: 'Expert', threshold: 2.5 },
  { id: 'master', name: 'Master', threshold: 3 },
  { id: 'grandmaster', name: 'Grandmaster', threshold: 3.5 },
  { id: 'legend', name: 'Legend', threshold: 4 },
  { id: 'mythic', name: 'Mythic', threshold: 4.5 },
  { id: 'godlike', name: 'Godlike', threshold: 5 },
];

/**
 * Rank resolution and progress (Single Responsibility).
 */
export class RankService {
  /**
   * @param {number} hps
   */
  getRank(hps) {
    let current = RANKS[0];
    for (const rank of RANKS) {
      if (hps >= rank.threshold) current = rank;
    }
    return current;
  }

  /**
   * @param {number} hps
   */
  getNextRank(hps) {
    const current = this.getRank(hps);
    const idx = RANKS.findIndex((r) => r.id === current.id);
    return RANKS[idx + 1] ?? null;
  }

  /**
   * @param {number} hps
   * @returns {number} 0–100
   */
  getProgressPercent(hps) {
    const current = this.getRank(hps);
    const next = this.getNextRank(hps);
    if (!next) return 100;

    const range = next.threshold - current.threshold;
    const progress = hps - current.threshold;
    return Math.min(100, Math.max(0, (progress / range) * 100));
  }

  /**
   * @param {number} hps
   */
  buildRankList(hps) {
    const current = this.getRank(hps);
    return RANKS.map((rank) => {
      const achieved = hps >= rank.threshold;
      const isCurrent = rank.id === current.id;
      let icon = '✕';
      if (achieved && !isCurrent) icon = '✓';
      if (isCurrent) icon = '★';

      return {
        ...rank,
        achieved,
        isCurrent,
        icon,
        thresholdLabel: `${rank.threshold}+/s`,
      };
    });
  }
}
