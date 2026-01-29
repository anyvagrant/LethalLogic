import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class PersistenceService {
  private readonly KEYS = {
    ADVENTURE_PROGRESS: 'adventureProgress',
    LEGACY_ADVENTURE: 'blockBlastMaxLevel', // Fallback for existing users
    CLASSIC_HIGH_SCORE: 'blockBlastHighScore',
    CURRENT_STREAK: 'blockBlastCurrentStreak',
    BEST_STREAK: 'blockBlastBestStreak',
    LANGUAGE: 'gameLanguage',
    IS_MUTED: 'gameIsMuted'
  };

  /**
   * Saves the highest unlocked level in Adventure Mode.
   */
  saveAdventureProgress(level: number): void {
    this.setItem(this.KEYS.ADVENTURE_PROGRESS, level);
  }

  /**
   * Retrieves the adventure progress. Defaults to 1.
   * Checks legacy key if new key doesn't exist.
   */
  getAdventureProgress(): number {
    const val = this.getInt(this.KEYS.ADVENTURE_PROGRESS, -1);
    if (val === -1) {
      // Try legacy
      return this.getInt(this.KEYS.LEGACY_ADVENTURE, 1);
    }
    return val;
  }

  /**
   * Saves the Classic Mode High Score.
   */
  saveClassicHighScore(score: number): void {
    this.setItem(this.KEYS.CLASSIC_HIGH_SCORE, score);
  }

  getClassicHighScore(): number {
    return this.getInt(this.KEYS.CLASSIC_HIGH_SCORE, 0);
  }

  /**
   * Saves the current win streak.
   */
  saveCurrentStreak(streak: number): void {
    this.setItem(this.KEYS.CURRENT_STREAK, streak);
  }

  getCurrentStreak(): number {
    return this.getInt(this.KEYS.CURRENT_STREAK, 0);
  }

  /**
   * Saves the best win streak (record).
   */
  saveBestStreak(streak: number): void {
    this.setItem(this.KEYS.BEST_STREAK, streak);
  }

  getBestStreak(): number {
    return this.getInt(this.KEYS.BEST_STREAK, 0);
  }

  /**
   * Saves the selected language ('pt' or 'en').
   */
  saveLanguage(lang: string): void {
    this.setItem(this.KEYS.LANGUAGE, lang);
  }

  getLanguage(): string {
    return this.getString(this.KEYS.LANGUAGE, 'pt');
  }

  /**
   * Saves the mute state.
   */
  saveMuteState(isMuted: boolean): void {
    this.setItem(this.KEYS.IS_MUTED, isMuted);
  }

  getMuteState(): boolean {
    return this.getString(this.KEYS.IS_MUTED, 'false') === 'true';
  }

  // --- Internal Helper Methods ---

  private setItem(key: string, value: any): void {
    try {
      localStorage.setItem(key, value.toString());
    } catch (e) {
      console.warn('PersistenceService: Failed to save data', e);
    }
  }

  private getInt(key: string, defaultValue: number): number {
    try {
      const val = localStorage.getItem(key);
      if (val === null) return defaultValue;
      const parsed = parseInt(val, 10);
      return isNaN(parsed) ? defaultValue : parsed;
    } catch (e) {
      console.warn('PersistenceService: Failed to load number', e);
      return defaultValue;
    }
  }

  private getString(key: string, defaultValue: string): string {
    try {
      return localStorage.getItem(key) || defaultValue;
    } catch (e) {
      console.warn('PersistenceService: Failed to load string', e);
      return defaultValue;
    }
  }
}