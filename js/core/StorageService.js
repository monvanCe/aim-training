/**
 * Persistence abstraction (Interface Segregation / Dependency Inversion).
 */
export class StorageService {
  constructor(storage = localStorage) {
    this._storage = storage;
  }

  get(key, fallback = null) {
    try {
      const raw = this._storage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch {
      return fallback;
    }
  }

  set(key, value) {
    this._storage.setItem(key, JSON.stringify(value));
  }

  remove(key) {
    this._storage.removeItem(key);
  }
}
