import { SidebarView } from './SidebarView.js';
import { RecentTestsView } from './RecentTestsView.js';
import { AchievementsView } from './AchievementsView.js';
import { ResultsView } from './ResultsView.js';
import { GameHUD } from './GameHUD.js';

/**
 * Coordinates all UI feature views (facade — keeps main.js thin).
 */
export class UIController {
  /**
   * @param {object} dom
   * @param {import('../stats/StatsManager.js').StatsManager} statsManager
   * @param {import('../achievements/AchievementService.js').AchievementService} achievementService
   */
  constructor(dom, statsManager, achievementService) {
    const ranks = statsManager.rankService;

    this.sessionPlay = dom.sessionPlay;
    this.sessionResults = dom.sessionResults;
    this.btnStop = dom.btnStop;
    this.btnRetry = dom.btnRetry;

    this.hud = new GameHUD({
      time: dom.hudTime,
      score: dom.hudScore,
      acc: dom.hudAcc,
    });

    this.sidebar = new SidebarView(
      {
        score: dom.pbScore,
        rankName: dom.pbRank,
        progressBar: dom.pbProgressBar,
        rankList: dom.rankList,
      },
      ranks
    );

    this.recent = new RecentTestsView(dom.recentList);

    this.achievements = new AchievementsView({
      tabsEl: dom.achievementTabs,
      gridEl: dom.achievementGrid,
      countEl: dom.achievementCount,
      achievementService,
    });

    this.achievements.bindTabs();

    this.results = new ResultsView({
      score: dom.resultScore,
      rank: dom.resultRank,
      acc: dom.resultAcc,
      avg: dom.resultAvg,
      hits: dom.resultHits,
      duration: dom.resultDuration,
    });

    this._ranks = ranks;
    this._stats = statsManager;
    this._achievements = achievementService;
  }

  refreshStaticPanels() {
    const pb = this._stats.getPersonalBest();
    const hps = pb?.hps ?? null;
    this.sidebar.update(hps);
    const tests = this._stats.getRecentTests();
    const replayIds = this._stats.getReplayIds();
    this.recent.setReplayIds(replayIds);
    this.recent.render(tests);

    const unlocked = this._achievements.getUnlockedIds();
    this.achievements.setUnlocked(unlocked);
  }

  showGame() {
    this.sessionPlay.hidden = false;
    this.sessionResults.hidden = true;
    this.btnStop.hidden = false;
    this.btnRetry.hidden = true;
  }

  /**
   * @param {object} result
   */
  showResults(result) {
    this.results.show(result, this._ranks);
    this.hud.showSessionResult(result);

    const pb = this._stats.getPersonalBest();
    this.sidebar.update(pb?.hps ?? result.hps);

    this.sessionPlay.hidden = true;
    this.sessionResults.hidden = false;
    this.btnStop.hidden = true;
    this.btnRetry.hidden = false;

    this.refreshStaticPanels();
  }
}
