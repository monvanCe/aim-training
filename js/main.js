import { EventBus } from './core/EventBus.js';
import { FlickMode } from './features/game-engine/FlickMode.js';
import { GameEngine } from './features/game-engine/GameEngine.js';
import { CanvasRenderer } from './features/rendering/CanvasRenderer.js';
import { StatsManager } from './features/stats/StatsManager.js';
import { AchievementService } from './features/achievements/AchievementService.js';
import { UIController } from './features/ui/UIController.js';
import { PlayerIdentityService } from './features/leaderboard/PlayerIdentityService.js';
import { LeaderboardService } from './features/leaderboard/LeaderboardService.js';
import { LeaderboardView } from './features/ui/LeaderboardView.js';
import { ReplayView } from './features/ui/ReplayView.js';
import { SessionRecorder } from './features/replay/SessionRecorder.js';

const bus = new EventBus();
const statsManager = new StatsManager();
const achievementService = new AchievementService();
const playerIdentity = new PlayerIdentityService();
const leaderboardService = new LeaderboardService();

const leaderboardView = new LeaderboardView(
  {
    btnLeaderboard: document.getElementById('btn-leaderboard'),
    modalLeaderboard: document.getElementById('modal-leaderboard'),
    leaderboardList: document.getElementById('leaderboard-list'),
    leaderboardStatus: document.getElementById('leaderboard-status'),
    leaderboardYou: document.getElementById('leaderboard-you'),
    btnCloseLeaderboard: document.getElementById('btn-close-leaderboard'),
    modalUsername: document.getElementById('modal-username'),
    usernameInput: document.getElementById('username-input'),
    usernameError: document.getElementById('username-error'),
    btnSaveUsername: document.getElementById('btn-save-username'),
    toastWelcome: document.getElementById('toast-welcome'),
    toastWelcomeText: document.getElementById('toast-welcome-text'),
  },
  leaderboardService,
  playerIdentity
);

const cloudStatus = document.getElementById('cloud-status');
const cloudSpinner = cloudStatus.querySelector('.cloud-status__spinner');
const cloudTick = cloudStatus.querySelector('.cloud-status__tick');
let cloudStatusTimer = null;

/** @param {'idle' | 'loading' | 'success'} state */
function setCloudStatus(state) {
  clearTimeout(cloudStatusTimer);
  if (state === 'idle') {
    cloudStatus.hidden = true;
    cloudSpinner.hidden = true;
    cloudTick.hidden = true;
    cloudStatus.removeAttribute('aria-busy');
    cloudStatus.removeAttribute('aria-label');
    return;
  }
  cloudStatus.hidden = false;
  cloudSpinner.hidden = state !== 'loading';
  cloudTick.hidden = state !== 'success';
  cloudStatus.setAttribute('aria-busy', state === 'loading' ? 'true' : 'false');
  cloudStatus.setAttribute(
    'aria-label',
    state === 'loading' ? 'Syncing with server' : 'Saved'
  );
}

function showCloudSuccessThenHide(ms = 2000) {
  setCloudStatus('success');
  cloudStatusTimer = setTimeout(() => setCloudStatus('idle'), ms);
}

function setGameLocked(locked) {
  document.body.classList.toggle('is-game-locked', locked);
}

let resolveRegistration = null;

leaderboardView.onRegister(async (username) => {
  setCloudStatus('loading');
  try {
    await playerIdentity.register(username);
    showCloudSuccessThenHide();
    leaderboardView.hideUsernamePrompt();
    resolveRegistration?.();
    resolveRegistration = null;
  } catch {
    setCloudStatus('idle');
    throw new Error('Could not save username');
  }
});

const canvas = document.getElementById('game-canvas');
const renderer = new CanvasRenderer(canvas);

const ui = new UIController(
  {
    sessionPlay: document.getElementById('session-play'),
    sessionResults: document.getElementById('session-results'),
    btnStop: document.getElementById('btn-stop'),
    btnRetry: document.getElementById('btn-retry'),
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
  },
  statsManager,
  achievementService
);

const replayView = new ReplayView({
  modalReplay: document.getElementById('modal-replay'),
  replayCanvas: document.getElementById('replay-canvas'),
  replayTitle: document.getElementById('modal-replay-title'),
  replayMeta: document.getElementById('replay-meta'),
  replayTime: document.getElementById('replay-time'),
  btnReplayPlay: document.getElementById('btn-replay-play'),
  btnCloseReplay: document.getElementById('btn-close-replay'),
});

const sessionRecorder = new SessionRecorder();
const flickMode = new FlickMode();

const engine = new GameEngine(flickMode, {
  recorder: sessionRecorder,
  onTick: (tick) => {
    ui.hud.update(tick);
    renderer.render(tick.targets, engine.targets.radius);
  },
  onStateChange: (state) => {
    if (state === 'finished') {
      void handleSessionEnd();
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

async function handleSessionEnd() {
  const result = engine.getResults();
  const { entry, isNewBest } = statsManager.saveSession(result);
  const recording = engine.getRecording();
  if (recording) {
    statsManager.saveReplay(entry.id, recording);
  }

  const pb = statsManager.getPersonalBest();

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

  if (isNewBest && playerIdentity.shouldSyncBestScore(result.hps)) {
    setCloudStatus('loading');
    try {
      await playerIdentity.updateBestScore(result.hps);
      showCloudSuccessThenHide();
    } catch {
      setCloudStatus('idle');
    }
  }
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

const canvasWrap = canvas.parentElement;

canvasWrap.addEventListener('pointermove', (e) => {
  if (engine.state !== 'running' || !engine.timerStarted) return;
  const { x, y } = renderer.toCanvasCoords(e.clientX, e.clientY);
  sessionRecorder.maybeRecordMouse(x, y);
});

canvas.addEventListener('pointerdown', (e) => {
  if (e.button !== 0) return;
  e.preventDefault();
  const { x, y } = renderer.toCanvasCoords(e.clientX, e.clientY);
  engine.handleClick(x, y);
  if (engine.timerStarted) {
    canvas.setPointerCapture(e.pointerId);
  }
});

canvas.addEventListener('pointerup', (e) => {
  if (canvas.hasPointerCapture(e.pointerId)) {
    canvas.releasePointerCapture(e.pointerId);
  }
});

canvas.addEventListener('pointercancel', (e) => {
  if (canvas.hasPointerCapture(e.pointerId)) {
    canvas.releasePointerCapture(e.pointerId);
  }
});

function openReplay(sessionId) {
  const tests = statsManager.getRecentTests();
  const entry = tests.find((t) => t.id === sessionId);
  const replayData = statsManager.getReplay(sessionId);
  if (!entry || !replayData) return;
  replayView.open(entry, replayData);
}

ui.recent.setReplayHandler(openReplay);

document.getElementById('btn-stop').addEventListener('click', () => engine.stop());
document.getElementById('btn-retry').addEventListener('click', startGame);
document.getElementById('btn-reset-best').addEventListener('click', resetBest);

window.addEventListener('resize', () => {
  if (engine.state === 'running') return;
  setupCanvas();
  renderer.clear();
});

ui.refreshStaticPanels();

async function boot() {
  setGameLocked(true);
  setCloudStatus('loading');

  const { profile, isNew } = await playerIdentity.init();

  if (isNew) {
    setCloudStatus('idle');
    leaderboardView.showUsernamePrompt();
    await new Promise((resolve) => {
      resolveRegistration = resolve;
    });
  } else {
    if (profile?.username) {
      leaderboardView.showWelcome(profile.username);
    }
    showCloudSuccessThenHide();
  }

  setGameLocked(false);

  requestAnimationFrame(() => {
    setupCanvas();
    startGame();
  });
}

boot();
