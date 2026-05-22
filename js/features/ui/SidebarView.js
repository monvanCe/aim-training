/**
 * Personal best + rank list DOM updates (Single Responsibility).
 */
export class SidebarView {
  /**
   * @param {object} elements
   * @param {import('../stats/RankService.js').RankService} rankService
   */
  constructor(elements, rankService) {
    this._el = elements;
    this._ranks = rankService;
  }

  /**
   * @param {number|null} hps
   */
  update(hps) {
    const score = hps != null ? `${hps.toFixed(2)}/s` : '— /s';
    this._el.score.textContent = score;

    if (hps == null) {
      this._el.rankName.textContent = '—';
      this._el.progressBar.style.width = '0%';
      this._renderRankList(this._ranks.buildRankList(0));
      return;
    }

    const rank = this._ranks.getRank(hps);
    this._el.rankName.textContent = rank.name;
    this._el.progressBar.style.width = `${this._ranks.getProgressPercent(hps)}%`;
    this._renderRankList(this._ranks.buildRankList(hps));
  }

  /**
   * @param {Array} items
   */
  _renderRankList(items) {
    this._el.rankList.innerHTML = items
      .map(
        (item) => `
      <li class="${item.achieved ? 'achieved' : ''} ${item.isCurrent ? 'current' : ''}">
        <span class="rank-list__icon">${item.icon}</span>
        <span>${item.name}</span>
        <span class="rank-list__threshold">${item.thresholdLabel}</span>
      </li>`
      )
      .join('');
  }
}
