/**
 * Recent tests list rendering (Single Responsibility).
 */
export class RecentTestsView {
  /**
   * @param {HTMLElement} container
   */
  constructor(container) {
    this._container = container;
    this._onReplay = null;
    this._replayIds = new Set();

    this._container.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-replay-id]');
      if (!btn || !this._onReplay) return;
      const id = Number(btn.dataset.replayId);
      if (Number.isFinite(id)) this._onReplay(id);
    });
  }

  /**
   * @param {(sessionId: number) => void} handler
   */
  setReplayHandler(handler) {
    this._onReplay = handler;
  }

  /**
   * @param {Set<number>} ids
   */
  setReplayIds(ids) {
    this._replayIds = ids;
  }

  /**
   * @param {Array} tests
   */
  render(tests) {
    if (!tests.length) {
      this._container.innerHTML = '<p class="empty-state">No tests yet</p>';
      return;
    }

    this._container.innerHTML = tests
      .map((t) => {
        const time = new Date(t.timestamp).toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
        });
        const hasReplay = this._replayIds.has(t.id);
        const replayBtn = hasReplay
          ? `<button type="button" class="recent-item__replay" data-replay-id="${t.id}" title="Replay" aria-label="Replay session">▶</button>`
          : '';
        return `
        <div class="recent-item">
          <div class="recent-item__top">
            <span class="recent-item__score">${t.hps.toFixed(2)}/s</span>
            <span class="recent-item__badge recent-item__badge--rank">${t.rank.toUpperCase()}</span>
            <span class="recent-item__badge recent-item__badge--mode">${(t.mode || 'flick').toUpperCase()}</span>
            <span class="recent-item__time">${time}</span>
            ${replayBtn}
          </div>
          <div class="recent-item__stats">
            ${t.accuracy}% acc &nbsp; ${t.avgTimeMs}ms avg &nbsp; ${t.hits} hits
          </div>
        </div>`;
      })
      .join('');
  }
}
