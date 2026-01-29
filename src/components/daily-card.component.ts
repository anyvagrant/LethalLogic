import { Component, ChangeDetectionStrategy, input, inject, signal, effect } from '@angular/core';
import { LanguageService } from '../services/language.service';
import { PersistenceService } from '../services/persistence.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-daily-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="relative w-full max-w-sm mx-auto mt-8 transform -rotate-2">
      
      <!-- Card Bg -->
      <div class="bg-black border-4 border-white p-1 shadow-[8px_8px_0_#D32F2F] relative overflow-hidden">
        
        <!-- Torn Tape visual at top -->
        <div class="absolute -top-3 left-1/2 -translate-x-1/2 w-24 h-6 bg-[#D32F2F] border border-black transform rotate-2 opacity-90 z-10"></div>

        <!-- Header -->
        <div class="bg-white py-1 px-4 text-center transform skew-x-[-10deg] mb-2 border-2 border-black">
          <span class="inline-block transform skew-x-[10deg] text-black font-black text-sm uppercase tracking-widest">
            {{ lang.t().menu.consecutiveVictories }}
          </span>
        </div>

        <!-- Content -->
        <div class="p-4 flex items-center justify-between relative bg-white/10 backdrop-blur-sm border-2 border-white/20">
          
          <!-- Icon Circle -->
          <div class="relative w-14 h-14 bg-[#D32F2F] flex items-center justify-center border-2 border-white shadow-lg shrink-0 transform rotate-3">
             <svg width="28" height="28" viewBox="0 0 24 24" fill="black" stroke="white" stroke-width="2">
               <path d="M2 4l3 12h14l3-12-6 7-4-7-4 7-6-7zm3 16h14"/>
             </svg>
          </div>

          <!-- Counter -->
          <div class="text-white font-black text-5xl flex-1 text-center tracking-tighter drop-shadow-[2px_2px_0_#D32F2F]">
            <span class="text-3xl text-[#D32F2F] mr-1">X</span>{{ bestStreak() }}
          </div>

          <!-- Stamp -->
          <div class="w-8 h-8 bg-white flex items-center justify-center text-black shrink-0 border-2 border-black transform -rotate-6">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
          </div>
        </div>
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DailyCardComponent {
  lang = inject(LanguageService);
  persistence = inject(PersistenceService);
  
  bestStreak = signal(0);
  isRecordRun = signal(false);

  constructor() {
    effect(() => {
      this.lang.currentLang(); 
      this.loadData();
    });
  }

  private loadData() {
    const best = this.persistence.getBestStreak();
    const current = this.persistence.getCurrentStreak();
    
    this.bestStreak.set(best);
    this.isRecordRun.set(current === best && best > 0);
  }
}