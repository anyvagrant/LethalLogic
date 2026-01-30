import { Component, ChangeDetectionStrategy, signal, computed, effect, inject } from '@angular/core';
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
  
  currentView = signal<'menu' | 'game' | 'adventure'>('menu');
  gameMode = signal<'classic' | 'adventure'>('classic');
  
  // Adventure State
  currentLevel = signal<number>(1);
  maxUnlockedLevel = signal<number>(1);

  constructor() {
    this.loadProgress();
  }

  // Called on any click on the root div to respect browser autoplay policies
  unlockAudioContext() {
    this.audio.unlockAudio();
  }

  loadProgress() {
    const unlocked = this.persistence.getAdventureProgress();
    this.maxUnlockedLevel.set(unlocked);
  }

  saveProgress(newMax: number) {
    if (newMax > this.maxUnlockedLevel()) {
      this.maxUnlockedLevel.set(newMax);
      this.persistence.saveAdventureProgress(newMax);
      console.log("Progresso salvo: Nível " + newMax + " desbloqueado");
    }
  }

  unlockAllLevels() {
    this.saveProgress(100);
    this.audio.playWin(); // Feedback
  }

  startClassicGame() {
    this.gameMode.set('classic');
    this.currentView.set('game');
  }

  startAdventure() {
    this.currentView.set('adventure');
  }

  playSpecificLevel(level: number) {
    console.log(`Starting Level ${level}`);
    this.currentLevel.set(level);
    this.gameMode.set('adventure');
    this.currentView.set('game');
  }

  handleGameLost() {
    // Reset streak on any loss
    this.persistence.saveCurrentStreak(0);
    console.log("Game Lost. Streak Reset.");
  }

  onLevelVictory() {
    const completedLevel = this.currentLevel();
    // Logic for Level 100 specifically handled in component UI, but data save happens here
    const nextLevel = completedLevel + 1;
    this.saveProgress(nextLevel);
    
    // Play Win Sound
    this.audio.playWin();

    // Streak Logic (Only counts if adventure, but prompt says "On Level Win (Adventure Mode)")
    if (this.gameMode() === 'adventure') {
      let currentStreak = this.persistence.getCurrentStreak();
      let bestStreak = this.persistence.getBestStreak();
      
      currentStreak++;
      this.persistence.saveCurrentStreak(currentStreak);
      
      console.log("Victory! Current Streak:", currentStreak, "Best Streak:", bestStreak);

      if (currentStreak > bestStreak) {
         this.persistence.saveBestStreak(currentStreak);
         console.log("New Record Set!");
      }
    }
  }

  handleLevelComplete() {
    // Called when user clicks "Next Level" in the victory screen
    const nextLevel = this.currentLevel() + 1;
    if (nextLevel <= 100) {
      this.playSpecificLevel(nextLevel);
    } else {
      // Finished the game
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

  showMap() {
    this.currentView.set('adventure');
  }
}