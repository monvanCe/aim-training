import { KvdbClient } from '../../core/KvdbClient.js';

const PLAYER_PREFIX = 'player:';

/**
 * Fetches and sorts global leaderboard entries from KVdb.
 */
export class LeaderboardService {
  #kvdb = new KvdbClient();

  /**
   * @returns {Promise<Array<{ rank: number, username: string, bestHps: number, visitorId: string }>>}
   */
  async fetchTop(limit = 50) {
    const rows = await this.#kvdb.listWithValues({ prefix: PLAYER_PREFIX });

    const entries = rows
      .map(([key, value]) => {
        const visitorId = key.slice(PLAYER_PREFIX.length);
        const username = value?.username;
        const bestHps = Number(value?.bestHps ?? 0);
        if (!username || !Number.isFinite(bestHps)) return null;
        return { username, bestHps, visitorId };
      })
      .filter(Boolean)
      .sort((a, b) => b.bestHps - a.bestHps)
      .slice(0, limit)
      .map((entry, index) => ({ rank: index + 1, ...entry }));

    return entries;
  }
}
