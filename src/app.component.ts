import { Component, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="game-container" [class.persona-theme]="true">
      <!-- HEADER -->
      <div class="header">
        <div class="score-box skewed">
          <span class="label">{{ isEnglish ? 'SCORE' : 'PONTOS' }}</span>
          <span class="value">{{ currentScore }}</span>
        </div>
        <div class="objective-box skewed highlight">
          <span class="label">{{ objectiveLabel }}</span>
          <span class="value">{{ objectiveProgress }}</span>
        </div>
      </div>

      <!-- GRID PRINCIPAL -->
      <div class="grid-wrapper">
        <div class="grid shadow-layer"></div>
        <div class="grid main-layer">
          <div *ngFor="let row of grid; let y = index" class="row">
            <div *ngFor="let cell of row; let x = index" 
                 class="cell" 
                 [style.background-color]="cell ? cell : 'transparent'"
                 [class.has-block]="cell !== null">
            </div>
          </div>
        </div>
      </div>

      <!-- DOCK DE PEÇAS -->
      <div class="dock">
        <div *ngFor="let piece of dock; let i = index" class="piece-slot">
          <!-- Renderização simplificada das peças aqui -->
          <div (mousedown)="onDragStart($event, i)" (touchstart)="onDragStart($event, i)" class="draggable-piece">
             <!-- Blocos da peça -->
          </div>
        </div>
      </div>

      <!-- OVERLAY DE BRIEFING (TUTORIAL) -->
      <div *ngIf="showBriefing" class="overlay briefing-overlay">
        <div class="briefing-content skewed-bg">
          <h1 class="jagged-text">{{ briefingTitle }}</h1>
          <p>{{ briefingText }}</p>
          <button class="action-btn" (click)="startMission()">INICIAR ASSALTO</button>
        </div>
      </div>

      <!-- OVERLAY DE VITÓRIA -->
      <div *ngIf="showVictory" class="overlay victory-overlay">
        <div class="victory-content skewed-bg">
          <h1 class="jagged-text">SUCESSO NO ROUBO!</h1>
          <p>ALVO ELIMINADO COM SUCESSO.</p>
          <div class="btn-group">
            <button class="action-btn" (click)="nextLevel()">PRÓXIMO NÍVEL</button>
            <button class="action-btn secondary" (click)="goToMenu()">MENU</button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    /* O CSS do Persona 5 que você já tem deve ser mantido aqui */
    .game-container { background: #000; color: #fff; height: 100vh; overflow: hidden; font-family: 'Impact', sans-serif; }
    .skewed-bg { background: #d32f2f; transform: skew(-5deg); padding: 40px; border: 5px solid #fff; box-shadow: 10px 10px 0 #000; }
    .jagged-text { text-transform: uppercase; font-size: 3rem; color: #fff; text-shadow: 4px 4px 0 #000; }
    .overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.9); display: flex; align-items: center; justify-content: center; z-index: 1000; }
    .action-btn { background: #fff; color: #000; border: none; padding: 15px 30px; font-weight: bold; cursor: pointer; transform: skew(-10deg); margin: 10px; }
    .action-btn:active { background: #d32f2f; color: #fff; }
    .header { display: flex; justify-content: space-around; padding: 20px; }
    /* Adicione o resto do seu CSS aqui */
  `]
})
export class AppComponent implements OnInit {
  currentLevel = 1;
  currentScore = 0;
  targetScore = 0;
  hLinesCleared = 0;
  vLinesCleared = 0;
  targetHLines = 0;
  targetVLines = 0;
  
  grid: any[][] = Array(8).fill(null).map(() => Array(8).fill(null));
  dock: any[] = [];
  
  showBriefing = false;
  showVictory = false;
  isEnglish = false;

  objectiveLabel = '';
  objectiveProgress = '';
  briefingTitle = '';
  briefingText = '';

  ngOnInit() {
    this.loadProgress();
    this.initLevel(this.currentLevel);
  }

  loadProgress() {
    const saved = localStorage.getItem('adventureProgress');
    this.currentLevel = saved ? parseInt(saved) : 1;
  }

  initLevel(level: number) {
    this.currentScore = 0;
    this.hLinesCleared = 0;
    this.vLinesCleared = 0;
    this.showVictory = false;
    
    // Configura os objetivos com base no nível
    if (level <= 25) {
      this.targetScore = level * 500;
      this.objectiveLabel = this.isEnglish ? 'GOAL' : 'META';
      if (level === 1) this.setupBriefing("ALCANCE A META!", "Obtenha a pontuação necessária para invadir o sistema.");
    } 
    else if (level <= 50) {
      this.targetHLines = 5 + Math.floor((level - 25) / 2);
      this.targetVLines = 5 + Math.floor((level - 25) / 2);
      this.objectiveLabel = "H/V";
      if (level === 26) this.setupBriefing("QUEBRA DE CÓDIGO!", "Decifre os firewalls limpando linhas horizontais e verticais.");
    }

    this.updateObjectiveDisplay();
  }

  setupBriefing(title: string, text: string) {
    this.briefingTitle = title;
    this.briefingText = text;
    this.showBriefing = true;
  }

  startMission() {
    this.showBriefing = false;
  }

  updateObjectiveDisplay() {
    if (this.currentLevel <= 25) {
      this.objectiveProgress = `${this.currentScore}/${this.targetScore}`;
    } else {
      this.objectiveProgress = `H:${this.hLinesCleared}/${this.targetHLines} V:${this.vLinesCleared}/${this.targetVLines}`;
    }
  }

  // Chame esta função toda vez que uma peça for colocada ou linha limpa
  checkWinCondition() {
    let won = false;
    if (this.currentLevel <= 25) {
      won = this.currentScore >= this.targetScore;
    } else if (this.currentLevel <= 50) {
      won = this.hLinesCleared >= this.targetHLines && this.vLinesCleared >= this.targetVLines;
    }

    if (won && !this.showVictory) {
      this.showVictory = true;
      this.saveProgress();
    }
  }

  saveProgress() {
    localStorage.setItem('adventureProgress', (this.currentLevel + 1).toString());
  }

  nextLevel() {
    this.currentLevel++;
    this.initLevel(this.currentLevel);
  }

  goToMenu() {
    window.location.reload(); // Simples retorno ao menu
  }

  // Funções de drag/drop e grid logic devem vir aqui abaixo...
  onDragStart(event: any, index: number) { /* Lógica de arrastar */ }
}
