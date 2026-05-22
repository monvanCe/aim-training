/**
 * Mission complete screen (Single Responsibility).
 */
export class ResultsView {
  /**
   * @param {object} elements
   */
  constructor(elements) {
    this._el = elements;
  }

  /**
   * @param {object} result
   * @param {import('../stats/RankService.js').RankService} rankService
   */
  show(result, rankService) {
    const rank = rankService.getRank(result.hps);

    this._el.score.textContent = `${result.hps.toFixed(2)}/s`;
    this._el.rank.textContent = rank.name;
    this._el.acc.textContent = `${result.accuracy}%`;
    this._el.avg.textContent = `${result.avgTimeMs}ms`;
    this._el.hits.textContent = String(result.hits);
    this._el.duration.textContent = `${result.duration}s`;
  }
}
