/**
 * Achievement tabs + grid (Single Responsibility).
 */
export class AchievementsView {
  /**
   * @param {object} config
   */
  constructor({ tabsEl, gridEl, countEl, achievementService, onModeChange }) {
    this._tabsEl = tabsEl;
    this._gridEl = gridEl;
    this._countEl = countEl;
    this._service = achievementService;
    this._onModeChange = onModeChange;
    this._activeMode = 'flick';
    this._unlocked = [];

    this._tabsEl.addEventListener('click', (e) => {
      const tab = e.target.closest('.tab');
      if (!tab) return;
      this._activeMode = tab.dataset.mode;
      this._tabsEl.querySelectorAll('.tab').forEach((t) => {
        t.classList.toggle('tab--active', t === tab);
      });
      this._onModeChange?.(this._activeMode);
      this.render();
    });
  }

  setUnlocked(ids) {
    this._unlocked = ids;
    this.render();
  }

  setActiveMode(mode) {
    this._activeMode = mode;
    this._tabsEl.querySelectorAll('.tab').forEach((t) => {
      t.classList.toggle('tab--active', t.dataset.mode === mode);
    });
    this.render();
  }

  render() {
    const items = this._service.getForMode(this._activeMode, this._unlocked);
    const total = this._service.getTotalCount();

    this._countEl.textContent = `${this._unlocked.length}/${total}`;
    this._gridEl.innerHTML = items
      .map(
        (item) => `
      <div class="achievement-item ${item.unlocked ? 'achievement-item--unlocked' : 'achievement-item--locked'}"
           title="${item.label}">
        ${item.unlocked ? item.icon : '🔒'}
      </div>`
      )
      .join('');
  }
}
