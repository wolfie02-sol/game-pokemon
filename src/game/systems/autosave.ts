import { saveGame } from './save';
import type { GameState } from './state';

export type SaveNoticeKind = 'saved' | 'failed';

/**
 * Saves automatically at safe moments. The overworld reports each frame on
 * which the player is standing still with no event, menu, battle or fade in
 * progress (`safeNow`), and only then can a save be written, so a save never
 * captures half a battle or half a cutscene.
 *
 * It writes to the same slot as the menu's SAVE, so CONTINUE always resumes
 * from the newest of the two.
 */
export class Autosave {
  /** set by the overworld on frames where saving is safe */
  safeNow = false;
  /** why autosave is paused, if it is (an error was recovered from) */
  paused: string | null = null;
  notice: { kind: SaveNoticeKind; frame: number } | null = null;
  /** a message the overworld should show the player at the next safe moment */
  pendingMessage: string | null = null;
  private lastKey = '';
  private lastMap = '';
  private lastAt = -1e9;
  private lastSteps = -1;
  private failedAt = -1e9;
  private warnedFailure = false;

  /** Milestones: story flags, badges, catches and team changes. */
  private key(s: GameState): string {
    let flags = 0;
    for (const k in s.flags) if (s.flags[k]) flags++;
    const levels = s.party.reduce((a, m) => a + m.lvl, 0);
    return [flags, s.badges.length, s.caught.length, s.party.length, s.box.length, levels].join(':');
  }

  /** Treat the current state as already saved (after loading or a manual save). */
  baseline(s: GameState) {
    this.lastKey = this.key(s);
    this.lastMap = s.map;
    this.lastAt = s.playTime;
    this.lastSteps = s.steps;
  }

  /**
   * Called once per frame while the game runs. Saves when it is safe and
   * something worth keeping has happened: a milestone, a new area (at most
   * every 8 seconds of play), or two minutes of play.
   */
  tick(s: GameState | null, enabled: boolean, frame: number): boolean {
    if (!s || !enabled || this.paused || !this.safeNow) return false;
    if (s.playTime - this.failedAt < 60) return false;
    const key = this.key(s);
    const milestone = key !== this.lastKey;
    const newArea = s.map !== this.lastMap && s.playTime - this.lastAt >= 8;
    const periodic = s.playTime - this.lastAt >= 120 && s.steps !== this.lastSteps;
    if (!milestone && !newArea && !periodic) return false;
    return this.write(s, frame);
  }

  /** Save now if it is safe and anything changed (used when the page is being hidden or closed). */
  flush(s: GameState | null, enabled: boolean, frame: number): boolean {
    if (!s || !enabled || this.paused || !this.safeNow) return false;
    if (this.key(s) === this.lastKey && s.map === this.lastMap && s.steps === this.lastSteps) return false;
    return this.write(s, frame);
  }

  private write(s: GameState, frame: number): boolean {
    if (saveGame(s)) {
      this.baseline(s);
      this.notice = { kind: 'saved', frame };
      return true;
    }
    this.failedAt = s.playTime;
    this.notice = { kind: 'failed', frame };
    if (!this.warnedFailure) {
      this.warnedFailure = true;
      this.pendingMessage =
        "Autosave failed: this browser isn't letting the game store data (private browsing, or storage is full or blocked). Your progress is NOT being saved on this device.";
    }
    return false;
  }

  /** After an error the current state may be inconsistent, so stop writing it until the player saves on purpose. */
  pause(reason: string) {
    this.paused = reason;
  }

  /** A manual save resumes autosaving. */
  resume(s: GameState) {
    this.paused = null;
    this.baseline(s);
  }
}
