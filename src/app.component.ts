import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="game-container">
      <!-- HEADER ESTILIZADO -->
      <div class="header">
        <div class="score-card skewed">
          <span class="label">PONTUAÇÃO</span>
          <span class="value">{{ currentScore }}</span>
        </div>
        <div class="objective-card skewed red-bg">
          <span class="label">{{ objectiveLabel }}</span>
          <span class="value">{{ objectiveProgress }}</span>
        </div>
      </div>

      <!-- GRID DO JOGO -->
      <div class="grid-container">
        <div class="grid-board">
          <div *ngFor="let row of grid; let y = index" class="grid-row">
            <div *ngFor="let cell of row; let x = index" 
                 class="grid-cell"
                 [style.background-color]="cell || 'rgba(255,255,255,0.05)'"
                 [class.filled]="!!cell">
            </div>
          </div>
        </div>
      </div>

      <!-- DOCK DE PEÇAS (SIMPLIFICADO PARA O DEPLOY) -->
      <div class="dock">
        <div class="piece-slot skewed" *ngFor="let p of [1,2,3]">
           <div class="placeholder-piece">PEÇA</div>
        </div>
      </div>

      <!-- OVERLAY DE TUTORIAL / BRIEFING -->
      <div *ngIf="showBriefing" class="overlay briefing-active">
        <div class="briefing-box skewed-box">
          <h1 class="glitch-text">{{ briefingTitle }}</h1>
          <p>{{ briefingText }}</p>
          <button class="heist-btn" (click)="closeBriefing()">INICIAR ASSALTO</button>
        </div>
      </div>

      <!-- OVERLAY DE VITÓRIA -->
      <div *ngIf="showVictory" class="overlay victory-active">
        <div class="victory-box skewed-box">
          <h1 class="victory-text">ALVO ELIMINADO!</h1>
          <p>PROGRESSO SALVO NO SISTEMA.</p>
          <button class="heist-btn" (click)="nextLevel()">PRÓXIMO NÍVEL</button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host { --red: #d32f2f; --black: #000; --white: #fff; }
    .game-container { background: var(--black); height: 100vh; display: flex; flex-direction: column; overflow: hidden; }
    .header { display: flex; justify-content: space-around; padding: 20px; }
    .skewed { transform: skew(-10deg); border: 4px solid var(--white); padding: 10px 20px; box-shadow: 6px 6px 0 var(--red); background: var(--black); }
    .red-bg { background: var(--red); }
    .label { font-size: 0.8rem; color: #aaa; display: block; }
    .value { font-size: 1.5rem; color: var(--white); font-weight: bold; }
    .grid-container { flex: 1; display: flex; align-items: center; justify-content: center; padding: 10px; }
    .grid-board { display: grid; grid-template-rows: repeat(8, 1fr); gap: 4px; background: #222; padding: 6px; border: 4px solid var(--white); width: 90vw; height: 90vw; max-width: 400px; max-height: 400px; }
    .grid-row { display: grid; grid-template-columns: repeat(8, 1fr); gap: 4px; }
    .grid-cell { background: rgba(255,255,255,0.05); border-radius: 2px; }
    .dock { height: 120px; display: flex; justify-content: space-around; align-items: center; padding-bottom: 20px; }
    .overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.9); z-index: 1000; display: flex; align-items: center; justify-content: center; }
    .skewed-box { background: var(--red); padding: 40px; border: 6px solid var(--white); transform: skew(-5deg); text-align: center; max-width: 85%; }
    .heist-btn { margin-top: 20px; padding: 15px 30px; background: var(--white); color: var(--black); border: none; font-weight: bold; font-size: 1.2rem; cursor: pointer; transform: skew(-10deg); }
    .heist-btn:hover { background: var(--black); color: var(--white); }
  `]
})
export class AppComponent implements OnInit {
  grid: any[][] = Array(8).fill(0).map(() => Array(8).fill(null));
  currentLevel = 1;
  currentScore = 0;
  targetScore = 500;
  showBriefing = false;
  showVictory = false;
  objectiveLabel = 'META';
  objectiveProgress = '0/500';
  briefingTitle = 'ALCANCE A META!';
  briefingText = 'Obtenha a pontuação necessária para invadir o sistema.';

  ngOnInit() {
    this.currentLevel = parseInt(localStorage.getItem('adventureLevel') || '1');
    this.setupLevel();
  }

  setupLevel() {
    this.currentScore = 0;
    this.showVictory = false;
    
    if (this.currentLevel === 1) {
      this.targetScore = 500;
      this.objectiveLabel = 'META';
      this.showBriefing = true;
    } else if (this.currentLevel === 26) {
      this.objectiveLabel = 'H / V';
      this.briefingTitle = 'QUEBRA DE CÓDIGO!';
      this.briefingText = 'Limpe as linhas horizontais e verticais exigidas.';
      this.showBriefing = true;
    }
    this.updateUI();
  }

  updateUI() {
    this.objectiveProgress = `${this.currentScore}/${this.targetScore}`;
  }

  closeBriefing() { this.showBriefing = false; }

  nextLevel() {
    this.currentLevel++;
    localStorage.setItem('adventureLevel', this.currentLevel.toString());
    this.setupLevel();
  }
}
