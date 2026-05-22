import { EventBus } from './core/EventBus.js';
import { FlickMode } from './features/game-engine/FlickMode.js';
import { GameEngine } from './features/game-engine/GameEngine.js';
import { CanvasRenderer } from './features/rendering/CanvasRenderer.js';
import { StatsManager } from './features/stats/StatsManager.js';
import { AchievementService } from './features/achievements/AchievementService.js';
import { UIController } from './features/ui/UIController.js';

const bus = new EventBus();
const statsManager = new StatsManager();
const achievementService = new AchievementService();

const canvas = document.getElementById('game-canvas');
const renderer = new CanvasRenderer(canvas);

const ui = new UIController(
  {
    gameView: document.getElementById('game-view'),
    resultsView: document.getElementById('results-view'),
    hudTime: document.getElementById('hud-time'),
    hudScore: document.getElementById('hud-score'),
    hudAcc: document.getElementById('hud-acc'),
    pbScore: document.getElementById('pb-score'),
    pbRank: document.getElementById('pb-rank'),
    pbProgressBar: document.getElementById('pb-progress-bar'),
    rankList: document.getElementById('rank-list'),
    recentList: document.getElementById('recent-list'),
    achievementTabs: document.getElementById('achievement-tabs'),
    achievementGrid: document.getElementById('achievement-grid'),
    achievementCount: document.getElementById('achievement-count'),
    resultScore: document.getElementById('result-score'),
    resultRank: document.getElementById('result-rank'),
    resultAcc: document.getElementById('result-acc'),
    resultAvg: document.getElementById('result-avg'),
    resultHits: document.getElementById('result-hits'),
    resultDuration: document.getElementById('result-duration'),
    resultPbScore: document.getElementById('result-pb-score'),
    resultPbRank: document.getElementById('result-pb-rank'),
    resultPbProgressBar: document.getElementById('result-pb-progress-bar'),
    resultRankList: document.getElementById('result-rank-list'),
    recentListResults: document.getElementById('recent-list-results'),
    achievementTabsResults: document.getElementById('achievement-tabs-results'),
    achievementGridResults: document.getElementById('achievement-grid-results'),
    achievementCountResults: document.getElementById('achievement-count-results'),
  },
  statsManager,
  achievementService
);

const flickMode = new FlickMode();

const engine = new GameEngine(flickMode, {
  onTick: (tick) => {
    ui.hud.update(tick);
    renderer.render(tick.targets, engine.targets.radius);
  },
  onStateChange: (state) => {
    if (state === 'finished') {
      handleSessionEnd();
    }
  },
});

function setupCanvas() {
  const wrap = canvas.parentElement;
  const width = wrap.clientWidth || 640;
  const height = Math.round(width * 0.625);
  const size = renderer.resize(width, height);
  engine.setup(size.width, size.height);
}

function handleSessionEnd() {
  const result = engine.getResults();
  const { entry, isNewBest } = statsManager.saveSession(result);

  const pb = statsManager.getPersonalBest();
  const recent = statsManager.getRecentTests();

  const agg = statsManager.getAchievementStats();

  achievementService.evaluate({
    bestHps: pb?.hps ?? result.hps,
    lastHps: result.hps,
    lastHits: result.hits,
    lastMisses: result.misses,
    lastAccuracy: result.accuracy,
    lastAvgMs: result.avgTimeMs,
    sessionCount: agg.sessionCount,
    totalHits: agg.totalHits,
    maxHits: Math.max(agg.maxHits, result.hits),
    bestAccuracy: Math.max(agg.bestAccuracy, result.accuracy),
    bestAvgMs: agg.bestAvgMs,
    sessions95: agg.sessions95,
    accuracyStreak90: agg.accuracyStreak90,
    isNewBest,
  });

  bus.emit('session:complete', { result, entry });
  ui.showResults(result);
}

function startGame() {
  ui.showGame();
  setupCanvas();
  engine.start();
}

function resetBest() {
  if (confirm('Reset your personal best?')) {
    statsManager.resetPersonalBest();
    ui.refreshStaticPanels();
  }
}

canvas.addEventListener('pointerdown', (e) => {
  if (e.button !== 0) return;
  e.preventDefault();
  const { x, y } = renderer.toCanvasCoords(e.clientX, e.clientY);
  engine.handleClick(x, y);
});

document.getElementById('btn-stop').addEventListener('click', () => engine.stop());
document.getElementById('btn-retry').addEventListener('click', startGame);
document.getElementById('btn-menu').addEventListener('click', () => {
  engine.resetToIdle();
  ui.showGame();
  renderer.clear();
  setupCanvas();
});
document.getElementById('btn-reset-best').addEventListener('click', resetBest);
document.getElementById('btn-reset-best-results').addEventListener('click', resetBest);

window.addEventListener('resize', () => {
  if (engine.state === 'running') return;
  setupCanvas();
  renderer.clear();
});

ui.refreshStaticPanels();
requestAnimationFrame(() => {
  setupCanvas();
  startGame();
});
