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

    this.gameView = dom.gameView;
    this.resultsView = dom.resultsView;

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

    this.sidebarResults = new SidebarView(
      {
        score: dom.resultPbScore,
        rankName: dom.resultPbRank,
        progressBar: dom.resultPbProgressBar,
        rankList: dom.resultRankList,
      },
      ranks
    );

    this.recentGame = new RecentTestsView(dom.recentList);
    this.recentResults = new RecentTestsView(dom.recentListResults);

    this.achievementsGame = new AchievementsView({
      tabsEl: dom.achievementTabs,
      gridEl: dom.achievementGrid,
      countEl: dom.achievementCount,
      achievementService,
    });

    this.achievementsResults = new AchievementsView({
      tabsEl: dom.achievementTabsResults,
      gridEl: dom.achievementGridResults,
      countEl: dom.achievementCountResults,
      achievementService,
      onCategoryChange: (category) => this.achievementsGame.setActiveCategory(category),
    });

    this.achievementsGame.bindTabs();
    this.achievementsResults.bindTabs();

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
    this.sidebarResults.update(hps);
    const tests = this._stats.getRecentTests();
    const replayIds = this._stats.getReplayIds();
    this.recentGame.setReplayIds(replayIds);
    this.recentResults.setReplayIds(replayIds);
    this.recentGame.render(tests);
    this.recentResults.render(tests);

    const unlocked = this._achievements.getUnlockedIds();
    this.achievementsGame.setUnlocked(unlocked);
    this.achievementsResults.setUnlocked(unlocked);
  }

  showGame() {
    this.gameView.classList.add('view--active');
    this.gameView.classList.remove('view--hidden');
    this.resultsView.classList.remove('view--active');
    this.resultsView.classList.add('view--hidden');
  }

  showResults(result) {
    this.results.show(result, this._ranks);
    const pb = this._stats.getPersonalBest();
    this.sidebarResults.update(pb?.hps ?? result.hps);

    this.gameView.classList.remove('view--active');
    this.gameView.classList.add('view--hidden');
    this.resultsView.classList.add('view--active');
    this.resultsView.classList.remove('view--hidden');
    this.refreshStaticPanels();
  }
}
