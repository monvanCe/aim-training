import { ReplayPlayer } from '../replay/ReplayPlayer.js';

/**
 * Modal for replaying a saved test session (play / pause).
 */
export class ReplayView {
  #player = null;

  /**
   * @param {object} dom
   */
  constructor(dom) {
    this.modal = dom.modalReplay;
    this.canvas = dom.replayCanvas;
    this.title = dom.replayTitle;
    this.meta = dom.replayMeta;
    this.timeEl = dom.replayTime;
    this.btnPlay = dom.btnReplayPlay;
    this.btnClose = dom.btnCloseReplay;

    this.btnPlay.addEventListener('click', () => this.#togglePlay());
    this.btnClose.addEventListener('click', () => this.close());
    this.modal.addEventListener('click', (e) => {
      if (e.target === this.modal) this.close();
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !this.modal.hidden) this.close();
    });
  }

  /**
   * @param {object} entry — recent test summary
   * @param {object} replayData
   */
  open(entry, replayData) {
    this.close();
    this.title.textContent = 'Session Replay';
    const time = new Date(entry.timestamp).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
    this.meta.textContent = `${entry.hps.toFixed(2)}/s · ${entry.accuracy}% acc · ${entry.hits} hits · ${time}`;

    this.modal.hidden = false;
    const wrap = this.canvas.parentElement;
    requestAnimationFrame(() => {
      this.#player = new ReplayPlayer(replayData, this.canvas, {
        wrap,
        onTimeUpdate: (ms, durationMs) => this.#updateTime(ms, durationMs),
      });
      this.#player.paint();
      this.#setPlayLabel(false);
    });
  }

  close() {
    this.modal.hidden = true;
    if (this.#player) {
      this.#player.destroy();
      this.#player = null;
    }
  }

  #togglePlay() {
    if (!this.#player) return;
    const playing = this.#player.togglePlayPause();
    this.#setPlayLabel(playing);
  }

  #setPlayLabel(playing) {
    this.btnPlay.textContent = playing ? 'Pause' : 'Play';
    this.btnPlay.setAttribute('aria-label', playing ? 'Pause replay' : 'Play replay');
  }

  #updateTime(ms, durationMs) {
    const fmt = (v) => {
      const s = Math.floor(v / 1000);
      const tenths = Math.floor((v % 1000) / 100);
      return `${s}.${tenths}s`;
    };
    this.timeEl.textContent = `${fmt(ms)} / ${fmt(durationMs)}`;

    if (this.#player && !this.#player.isPlaying && this.#player.isAtEnd) {
      this.#setPlayLabel(false);
    }
  }
}
