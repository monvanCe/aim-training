/**
 * Achievement tabs + list (Single Responsibility).
 */
export class AchievementsView {
  /**
   * @param {object} config
   */
  constructor({ tabsEl, gridEl, countEl, achievementService, onCategoryChange }) {
    this._tabsEl = tabsEl;
    this._gridEl = gridEl;
    this._countEl = countEl;
    this._service = achievementService;
    this._onCategoryChange = onCategoryChange;
    this._activeCategory = 'rank';
    this._unlocked = [];
  }

  setUnlocked(ids) {
    this._unlocked = ids;
    this.render();
  }

  setActiveCategory(categoryId) {
    this._activeCategory = categoryId;
    this._tabsEl.querySelectorAll('.tab').forEach((t) => {
      t.classList.toggle('tab--active', t.dataset.category === categoryId);
    });
    this.render();
  }

  render() {
    const items = this._service.getForCategory(this._activeCategory, this._unlocked);
    const total = this._service.getTotalCount();
    const unlockedTotal = this._service.getUnlockedIds().length;

    this._countEl.textContent = `${unlockedTotal}/${total}`;
    this._gridEl.innerHTML = items
      .map(
        (item) => `
      <div class="achievement-row ${item.unlocked ? 'achievement-row--unlocked' : 'achievement-row--locked'}">
        <span class="achievement-row__icon" aria-hidden="true">${item.unlocked ? item.icon : '🔒'}</span>
        <div class="achievement-row__body">
          <span class="achievement-row__label">${item.label}</span>
          <span class="achievement-row__desc">${item.description}</span>
        </div>
      </div>`
      )
      .join('');
  }

  bindTabs() {
    this._tabsEl.addEventListener('click', (e) => {
      const tab = e.target.closest('.tab');
      if (!tab?.dataset.category) return;
      this._activeCategory = tab.dataset.category;
      this._tabsEl.querySelectorAll('.tab').forEach((t) => {
        t.classList.toggle('tab--active', t === tab);
      });
      this._onCategoryChange?.(this._activeCategory);
      this.render();
    });
  }
}
