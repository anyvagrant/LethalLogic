import { Component, ChangeDetectionStrategy, inject, output } from '@angular/core';
import { LanguageService } from '../services/language.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-game-logo',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="flex flex-col items-center justify-center relative select-none cursor-default transform -rotate-6">
      
      <!-- Top Text: LETHAL (6 Letters) -->
      <div class="flex gap-1 items-end">
        <div class="bg-black text-white px-3 py-1 text-5xl font-black border-2 border-white transform -rotate-3 shadow-[4px_4px_0_#D32F2F]">L</div>
        <div class="bg-white text-black px-2 py-3 text-5xl font-black border-2 border-black transform rotate-6 shadow-[4px_4px_0_#000]">E</div>
        <div class="bg-[#D32F2F] text-white px-3 py-1 text-6xl font-black border-2 border-black transform -rotate-6 z-10 shadow-[4px_4px_0_#fff]">T</div>
        <div class="bg-black text-white px-2 py-2 text-5xl font-black border-2 border-white transform rotate-3 shadow-[4px_4px_0_#D32F2F]">H</div>
        <div class="bg-white text-black px-3 py-1 text-5xl font-black border-2 border-black transform -rotate-3 shadow-[4px_4px_0_#000]">A</div>
        <div class="bg-black text-[#D32F2F] px-2 py-2 text-6xl font-black border-2 border-white transform rotate-6 shadow-[4px_4px_0_white]">L</div>
      </div>

      <!-- Bottom Text: LOGIC! (6 Chars) -->
      <div class="relative mt-2">
         <!-- Jagged Background Strip -->
        <div class="absolute inset-0 bg-black transform skew-x-[-20deg] border-2 border-white shadow-[6px_6px_0_#000] z-0"></div>
        
        <div class="relative z-10 flex gap-0.5 px-4 py-1">
           <span class="text-[#D32F2F] text-5xl font-black transform skew-x-[-10deg] -rotate-2">L</span>
           <span class="text-white text-5xl font-black transform skew-x-[-10deg] rotate-3">O</span>
           <span class="text-white text-5xl font-black transform skew-x-[-10deg] -rotate-3">G</span>
           <span class="text-white text-5xl font-black transform skew-x-[-10deg] rotate-2">I</span>
           <span class="text-[#D32F2F] text-5xl font-black transform skew-x-[-10deg] -rotate-2">C</span>
           <span class="text-white text-6xl font-black transform skew-x-[-10deg] rotate-6 ml-1">!</span>
        </div>
        
        <!-- Decoration Star (Secret Trigger) -->
        <svg (click)="onStarClick($event)" class="absolute -right-10 -top-8 animate-pulse z-20" width="50" height="50" viewBox="0 0 24 24" fill="white" stroke="black" stroke-width="2">
           <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      </div>

      <!-- Subtitle (Tape Strip) -->
      <div class="bg-white text-black font-bold text-sm tracking-[0.3em] mt-6 px-4 py-1 transform rotate-2 border border-black shadow-lg uppercase">
        {{ lang.t().menu.subtitle }}
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GameLogoComponent {
  lang = inject(LanguageService);
  secretTriggered = output<void>();

  private clickCount = 0;
  private resetTimer: any;

  onStarClick(e: Event) {
    e.stopPropagation();
    
    this.clickCount++;
    
    if (this.resetTimer) clearTimeout(this.resetTimer);
    // Reset count if user stops clicking for more than 1 second
    this.resetTimer = setTimeout(() => this.clickCount = 0, 1000);

    if (this.clickCount >= 3) {
      this.secretTriggered.emit();
      this.clickCount = 0;
    }
  }
}