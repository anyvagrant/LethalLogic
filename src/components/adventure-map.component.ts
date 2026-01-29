import { Component, ChangeDetectionStrategy, output, input, OnInit, ElementRef, ViewChild, AfterViewInit, inject, Renderer2, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LanguageService } from '../services/language.service';

@Component({
  selector: 'app-adventure-map',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="flex flex-col h-full w-full bg-[#1a1a1a] text-white overflow-hidden relative font-['Anton']"
         (mousemove)="handleParallax($event)">
      
      <!-- Parallax Background Texture -->
      <div class="absolute inset-[-50px] bg-p5-pattern opacity-20 pointer-events-none z-0 transition-transform duration-100 ease-out"
           [style.transform]="parallaxStyle()"></div>
           
      <!-- Background Noise/Shapes -->
      <div class="absolute inset-0 overflow-hidden pointer-events-none z-0">
         <div class="absolute top-10 -left-20 w-96 h-20 bg-black transform -rotate-12 opacity-30"></div>
         <div class="absolute bottom-20 -right-20 w-96 h-40 bg-[#D32F2F] transform rotate-45 opacity-10"></div>
      </div>

      <!-- Fixed Header -->
      <header class="h-24 bg-black flex items-center justify-between px-4 z-30 shrink-0 relative border-b-4 border-white shadow-[0_10px_0_#D32F2F] transform -skew-y-1">
        <button (click)="returnToMenu.emit()" class="w-12 h-12 bg-white border-2 border-black flex items-center justify-center transform -rotate-6 active:scale-95 transition-transform shadow-[4px_4px_0_#D32F2F] hover:bg-gray-200">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="black" stroke-width="4" stroke-linecap="round" stroke-linejoin="round">
            <path d="M15 18l-6-6 6-6"/>
          </svg>
        </button>
        
        <!-- Chaotic Title -->
        <div class="relative">
            <div class="absolute inset-0 bg-black transform translate-x-1 translate-y-1 skew-x-[-20deg]"></div>
            <div class="bg-[#D32F2F] px-6 py-2 transform skew-x-[-20deg] border-2 border-white relative z-10 shadow-[5px_5px_0_black]">
               <h1 class="text-3xl font-black tracking-widest text-white transform skew-x-[20deg] uppercase drop-shadow-md">
                 {{ lang.t().adventure.title }}
               </h1>
            </div>
        </div>
        
        <div class="w-12"></div> 
      </header>

      <!-- Scrollable Content -->
      <div class="flex-1 overflow-y-auto custom-scrollbar relative flex flex-col items-center pb-32 pt-16 w-full" #scrollContainer>
        
        <!-- Red Lightning Path (SVG) -->
        <svg class="absolute top-0 left-0 w-full h-full pointer-events-none z-0" style="min-height: 100%;">
          <defs>
             <filter id="glow">
               <feGaussianBlur stdDeviation="2.5" result="coloredBlur"/>
               <feMerge>
                 <feMergeNode in="coloredBlur"/>
                 <feMergeNode in="SourceGraphic"/>
               </feMerge>
             </filter>
          </defs>
          @for (conn of connections; track $index) {
             <line [attr.x1]="conn.x1" [attr.y1]="conn.y1" [attr.x2]="conn.x2" [attr.y2]="conn.y2" 
                   stroke="#D32F2F" stroke-width="8" stroke-linecap="square" filter="url(#glow)" 
                   class="animate-pulse" />
          }
        </svg>

        <!-- Trophy Section -->
        <div class="flex flex-col items-center text-center mb-24 relative z-10 w-full">
          <div class="relative scale-125 animate-bounce">
             <div class="absolute inset-0 bg-white transform rotate-45 scale-150 border-2 border-black" 
                  style="clip-path: polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%);"></div>
             <svg class="relative z-10 drop-shadow-[4px_4px_0_#D32F2F]" width="80" height="80" viewBox="0 0 24 24" fill="black" stroke="white" stroke-width="1.5">
               <path d="M8 21h8m-4-9v9m-6.7-16.3c.7-2.7 8.3-2.7 9 0 .5 2 2 3 3 3 1.5 0 2.5 1 2.5 3l-1.5 6c-.5 2-2 3.5-4 4h-9c-2-.5-3.5-2-4-4l-1.5-6c0-2 1-3 2.5-3 1 0 2.5-1 3-3z" />
             </svg>
          </div>
          <div class="bg-black text-white px-4 py-1 mt-8 border-2 border-white transform skew-x-[-10deg] shadow-[6px_6px_0_#D32F2F]">
            <p class="text-lg font-black uppercase tracking-widest transform skew-x-[10deg]">
              {{ lang.t().adventure.topMountain }}
            </p>
          </div>
        </div>

        <!-- Map Grid -->
        <div class="flex flex-col-reverse gap-16 w-full max-w-sm px-4 items-center relative z-10 pb-20">
          @for (row of mapRows; track $index) {
            <div class="flex justify-center gap-8 w-full">
              @for (level of row; track level) {
                
                <div [id]="'level-' + level" class="relative flex items-center justify-center group" #levelItem>
                    
                    <!-- CASE 1: ACTIVE LEVEL -->
                    @if (isCurrentMax(level)) {
                       <div class="relative w-28 h-28 flex items-center justify-center shrink-0 cursor-pointer z-30 transition-transform active:scale-95"
                            (click)="onLevelClick(level)">
                          <div class="absolute inset-0 border-4 border-[#D32F2F] rounded-full animate-ping opacity-75"></div>
                          <div class="absolute inset-0 bg-[#D32F2F] border-4 border-white shadow-[0_0_20px_#D32F2F] animate-[spin_10s_linear_infinite]"
                               style="clip-path: polygon(20% 0%, 80% 0%, 100% 20%, 100% 80%, 80% 100%, 20% 100%, 0% 80%, 0% 20%);">
                          </div>
                          <div class="absolute inset-3 bg-black flex items-center justify-center transform -rotate-3 border-2 border-white"
                               style="clip-path: polygon(10% 0, 100% 0, 90% 100%, 0% 100%);">
                               <span class="text-white text-4xl font-black italic">{{ level }}</span>
                          </div>
                          <div class="absolute -top-4 -right-8 bg-white text-black text-xs font-black px-2 py-1 border-2 border-black transform rotate-12 shadow-[4px_4px_0_black] animate-bounce whitespace-nowrap z-40">
                            TARGET!!
                          </div>
                       </div>
                    } 
                    
                    <!-- CASE 2: COMPLETED LEVEL -->
                    @else if (!isLocked(level)) {
                       <div class="w-20 h-20 relative flex items-center justify-center shrink-0 cursor-pointer transition-transform hover:scale-110 active:scale-95"
                            (click)="onLevelClick(level)">
                         <div class="absolute inset-0 bg-white border-[3px] border-black shadow-[5px_5px_0_black]"
                              style="clip-path: polygon(0% 15%, 15% 15%, 15% 0%, 85% 0%, 85% 15%, 100% 15%, 100% 85%, 85% 85%, 85% 100%, 15% 100%, 15% 85%, 0% 85%);">
                         </div>
                         <span class="relative z-10 text-black font-black text-3xl transform -rotate-6">{{ level }}</span>
                       </div>
                    } 
                    
                    <!-- CASE 3: LOCKED LEVEL -->
                    @else {
                       <div class="w-16 h-16 bg-[#333] border-2 border-[#555] flex items-center justify-center shrink-0 opacity-50 grayscale"
                            style="clip-path: polygon(25% 0%, 100% 0%, 75% 100%, 0% 100%);">
                          <span class="text-[#666] font-bold text-xl">{{ level }}</span>
                       </div>
                    }
                </div>
              }
            </div>
          }
        </div>
        
        <!-- Start Pad -->
        <div class="mt-8 mb-4 flex flex-col items-center">
           <div class="bg-black text-white px-6 py-2 transform -rotate-3 border-2 border-white">
              <span class="text-xl font-black uppercase tracking-widest">{{ lang.t().adventure.start }}</span>
           </div>
        </div>

      </div>

      <!-- Fixed Footer -->
      <div class="absolute bottom-0 w-full bg-black p-4 z-40 border-t-4 border-[#D32F2F]">
        <button 
          (click)="onLevelClick(unlockedLevel())"
          class="w-full bg-[#D32F2F] hover:bg-red-600 text-white font-black text-3xl py-4 shadow-[6px_6px_0_white] active:shadow-none active:translate-y-1.5 transition-all uppercase tracking-widest flex items-center justify-center relative overflow-hidden group border-2 border-black transform skew-x-[-10deg]"
        >
          <span class="z-10 transform skew-x-[10deg] group-hover:scale-105 transition-transform flex items-center gap-2">
             <span class="text-2xl">►</span> {{ lang.t().adventure.playLevel }} {{ unlockedLevel() }}
          </span>
          <div class="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity skew-x-[-20deg] translate-x-full group-hover:translate-x-0 duration-300"></div>
        </button>
      </div>

    </div>
  `,
  styles: [`
    .custom-scrollbar::-webkit-scrollbar { width: 4px; }
    .custom-scrollbar::-webkit-scrollbar-track { background: #000; }
    .custom-scrollbar::-webkit-scrollbar-thumb { background: #D32F2F; }
    .bg-p5-pattern {
        background-color: #1a1a1a;
        background-image: radial-gradient(#333 15%, transparent 16%), radial-gradient(#333 15%, transparent 16%);
        background-size: 10px 10px;
        background-position: 0 0, 5px 5px;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdventureMapComponent implements OnInit, AfterViewInit {
  lang = inject(LanguageService);
  returnToMenu = output<void>();
  playLevel = output<number>();
  
  unlockedLevel = input.required<number>();
  
  mapRows: number[][] = [];
  connections: {x1: string, y1: string, x2: string, y2: string}[] = [];
  
  // Parallax State
  mouseX = 0;
  mouseY = 0;
  
  @ViewChild('scrollContainer') scrollContainer!: ElementRef<HTMLDivElement>;

  ngOnInit() {
    this.generateMap();
  }

  ngAfterViewInit() {
    setTimeout(() => {
        this.scrollToActiveLevel();
    }, 100);
  }

  handleParallax(event: MouseEvent) {
    // Simple, performant parallax
    this.mouseX = (event.clientX / window.innerWidth - 0.5) * 20;
    this.mouseY = (event.clientY / window.innerHeight - 0.5) * 20;
  }

  parallaxStyle() {
    return `translate(${this.mouseX}px, ${this.mouseY}px)`;
  }

  scrollToActiveLevel() {
    const activeLevelId = 'level-' + this.unlockedLevel();
    const element = document.getElementById(activeLevelId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } else if (this.scrollContainer) {
      this.scrollContainer.nativeElement.scrollTop = 0; 
    }
  }

  generateMap() {
    let current = 1;
    const widthsPattern = [2, 3, 2, 3]; 
    let patternIdx = 0;
    while (current <= 100) {
      let width = widthsPattern[patternIdx % widthsPattern.length];
      const row = [];
      for (let i = 0; i < width && current <= 100; i++) {
        row.push(current);
        current++;
      }
      this.mapRows.push(row);
      patternIdx++;
    }
  }

  isLocked(level: number): boolean { return level > this.unlockedLevel(); }
  isCurrentMax(level: number): boolean { return level === this.unlockedLevel(); }
  onLevelClick(level: number) { if (!this.isLocked(level)) this.playLevel.emit(level); }
}