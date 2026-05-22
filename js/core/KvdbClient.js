/** @see https://kvdb.io/docs/api/ */
export const KVDB_BUCKET_ID = '42KcZFoHu6F9ZmWjLP7PGm';

const BASE = `https://kvdb.io/${KVDB_BUCKET_ID}`;

/**
 * Minimal KVdb HTTP client (public read/write bucket).
 */
export class KvdbClient {
  /**
   * @param {string} key
   * @returns {Promise<string|null>}
   */
  async get(key) {
    const res = await fetch(`${BASE}/${encodeURIComponent(key)}`);
    if (res.status === 404) return null;
    if (!res.ok) throw new Error(await this.#errorMessage(res));
    return res.text();
  }

  /**
   * @param {string} key
   * @param {unknown} value
   */
  async setJson(key, value) {
    const res = await fetch(`${BASE}/${encodeURIComponent(key)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(value),
    });
    if (!res.ok) throw new Error(await this.#errorMessage(res));
  }

  /**
   * @param {{ prefix?: string }} [opts]
   * @returns {Promise<Array<[string, unknown]>>}
   */
  async listWithValues(opts = {}) {
    const params = new URLSearchParams({
      values: 'true',
      format: 'json',
    });
    if (opts.prefix) params.set('prefix', opts.prefix);

    const res = await fetch(`${BASE}/?${params}`);
    if (!res.ok) throw new Error(await this.#errorMessage(res));

    const rows = await res.json();
    if (!Array.isArray(rows)) return [];

    return rows.map(([key, value]) => {
      if (typeof value === 'string') {
        try {
          return [key, JSON.parse(value)];
        } catch {
          return [key, value];
        }
      }
      return [key, value];
    });
  }

  async #errorMessage(res) {
    const text = await res.text().catch(() => '');
    return text || `KVdb request failed (${res.status})`;
  }
}
