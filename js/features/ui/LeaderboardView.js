/**
 * Leaderboard button, modals, and welcome toast.
 */
export class LeaderboardView {
  /**
   * @param {object} dom
   * @param {import('../leaderboard/LeaderboardService.js').LeaderboardService} leaderboardService
   * @param {import('../leaderboard/PlayerIdentityService.js').PlayerIdentityService} identityService
   */
  constructor(dom, leaderboardService, identityService) {
    this._leaderboard = leaderboardService;
    this._identity = identityService;

    this.btnOpen = dom.btnLeaderboard;
    this.modalLeaderboard = dom.modalLeaderboard;
    this.leaderboardList = dom.leaderboardList;
    this.leaderboardStatus = dom.leaderboardStatus;
    this.leaderboardYou = dom.leaderboardYou;
    this.btnCloseLeaderboard = dom.btnCloseLeaderboard;

    this.modalUsername = dom.modalUsername;
    this.usernameInput = dom.usernameInput;
    this.usernameError = dom.usernameError;
    this.btnSaveUsername = dom.btnSaveUsername;

    this.toastWelcome = dom.toastWelcome;
    this.toastWelcomeText = dom.toastWelcomeText;

    this._onRegister = null;

    this.btnOpen.addEventListener('click', () => this.openLeaderboard());
    this.btnCloseLeaderboard.addEventListener('click', () => this.closeLeaderboard());
    this.modalLeaderboard.addEventListener('click', (e) => {
      if (e.target === this.modalLeaderboard) this.closeLeaderboard();
    });

    this.btnSaveUsername.addEventListener('click', () => this.#submitUsername());
    this.usernameInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') this.#submitUsername();
    });

    document.addEventListener('keydown', (e) => {
      if (e.key !== 'Escape') return;
      if (!this.modalLeaderboard.hidden) this.closeLeaderboard();
      if (!this.modalUsername.hidden) return;
    });
  }

  /**
   * @param {(username: string) => Promise<void>} handler
   */
  onRegister(handler) {
    this._onRegister = handler;
  }

  showUsernamePrompt() {
    this.usernameError.hidden = true;
    this.usernameInput.value = '';
    this.modalUsername.hidden = false;
    this.usernameInput.focus();
  }

  hideUsernamePrompt() {
    this.modalUsername.hidden = true;
  }

  /**
   * @param {string} username
   */
  showWelcome(username) {
    this.toastWelcomeText.textContent = `Welcome back, ${username}!`;
    this.toastWelcome.hidden = false;
    window.setTimeout(() => {
      this.toastWelcome.hidden = true;
    }, 4000);
  }

  async openLeaderboard() {
    this.modalLeaderboard.hidden = false;
    this.leaderboardList.innerHTML = '';
    this.leaderboardYou.textContent = '';
    this.leaderboardStatus.hidden = false;
    this.leaderboardStatus.textContent = 'Loading…';

    try {
      const entries = await this._leaderboard.fetchTop();
      this.leaderboardStatus.hidden = true;

      if (entries.length === 0) {
        this.leaderboardList.innerHTML =
          '<p class="empty-state">No scores yet. Play a round to claim the top spot!</p>';
      } else {
        this.leaderboardList.innerHTML = entries
          .map((row) => this.#rowHtml(row))
          .join('');
      }

      const profile = this._identity.profile;
      if (profile?.username) {
        const mine = entries.find((e) => e.visitorId === this._identity.visitorId);
        const rankText = mine ? `#${mine.rank}` : 'Unranked';
        this.leaderboardYou.textContent = `You: ${profile.username} · ${profile.bestHps.toFixed(2)}/s · ${rankText}`;
      }
    } catch (err) {
      this.leaderboardStatus.hidden = false;
      this.leaderboardStatus.textContent =
        err?.message?.includes('email') || err?.message?.includes('verified')
          ? 'Leaderboard is offline until the KVdb account email is verified.'
          : 'Could not load leaderboard. Try again later.';
    }
  }

  closeLeaderboard() {
    this.modalLeaderboard.hidden = true;
  }

  #rowHtml({ rank, username, bestHps, visitorId }) {
    const medal =
      rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `${rank}.`;
    const you =
      visitorId === this._identity.visitorId ? ' leaderboard-row--you' : '';
    return `<div class="leaderboard-row${you}">
      <span class="leaderboard-row__rank">${medal}</span>
      <span class="leaderboard-row__name">${this.#escape(username)}</span>
      <span class="leaderboard-row__score">${bestHps.toFixed(2)}/s</span>
    </div>`;
  }

  #escape(text) {
    return String(text)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  async #submitUsername() {
    const name = this.usernameInput.value.trim();
    const valid = /^[a-zA-Z0-9_]{2,16}$/.test(name);

    if (!valid) {
      this.usernameError.hidden = false;
      this.usernameError.textContent =
        'Use 2–16 characters: letters, numbers, or underscores.';
      return;
    }

    this.usernameError.hidden = true;
    this.btnSaveUsername.disabled = true;

    try {
      if (this._onRegister) await this._onRegister(name);
      this.hideUsernamePrompt();
    } catch (err) {
      this.usernameError.hidden = false;
      this.usernameError.textContent =
        err?.message?.includes('email') || err?.message?.includes('verified')
          ? 'Cannot save yet — verify your KVdb account email first.'
          : 'Could not save username. Try again.';
    } finally {
      this.btnSaveUsername.disabled = false;
    }
  }
}
