import FingerprintJS from '../../vendor/fp.esm.min.js';
import { KvdbClient } from '../../core/KvdbClient.js';

const PLAYER_PREFIX = 'player:';

/**
 * Resolves visitorId via FingerprintJS and maps it to a username in KVdb.
 */
export class PlayerIdentityService {
  #kvdb = new KvdbClient();
  #visitorId = null;
  #profile = null;
  #ready = null;

  /**
   * @returns {Promise<{ visitorId: string, profile: object|null, isNew: boolean }>}
   */
  init() {
    if (!this.#ready) {
      this.#ready = this.#bootstrap();
    }
    return this.#ready;
  }

  get visitorId() {
    return this.#visitorId;
  }

  get profile() {
    return this.#profile;
  }

  playerKey(visitorId = this.#visitorId) {
    return `${PLAYER_PREFIX}${visitorId}`;
  }

  /**
   * @param {string} username
   */
  async register(username) {
    if (!this.#visitorId) await this.init();

    const profile = {
      username: username.trim(),
      bestHps: 0,
      updatedAt: new Date().toISOString(),
    };

    await this.#kvdb.setJson(this.playerKey(), profile);
    this.#profile = profile;
    return profile;
  }

  /**
   * @param {number} bestHps
   */
  async updateBestScore(bestHps) {
    if (!this.#profile || !this.#visitorId) return null;

    if (bestHps <= (this.#profile.bestHps ?? 0)) return this.#profile;

    const profile = {
      ...this.#profile,
      bestHps,
      updatedAt: new Date().toISOString(),
    };

    await this.#kvdb.setJson(this.playerKey(), profile);
    this.#profile = profile;
    return profile;
  }

  async #bootstrap() {
    const agent = await FingerprintJS.load();
    const { visitorId } = await agent.get();
    this.#visitorId = visitorId;

    const raw = await this.#kvdb.get(this.playerKey(visitorId));
    if (!raw) {
      return { visitorId, profile: null, isNew: true };
    }

    try {
      this.#profile = JSON.parse(raw);
    } catch {
      this.#profile = null;
      return { visitorId, profile: null, isNew: true };
    }

    return { visitorId, profile: this.#profile, isNew: false };
  }
}
