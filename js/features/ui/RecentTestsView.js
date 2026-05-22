/**
 * Recent tests list rendering (Single Responsibility).
 */
export class RecentTestsView {
  /**
   * @param {HTMLElement} container
   */
  constructor(container) {
    this._container = container;
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
        return `
        <div class="recent-item">
          <div class="recent-item__top">
            <span class="recent-item__score">${t.hps.toFixed(2)}/s</span>
            <span class="recent-item__badge recent-item__badge--rank">${t.rank.toUpperCase()}</span>
            <span class="recent-item__badge recent-item__badge--mode">${(t.mode || 'flick').toUpperCase()}</span>
            <span class="recent-item__time">${time}</span>
          </div>
          <div class="recent-item__stats">
            ${t.accuracy}% acc &nbsp; ${t.avgTimeMs}ms avg &nbsp; ${t.hits} hits
          </div>
        </div>`;
      })
      .join('');
  }
}
