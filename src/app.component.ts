import { Component, ChangeDetectionStrategy, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GameLogoComponent } from './components/game-logo.component';
import { DailyCardComponent } from './components/daily-card.component';
import { GameButtonComponent } from './components/game-button.component';
import { ClassicGameComponent } from './components/classic-game.component';
import { AdventureMapComponent } from './components/adventure-map.component';
import { LanguageService } from './services/language.service';
import { PersistenceService } from './services/persistence.service';
import { AudioService } from './services/audio.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    GameLogoComponent,
    DailyCardComponent,
    GameButtonComponent,
    ClassicGameComponent,
    AdventureMapComponent
  ],
  templateUrl: './app.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent {
  lang = inject(LanguageService);
  persistence = inject(PersistenceService);
  audio = inject(AudioService);
  
  // Navigation State
  currentView = signal<'menu' | 'game' | 'adventure'>('menu');
  gameMode = signal<'classic' | 'adventure'>('classic');
  
  // Adventure Progression
  currentLevel = signal<number>(1);
  maxUnlockedLevel = signal<number>(1);

  constructor() {
    this.loadProgress();
  }

  // Handle Audio Context unlocking (Browser Policy)
  unlockAudioContext() {
    this.audio.unlockAudio();
  }

  loadProgress() {
    const unlocked = this.persistence.getAdventureProgress();
    this.maxUnlockedLevel.set(unlocked);
  }

  saveProgress(newLevel: number) {
    if (newLevel > this.maxUnlockedLevel()) {
      this.maxUnlockedLevel.set(newLevel);
      this.persistence.saveAdventureProgress(newLevel);
    }
  }

  // --- Menu Actions ---

  startClassicGame() {
    this.gameMode.set('classic');
    this.currentView.set('game');
  }

  startAdventure() {
    this.currentView.set('adventure');
  }

  playSpecificLevel(level: number) {
    this.currentLevel.set(level);
    this.gameMode.set('adventure');
    this.currentView.set('game');
  }

  unlockAllLevels() {
    this.saveProgress(100);
    this.audio.playWin();
  }

  // --- Game Event Handlers ---

  handleGameLost() {
    // Reset streak on loss
    this.persistence.saveCurrentStreak(0);
  }

  // Triggered when a level is beaten
  onLevelVictory() {
    const completedLevel = this.currentLevel();
    
    // Save Progress immediately upon win
    if (this.gameMode() === 'adventure') {
      const nextLevel = completedLevel + 1;
      this.saveProgress(nextLevel);
      
      // Update Streaks
      let currentStreak = this.persistence.getCurrentStreak();
      let bestStreak = this.persistence.getBestStreak();
      currentStreak++;
      this.persistence.saveCurrentStreak(currentStreak);
      if (currentStreak > bestStreak) {
         this.persistence.saveBestStreak(currentStreak);
      }
    }
    
    this.audio.playWin();
  }

  // Triggered when user clicks "Next Level" button on Victory Screen
  handleLevelComplete() {
    const nextLevel = this.currentLevel() + 1;
    
    if (nextLevel <= 100) {
      // 1. Update State
      this.currentLevel.set(nextLevel);
      // 2. Ensure Game View is active (it should be already, but safety first)
      this.currentView.set('game');
      // Note: The ClassicGameComponent detects the signal change in currentLevel and resets itself
    } else {
      // Game Finished
      this.showMenu();
    }
  }

  handleResetAdventure() {
    this.persistence.saveAdventureProgress(1);
    this.maxUnlockedLevel.set(1);
    this.showMenu();
  }

  showMenu() {
    this.currentView.set('menu');
  }
}