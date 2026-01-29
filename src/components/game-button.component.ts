import { Component, ChangeDetectionStrategy, input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-game-button',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="relative w-full max-w-xs mx-auto mb-6 group cursor-pointer select-none">
      
      <!-- Offset Shadow (The "Phantom" Layer) -->
      <div class="absolute inset-0 bg-black transform skew-x-[-12deg] translate-x-3 translate-y-3 border-2 border-white opacity-80 transition-transform duration-150 ease-out group-hover:translate-x-5 group-hover:translate-y-5"></div>

      <!-- Button Body -->
      <button 
        class="relative w-full overflow-hidden transform skew-x-[-12deg] border-[3px] border-black py-4 px-6 text-2xl font-black uppercase tracking-widest transition-all duration-100 group-hover:-translate-y-1 group-active:translate-y-1 group-hover:bg-white group-hover:text-black hover:shadow-[0_0_15px_rgba(255,255,255,0.8)]"
        [ngClass]="colorClasses()"
      >
        <!-- Unskew Content -->
        <div class="flex items-center justify-center gap-3 transform skew-x-[12deg] group-hover:scale-105 transition-transform duration-200">
           <!-- Icon Slot -->
           <div class="drop-shadow-none group-hover:invert transition-all duration-0">
              <ng-content select="[icon]"></ng-content>
           </div>

           <!-- Label -->
           <span class="z-10 relative">{{ label() }}</span>
        </div>
        
        <!-- Decoration Line -->
        <div class="absolute top-0 right-0 w-8 h-[200%] bg-black/10 transform rotate-12 translate-x-4 group-hover:translate-x-8 transition-transform duration-300"></div>
      </button>

      <!-- Badge (Star Shape) -->
      @if (badgeText()) {
        <div class="absolute -top-4 -right-4 z-20 animate-[bounce_2s_infinite]">
           <div class="relative flex items-center justify-center w-16 h-16">
              <svg viewBox="0 0 100 100" class="absolute inset-0 w-full h-full fill-[#D32F2F] stroke-black stroke-2 drop-shadow-md">
                 <polygon points="50 0 61 35 98 35 68 57 79 91 50 70 21 91 32 57 2 35 39 35" />
              </svg>
              <span class="relative text-white text-[10px] font-black transform -rotate-12">{{ badgeText() }}</span>
           </div>
        </div>
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GameButtonComponent {
  label = input.required<string>();
  variant = input.required<'orange' | 'green' | 'cyan'>();
  badgeText = input<string>('');
  hasNotification = input<boolean>(false);

  colorClasses() {
    switch (this.variant()) {
      case 'orange': return 'bg-[#D32F2F] text-white';
      case 'green': return 'bg-black text-white border-white'; 
      case 'cyan': return 'bg-white text-black border-black';
      default: return 'bg-gray-800 text-white';
    }
  }
}