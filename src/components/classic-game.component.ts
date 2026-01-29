import { Component, ChangeDetectionStrategy, signal, computed, ViewChild, ElementRef, AfterViewInit, inject, Renderer2, output, input, effect, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BlockShape, getRandomShapes } from '../game-logic/shapes';
import { LanguageService } from '../services/language.service';
import { PersistenceService } from '../services/persistence.service';
import { AudioService } from '../services/audio.service';

// --- Types ---
type MissionType = 'SCORE' | 'CODE_BREAKER' | 'COMBOS' | 'ECHOS';

interface Cell {
  filled: boolean;
  colorClass: string;
  shadowClass: string;
  baseColor: string;
  clearing: boolean;
  isStar: boolean;
}

interface DragState {
  isDragging: boolean;
  shape: BlockShape | null;
  shapeIndex: number;
  x: number;
  y: number;
}

interface FloatingText {
  id: number;
  x: number;
  y: number;
  text: string;
  scale: number;
  color: string;
  isCentered: boolean;
}

interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  rotation: number;
}

interface Flash {
  id: number;
  x: number;
  y: number;
  w: number;
  h: number;
  isVertical: boolean;
}

@Component({
  selector: 'app-classic-game',
  standalone: true,
  imports: [CommonModule],
  template: `
    <!-- MAIN CONTAINER: Red/Black P5 Theme -->
    <div class="flex flex-col h-screen w-full max-w-md mx-auto relative select-none overflow-hidden bg-[#D32F2F] bg-p5-pattern touch-none" 
         (touchmove)="preventScroll($event)">
      
      <!-- Black Overlay Shapes for Background Depth -->
      <div class="absolute inset-0 pointer-events-none z-0 overflow-hidden">
         <div class="absolute top-0 right-0 w-[80%] h-[120%] bg-black transform -skew-x-12 translate-x-[40%] opacity-20"></div>
         <div class="absolute bottom-0 left-0 w-[60%] h-[60%] bg-black transform skew-x-12 -translate-x-[30%] opacity-20"></div>
      </div>

      <!-- Header -->
      <header class="flex flex-col w-full pt-6 px-4 mb-2 z-30 relative select-none">
        <div class="flex justify-between items-start w-full">
          
          <!-- Left: Stats (Jagged Box) -->
          <div class="flex flex-col gap-2 min-w-[120px]">
              <div class="flex flex-col leading-tight bg-black border-2 border-white p-2 transform -skew-x-6 shadow-[4px_4px_0_rgba(0,0,0,0.5)]">
                @if (mode() === 'classic') {
                  <span class="text-[10px] text-[#D32F2F] uppercase font-bold tracking-widest bg-white px-1 -mx-2 -mt-2 mb-1 w-fit transform skew-x-6">{{ lang.t().game.record }}</span>
                  <span class="text-2xl font-black text-white leading-none transform skew-x-6">{{ highScore() }}</span>
                } @else if (missionType() === 'CODE_BREAKER') {
                   <!-- Code Breaker Stats -->
                   <span class="text-[10px] text-[#D32F2F] uppercase font-bold tracking-widest bg-white px-1 -mx-2 -mt-2 mb-1 w-fit transform skew-x-6">
                     CODE BREAK
                   </span>
                   <div class="flex flex-col gap-0.5 transform skew-x-6 text-white font-black text-sm">
                      <div class="flex justify-between w-full">
                        <span class="text-red-500">H:</span> 
                        <span>{{ horizontalLinesCleared() }}/{{ horizontalLinesNeeded() }}</span>
                      </div>
                      <div class="w-full h-1 bg-gray-800"><div class="h-full bg-red-500 transition-all" [style.width.%]="(horizontalLinesCleared()/horizontalLinesNeeded())*100"></div></div>
                      
                      <div class="flex justify-between w-full mt-1">
                        <span class="text-blue-300">V:</span>
                        <span>{{ verticalLinesCleared() }}/{{ verticalLinesNeeded() }}</span>
                      </div>
                      <div class="w-full h-1 bg-gray-800"><div class="h-full bg-blue-300 transition-all" [style.width.%]="(verticalLinesCleared()/verticalLinesNeeded())*100"></div></div>
                   </div>
                } @else {
                   <!-- Standard Stats -->
                   <span class="text-[10px] text-[#D32F2F] uppercase font-bold tracking-widest bg-white px-1 -mx-2 -mt-2 mb-1 w-fit transform skew-x-6">
                     {{ lang.t().adventure.objective }}
                   </span>
                   <div class="flex items-center gap-1 transform skew-x-6">
                     <span class="text-xl font-black text-white leading-none">
                       {{ missionProgress() }} / {{ missionTarget() }}
                     </span>
                   </div>
                }
              </div>

              <!-- Chronos Meter -->
              <div class="flex items-center justify-center bg-white border-2 border-black w-10 h-10 transform rotate-45 mt-2">
                   <div class="w-8 h-8 bg-black flex items-center justify-center border border-white">
                      <div class="font-black text-sm text-[#D32F2F] transform -rotate-45">
                        {{ 10 - movesSinceEcho() }}
                      </div>
                   </div>
                   <div class="absolute inset-0 border-2 border-[#D32F2F] transition-all duration-300"
                        [style.clip-path]="'polygon(0 ' + (100 - (movesSinceEcho()*10)) + '%, 100% 0, 100% 100%, 0 100%)'">
                   </div>
              </div>
          </div>

          <!-- Center: Score -->
          <div class="flex flex-col items-center pt-2">
            @if (mode() === 'classic') {
              <div class="text-7xl font-black text-white italic drop-shadow-[5px_5px_0_#000] transition-transform duration-100 leading-none"
                   [class.scale-110]="scorePopping()"
                   style="-webkit-text-stroke: 2px black;">
                {{ score() }}
              </div>
            } @else {
               <div class="bg-black px-6 py-2 transform skew-x-[-12deg] border-2 border-white shadow-[4px_4px_0_#D32F2F]">
                 <span class="block transform skew-x-[12deg] text-white font-black text-lg tracking-widest uppercase">
                    {{ lang.t().game.level }} {{ level() }}
                 </span>
               </div>
               <div class="text-3xl font-black text-white drop-shadow-[3px_3px_0_#000] mt-1">{{ score() }}</div>
            }
          </div>

          <!-- Right: Settings -->
          <div class="flex flex-col gap-2">
              <button 
                class="w-10 h-10 bg-black border-2 border-white flex items-center justify-center active:bg-[#D32F2F] transition-colors shadow-[3px_3px_0_rgba(0,0,0,0.5)]"
                (click)="audio.toggleMute(); $event.stopPropagation()">
                @if (audio.isMuted()) {
                   <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><path d="M11 5L6 9H2v6h4l5 4V5z"></path><line x1="23" y1="9" x2="17" y2="15"></line><line x1="17" y1="9" x2="23" y2="15"></line></svg>
                } @else {
                   <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path></svg>
                }
              </button>
              <button class="w-10 h-10 bg-black border-2 border-white flex items-center justify-center active:bg-[#D32F2F] transition-colors shadow-[3px_3px_0_rgba(0,0,0,0.5)]" (click)="returnToMenu.emit()">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0..." /><path stroke-linecap="round" stroke-linejoin="round" d="M19 12H5M12 19l-7-7 7-7" /></svg>
              </button>
          </div>
        </div>
        
        <!-- Progress Bar -->
        @if (mode() === 'adventure' && missionType() !== 'CODE_BREAKER') {
          <div class="w-full h-3 bg-black mt-3 relative border border-white">
            <div class="h-full bg-[#D32F2F] transition-all duration-500 ease-out" [style.width.%]="progressPercentage()">
               <div class="absolute right-0 top-0 bottom-0 w-1 bg-white"></div>
            </div>
          </div>
        }
      </header>

      <!-- Streak Counter -->
      <div class="h-8 flex justify-center mb-2 z-20">
        @if (streakCount() > 1) {
           <div class="bg-[#D32F2F] text-white text-sm font-black px-4 py-1 transform skew-x-[-20deg] border-2 border-black shadow-[3px_3px_0_white]">
             <span class="inline-block transform skew-x-[20deg] uppercase">{{ lang.t().mechanics.streak }} x{{ streakCount() }}</span>
           </div>
        }
      </div>

      <!-- Game Board Area -->
      <main class="flex-1 flex items-center justify-center px-4 z-10" #boardContainer>
        
        <!-- Grid Wrapper with Squash & Stretch Signal -->
        <div class="relative flex items-stretch transition-transform duration-150 ease-out"
             [style.transform]="'scale(' + boardScale() + ')'">
            
            <div class="relative bg-black p-3 shadow-[8px_8px_0_rgba(0,0,0,0.4)] border-2 border-white transition-all duration-300"
                 [class.animate-shake]="shakeBoard()"
                 [class.border-[#D32F2F]]="isFeverActive()">
              
              <div class="grid grid-cols-8 gap-0.5 bg-gray-900 border border-gray-700 relative overflow-hidden" 
                   #gridElement>
                
                <!-- Temporal Echo (Ghost Layer) -->
                <div class="absolute inset-0 grid grid-cols-8 gap-0.5 pointer-events-none z-0">
                  @for (ghostCell of temporalEcho(); track $index) {
                     <div class="transition-all duration-700 ease-in-out opacity-30 transform"
                          [class.bg-[#D32F2F]]="ghostCell.filled"
                          [class.border]="ghostCell.filled"
                          [class.border-white]="ghostCell.filled">
                     </div>
                  }
                </div>

                <!-- Line Clear Flashes -->
                @for (flash of activeFlashes(); track flash.id) {
                   <div class="absolute bg-white z-40 animate-flash-fade"
                        [style.left.px]="flash.x" [style.top.px]="flash.y"
                        [style.width.px]="flash.w" [style.height.px]="flash.h"
                        [style.backgroundColor]="flash.isVertical ? 'white' : '#D32F2F'">
                   </div>
                }

                @for (cell of grid(); track $index) {
                  <div class="w-9 h-9 sm:w-11 sm:h-11 relative transition-all duration-200 z-10 border border-gray-800"
                       [ngClass]="cell.clearing ? 'animate-shatter' : ''">
                    @if (cell.filled) {
                      <div class="absolute inset-0" [ngClass]="cell.colorClass">
                          <div class="absolute top-1 left-1 w-1/3 h-1/3 bg-white/20 skew-x-[-15deg]"></div>
                      </div>
                      @if (cell.isStar) {
                        <div class="absolute inset-0 flex items-center justify-center z-20">
                          <div class="absolute w-full h-full bg-black/20 animate-pulse"></div>
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="#FDD835" stroke="black" stroke-width="2" class="animate-[spin_4s_linear_infinite]">
                             <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                          </svg>
                        </div>
                      }
                    } 
                    @if (isGhostCell($index)) {
                       <div class="absolute inset-0 bg-white/30 z-10 border-2 border-white border-dashed"></div>
                    }
                  </div>
                }
              </div>

              <!-- Particles -->
              @for (p of particles(); track p.id) {
                 <div class="absolute pointer-events-none"
                      [style.left.px]="p.x"
                      [style.top.px]="p.y"
                      [style.width.px]="p.size"
                      [style.height.px]="p.size"
                      [style.backgroundColor]="p.color"
                      [style.border]="'1px solid black'"
                      [style.transform]="'rotate(' + p.rotation + 'deg)'">
                 </div>
              }
              
              <!-- Floating Text -->
              @for (ft of floatingTexts(); track ft.id) {
                @if (ft.isCentered) {
                  <div class="absolute left-1/2 top-[35%] z-[10000] pointer-events-none text-center flex items-center justify-center" 
                       style="transform: translate(-50%, -50%); width: 90%;">
                     <div class="relative bg-black text-white border-2 border-white px-4 py-2 transform -rotate-3 shadow-[6px_6px_0_#D32F2F]">
                        <div class="animate-popup-text font-black text-4xl uppercase tracking-wider leading-none"
                             [style.color]="ft.color">
                          {{ ft.text }}
                        </div>
                     </div>
                  </div>
                } @else {
                  <div class="absolute pointer-events-none font-black text-center z-50 animate-float-up whitespace-nowrap"
                       [style.left.px]="ft.x"
                       [style.top.px]="ft.y"
                       [style.color]="'#fff'"
                       [style.fontSize]="(24 * ft.scale) + 'px'"
                       style="-webkit-text-stroke: 1.5px black;">
                    {{ ft.text }}
                  </div>
                }
              }
            </div>

            <!-- FEVER BAR -->
            <div class="absolute -right-5 top-0 bottom-0 w-4 bg-black border-2 border-white flex flex-col justify-end">
               <div class="w-full bg-[#D32F2F] transition-[height] duration-300 relative border-t-2 border-white"
                    [style.height.%]="feverProgress()">
                  @if (feverProgress() >= 100 || isFeverActive()) {
                    <div class="absolute inset-0 bg-white/50 animate-pulse"></div>
                  }
               </div>
            </div>
        </div>
      </main>

      <!-- Bottom Dock -->
      <footer class="h-40 pb-6 px-4 flex items-center justify-between gap-2 relative z-20 w-full max-w-md mx-auto box-border">
        @for (piece of availablePieces(); track $index) {
          <div class="flex-1 h-32 flex items-center justify-center relative min-w-0">
            @if (piece && !isDraggingIndex($index)) {
              <div 
                class="touch-none cursor-grab active:cursor-grabbing transition-transform origin-center ease-out duration-100 active:scale-95"
                [style.transform]="'scale(' + getDockScale(piece) + ')'"
                (mousedown)="startDrag($event, piece, $index)"
                (touchstart)="startDrag($event, piece, $index)"
              >
                <div class="flex flex-col gap-0.5">
                  @for (row of piece.matrix; track $index; let rIdx = $index) {
                    <div class="flex gap-0.5">
                      @for (val of row; track $index; let cIdx = $index) {
                        <div class="w-10 h-10 relative transition-all duration-300" 
                             [ngClass]="val ? piece.colorClass : 'opacity-0'">
                           @if (val) {
                             <div class="absolute top-1 left-1 w-1/3 h-1/3 bg-white/20 skew-x-[-15deg]"></div>
                             @if (piece.starPosition && piece.starPosition.r === rIdx && piece.starPosition.c === cIdx) {
                               <div class="absolute inset-0 flex items-center justify-center z-20">
                                 <svg width="28" height="28" viewBox="0 0 24 24" fill="#FDD835" stroke="black" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>
                               </div>
                             }
                           }
                        </div>
                      }
                    </div>
                  }
                </div>
              </div>
            }
          </div>
        }
      </footer>
      
      <!-- Dragging Phantom (Ghosting Effect) -->
      @if (dragState().isDragging && dragState().shape) {
        <div 
          class="fixed pointer-events-none z-50 origin-top-left drop-shadow-[20px_20px_0_rgba(0,0,0,0.4)] transition-transform duration-75"
          [style.left.px]="dragState().x"
          [style.top.px]="dragState().y"
          [style.transform]="'translate(-50%, -120%) scale(1.15)'" 
        >
             <div class="flex flex-col gap-0.5 opacity-90">
                @for (row of dragState().shape!.matrix; track $index; let rIdx = $index) {
                  <div class="flex gap-0.5">
                    @for (val of row; track $index; let cIdx = $index) {
                      <div class="w-11 h-11 relative" 
                           [ngClass]="val ? dragState().shape!.colorClass : 'opacity-0'">
                         @if (val) {
                             <div class="absolute top-1 left-1 w-1/3 h-1/3 bg-white/30 skew-x-[-15deg]"></div>
                             @if (dragState().shape?.starPosition && dragState().shape?.starPosition?.r === rIdx && dragState().shape?.starPosition?.c === cIdx) {
                               <div class="absolute inset-0 flex items-center justify-center z-20">
                                 <svg width="24" height="24" viewBox="0 0 24 24" fill="#FDD835" stroke="black" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>
                               </div>
                             }
                         }
                      </div>
                    }
                  </div>
                }
             </div>
        </div>
      }

      <!-- MISSION BRIEFING OVERLAY -->
      @if (showBriefing()) {
        <div class="absolute inset-0 z-[100] flex items-center justify-center bg-[#D32F2F]/90 backdrop-blur-sm animate-[fadeIn_0.3s]">
           <!-- Background Shapes -->
           <div class="absolute inset-0 overflow-hidden pointer-events-none">
             <div class="absolute top-0 right-0 w-[120%] h-40 bg-black transform rotate-12 -translate-y-10"></div>
             <div class="absolute bottom-0 left-0 w-[120%] h-40 bg-black transform -rotate-6 translate-y-10"></div>
           </div>

           <!-- Card -->
           <div class="relative w-full max-w-sm mx-4 bg-white border-4 border-black p-1 transform -rotate-2 shadow-[15px_15px_0_black] animate-[zoomIn_0.4s_cubic-bezier(0.175,0.885,0.32,1.275)]">
              <div class="bg-black p-6 relative overflow-hidden">
                 <!-- Jagged White BG inside -->
                 <div class="absolute inset-0 bg-white transform skew-y-2 scale-y-90 z-0"></div>
                 
                 <div class="relative z-10 flex flex-col items-center text-center">
                    
                    <!-- Title Box -->
                    <div class="bg-black text-white px-4 py-2 transform skew-x-[-12deg] -rotate-2 mb-4 shadow-[5px_5px_0_#D32F2F]">
                       <h2 class="text-3xl font-black uppercase tracking-widest whitespace-nowrap">{{ currentBriefing().title }}</h2>
                    </div>

                    <!-- Icon / Visual -->
                    <div class="mb-4 text-[#D32F2F]">
                       @if (level() <= 25) {
                         <svg width="60" height="60" viewBox="0 0 24 24" fill="currentColor" stroke="black" stroke-width="2"><path d="M12 2L2 7l10 15 10-15-10-5z"/></svg> <!-- Target -->
                       } @else if (level() <= 50) {
                         <!-- Code Break Icon -->
                         <div class="flex gap-1">
                             <div class="w-12 h-12 border-4 border-black bg-white flex items-center justify-center font-black text-3xl">H</div>
                             <div class="w-12 h-12 border-4 border-black bg-white flex items-center justify-center font-black text-3xl">V</div>
                         </div>
                       } @else if (level() <= 75) {
                          <svg width="60" height="60" viewBox="0 0 24 24" fill="currentColor" stroke="black" stroke-width="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" /></svg> <!-- Combo -->
                       } @else {
                          <svg width="60" height="60" viewBox="0 0 24 24" fill="currentColor" stroke="black" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2" stroke="white" stroke-width="3"/></svg> <!-- Chronos -->
                       }
                    </div>

                    <!-- Description -->
                    <p class="text-black font-bold text-lg leading-tight mb-8 px-2 uppercase transform skew-x-[-5deg]">
                       {{ currentBriefing().text }}
                    </p>

                    <!-- Start Button -->
                    <button (click)="closeBriefing()" class="w-full bg-[#D32F2F] hover:bg-red-600 text-white font-black text-2xl py-3 transform skew-x-[-10deg] shadow-[5px_5px_0_black] active:translate-y-1 active:shadow-none transition-all group border-2 border-black">
                       <span class="inline-block transform skew-x-[10deg] group-hover:scale-110 transition-transform">
                          {{ lang.t().briefing.startHeist }}
                       </span>
                    </button>
                 </div>
              </div>
           </div>
        </div>
      }

      <!-- GAME COMPLETE (LEVEL 100) OVERLAY -->
      @if (gameComplete()) {
        <div class="absolute inset-0 z-[200] bg-[#D32F2F] flex flex-col items-center justify-center animate-[fadeIn_0.5s_ease-out] overflow-hidden">
            <!-- Animated Background Noise -->
            <div class="absolute inset-0 opacity-20 pointer-events-none" 
                 style="background-image: repeating-linear-gradient(45deg, #000 0, #000 10px, transparent 10px, transparent 20px);">
            </div>
            
            <div class="relative z-10 flex flex-col items-center px-4 max-w-sm text-center">
                <h1 class="text-6xl font-black text-white italic transform -rotate-6 drop-shadow-[8px_8px_0_black] mb-6 leading-none" style="-webkit-text-stroke: 2px black;">
                   {{ lang.t().endGame.title }}
                </h1>
                
                <div class="bg-black text-white p-6 border-4 border-white transform rotate-3 shadow-[10px_10px_0_rgba(0,0,0,0.5)] mb-10">
                   <p class="text-xl font-bold uppercase tracking-wide leading-relaxed">
                      {{ lang.t().endGame.text }}
                   </p>
                </div>
                
                <div class="flex flex-col gap-4 w-full">
                    <button (click)="resetAdventure.emit()" class="bg-white text-black font-black text-2xl py-3 border-4 border-black transform skew-x-[-10deg] hover:bg-gray-200 active:scale-95 transition-all shadow-[6px_6px_0_black]">
                       {{ lang.t().endGame.reset }}
                    </button>
                    
                    <button (click)="returnToMenu.emit()" class="bg-black text-white font-black text-xl py-3 border-4 border-white transform skew-x-[-10deg] hover:bg-gray-800 active:scale-95 transition-all">
                       {{ lang.t().endGame.menu }}
                    </button>

                    <button (click)="switchToClassic.emit()" class="text-white font-bold text-lg border-b-2 border-transparent hover:border-white uppercase tracking-widest mt-2">
                       {{ lang.t().endGame.infinite }}
                    </button>
                </div>
            </div>
        </div>
      }

      <!-- VICTORY OVERLAY -->
      @if (gameWon()) {
        <div class="absolute inset-0 z-50 bg-[#D32F2F]/95 flex flex-col items-center justify-center animate-[fadeIn_0.3s_ease-out]">
            <div class="absolute inset-0 bg-black opacity-10" style="clip-path: polygon(0 0, 100% 0, 100% 80%, 50% 100%, 0 80%);"></div>
            <div class="absolute -inset-10 bg-[radial-gradient(circle_at_center,_transparent_0%,_#000_100%)] opacity-50"></div>
            <h2 class="text-7xl font-black text-white italic transform -rotate-6 drop-shadow-[8px_8px_0_black] mb-2 z-10 text-center uppercase leading-none" style="-webkit-text-stroke: 2px black;">{{ lang.t().game.levelComplete }}</h2>
            <div class="bg-black border-4 border-white px-10 py-6 transform rotate-3 shadow-[10px_10px_0_rgba(0,0,0,0.5)] z-10 mb-10 mt-6 relative overflow-hidden">
               <div class="absolute top-0 left-0 w-20 h-full bg-white/10 skew-x-[-20deg]"></div>
              <span class="text-white text-2xl font-black tracking-[0.2em] relative z-10">{{ lang.t().game.level }} {{ level() }}</span>
            </div>
            <button (click)="levelCompleted.emit()" class="bg-white text-black text-3xl font-black px-12 py-6 transform skew-x-[-15deg] border-[5px] border-black hover:bg-gray-100 active:scale-95 transition-all shadow-[8px_8px_0_black] mb-8 z-10 group relative overflow-hidden">
              <span class="inline-block transform skew-x-[15deg] relative z-10 group-hover:scale-110 transition-transform">{{ lang.t().game.nextLevel }}</span>
              <div class="absolute inset-0 bg-[#D32F2F] translate-y-full group-hover:translate-y-0 transition-transform duration-300 -z-0"></div>
            </button>
            <button (click)="returnToMenu.emit()" class="text-white font-black uppercase tracking-widest text-lg hover:text-black hover:bg-white px-4 py-1 transition-colors z-10 border-2 border-transparent hover:border-black">{{ lang.t().game.backMenu }}</button>
        </div>
      }

      <!-- GAME OVER OVERLAY -->
      @if (gameOver()) {
        <div class="absolute inset-0 z-50 bg-black/95 flex flex-col items-center justify-center animate-[fadeIn_0.5s_ease-out]">
           <div class="bg-white text-black text-6xl font-black mb-4 px-8 py-2 transform rotate-2 border-4 border-black shadow-[8px_8px_0_#D32F2F]">{{ lang.t().game.gameOver }}</div>
           <div class="bg-black border-2 border-white p-6 transform -rotate-1 mb-8 w-64 shadow-[0_0_20px_#D32F2F]">
             <div class="text-lg text-[#D32F2F] font-bold tracking-widest mb-1 uppercase">{{ lang.t().game.score }}</div>
             <div class="text-6xl font-black text-white">{{ score() }}</div>
           </div>
           <button (click)="restartGame()" class="bg-[#D32F2F] text-white text-2xl font-black px-12 py-4 transform skew-x-[-10deg] border-2 border-black shadow-[4px_4px_0_white] active:translate-y-1 active:shadow-none hover:bg-red-600 transition-all">
             <span class="inline-block transform skew-x-[10deg]">@if (mode() === 'adventure') { {{ lang.t().game.tryAgain }} } @else { {{ lang.t().game.playAgain }} }</span>
           </button>
           <button (click)="returnToMenu.emit()" class="mt-8 text-white font-bold text-lg uppercase tracking-widest hover:text-[#D32F2F] transition-colors border-b-2 border-transparent hover:border-[#D32F2F]">{{ lang.t().game.backMenu }}</button>
        </div>
      }
    </div>
  `,
  styles: [`
    @keyframes popupText {
      0% { transform: scale(0.5) rotate(-10deg); opacity: 0; }
      50% { transform: scale(1.3) rotate(5deg); opacity: 1; }
      80% { transform: scale(1.0) rotate(-3deg); opacity: 1; }
      100% { transform: scale(1.1) rotate(0deg); opacity: 0; }
    }
    .animate-popup-text { animation: popupText 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards; }
    @keyframes floatUp {
      0% { transform: translateY(0) scale(1); opacity: 1; }
      100% { transform: translateY(-40px) scale(1.2); opacity: 0; }
    }
    .animate-float-up { animation: floatUp 0.6s ease-out forwards; }
    @keyframes shatter {
      0% { transform: scale(1); opacity: 1; filter: brightness(2); }
      50% { transform: scale(0.9) rotate(10deg); opacity: 0.8; }
      100% { transform: scale(0) rotate(45deg); opacity: 0; }
    }
    .animate-shatter { animation: shatter 0.25s ease-out forwards; z-index: 50; }
    @keyframes flashFade {
      0% { opacity: 1; }
      100% { opacity: 0; }
    }
    .animate-flash-fade { animation: flashFade 0.4s ease-out forwards; }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ClassicGameComponent implements AfterViewInit, OnDestroy {
  lang = inject(LanguageService);
  persistence = inject(PersistenceService);
  audio = inject(AudioService);

  returnToMenu = output<void>();
  levelCompleted = output<void>();
  levelWon = output<void>();
  gameLost = output<void>();
  resetAdventure = output<void>();
  switchToClassic = output<void>();
  
  mode = input<'classic' | 'adventure'>('classic');
  level = input<number>(1);

  // Core State
  grid = signal<Cell[]>(this.createEmptyGrid());
  score = signal(0);
  highScore = signal(0);
  streakCount = signal(0);
  
  // Mission State
  missionType = signal<MissionType>('SCORE');
  missionTarget = signal<number>(0);
  missionProgress = signal<number>(0);

  // Code Breaker Specific State
  horizontalLinesNeeded = signal(0);
  horizontalLinesCleared = signal(0);
  verticalLinesNeeded = signal(0);
  verticalLinesCleared = signal(0);
  
  // UI State - Mission Briefing & Completion
  showBriefing = signal<boolean>(false);
  gameComplete = signal<boolean>(false); // Level 100 Completion

  // Fever Mode
  feverProgress = signal<number>(0);
  isFeverActive = signal<boolean>(false);
  feverTimeRemaining = signal<number>(0);
  private feverInterval: ReturnType<typeof setInterval> | null = null;
  private decayInterval: ReturnType<typeof setInterval> | null = null;
  
  // Chronos State
  temporalEcho = signal<Cell[]>(this.createEmptyGrid());
  movesSinceEcho = signal<number>(0);
  isParadoxActive = signal<boolean>(false);
  
  // Calculated State
  targetScore = computed(() => this.level() * 500); 
  progressPercentage = computed(() => Math.min(100, (this.missionProgress() / this.missionTarget()) * 100));
  gameWon = signal(false);
  availablePieces = signal<(BlockShape | null)[]>([]);
  gameOver = signal(false);
  isNewRecord = signal(false);
  
  // Visual Juice State
  shakeBoard = signal(false);
  scorePopping = signal(false);
  boardScale = signal(1); // 1.0 = normal, <1 = squash, >1 = stretch
  floatingTexts = signal<FloatingText[]>([]);
  particles = signal<Particle[]>([]);
  activeFlashes = signal<Flash[]>([]);

  // Interaction State
  dragState = signal<DragState>({
    isDragging: false,
    shape: null,
    shapeIndex: -1,
    x: 0,
    y: 0
  });

  ghostIndices = signal<number[]>([]);
  
  // Optimization: Track last calculated ghost position to avoid recalcs
  private lastGhostRow = -1;
  private lastGhostCol = -1;

  @ViewChild('gridElement') gridElement!: ElementRef<HTMLElement>;
  @ViewChild('boardContainer') boardContainer!: ElementRef<HTMLElement>;

  private renderer = inject(Renderer2);
  private globalMoveListener: (() => void) | null = null;
  private globalUpListener: (() => void) | null = null;
  private cellSize = 0;
  private gridRect: DOMRect | null = null;
  private floatingTextIdCounter = 0;

  constructor() {
    this.highScore.set(this.persistence.getClassicHighScore());
    this.spawnPieces();
    
    effect(() => {
        this.level(); 
        this.restartGame();
    });

    this.startDecaySystem();
    console.log("LETHAL LOGIC: Final Audit Complete. Game ready for deployment.");
  }

  ngAfterViewInit() {
    this.updateGridMetrics();
    window.addEventListener('resize', () => this.updateGridMetrics());
  }

  ngOnDestroy() {
     this.stopFever();
     if (this.decayInterval) clearInterval(this.decayInterval);
     this.removeListeners();
  }

  // --- Logic ---

  setupMission() {
    console.time("LevelLoad");
    const lvl = this.level();
    const mode = this.mode();
    
    this.missionProgress.set(0);
    this.horizontalLinesCleared.set(0);
    this.verticalLinesCleared.set(0);

    // 1. Configure Mission Logic
    if (mode === 'classic') {
      this.missionType.set('SCORE');
    } else {
        if (lvl <= 25) {
          this.missionType.set('SCORE');
          this.missionTarget.set(lvl * 500);
        } else if (lvl <= 50) {
          // Code Breaker Phase
          this.missionType.set('CODE_BREAKER');
          const base = 5 + Math.floor((lvl - 26) / 2); // Scales from 5 to 17
          this.horizontalLinesNeeded.set(base);
          this.verticalLinesNeeded.set(base);
        } else if (lvl <= 75) {
          this.missionType.set('COMBOS');
          const combos = 3 + Math.floor((lvl - 50) / 3);
          this.missionTarget.set(combos);
        } else {
          this.missionType.set('ECHOS');
          const echos = 1 + Math.floor((lvl - 75) / 5);
          this.missionTarget.set(echos);
        }
    }

    // 2. Determine Briefing Visibility
    if (mode === 'adventure') {
        if (lvl === 1 || lvl === 26 || lvl === 51 || lvl === 76) {
            this.showBriefing.set(true);
        } else {
            this.showBriefing.set(false);
        }
    } else {
        this.showBriefing.set(false);
    }
    console.timeEnd("LevelLoad");
  }

  currentBriefing() {
      const lvl = this.level();
      const txt = this.lang.t().briefing;
      if (lvl <= 25) return { title: txt.phase1Title, text: txt.phase1Text };
      if (lvl <= 50) return { title: txt.phase2Title, text: txt.phase2Text };
      if (lvl <= 75) return { title: txt.phase3Title, text: txt.phase3Text };
      return { title: txt.phase4Title, text: txt.phase4Text };
  }

  closeBriefing() {
      this.showBriefing.set(false);
  }

  checkWinCondition() {
    if (this.mode() !== 'adventure' || this.gameWon() || this.gameComplete()) return;
    
    let won = false;
    if (this.missionType() === 'CODE_BREAKER') {
        if (this.horizontalLinesCleared() >= this.horizontalLinesNeeded() &&
            this.verticalLinesCleared() >= this.verticalLinesNeeded()) {
            won = true;
        }
    } else {
        if (this.missionProgress() >= this.missionTarget()) {
            won = true;
        }
    }

    if (won) {
      if (this.level() === 100) {
         this.gameComplete.set(true);
         this.stopFever();
         this.audio.playWin();
         this.levelWon.emit(); // Saves progress (effectively beating the game)
      } else {
         this.gameWon.set(true);
         this.stopFever();
         this.levelWon.emit();
         this.audio.playWin();
      }
    }
  }

  getDockScale(piece: BlockShape): number {
    const width = piece.matrix[0].length; 
    if (width >= 5) return 0.45;
    if (width >= 4) return 0.50;
    return 0.58; 
  }

  private createEmptyGrid(): Cell[] {
    return Array(64).fill(null).map(() => ({ 
      filled: false, colorClass: '', shadowClass: '', baseColor: '', clearing: false, isStar: false 
    }));
  }

  private addToScore(points: number) {
    if (this.gameWon() || this.gameOver() || this.gameComplete()) return;
    const multiplier = this.isFeverActive() ? 2 : 1;
    const finalPoints = points * multiplier;
    const newScore = this.score() + finalPoints;
    this.score.set(newScore);
    this.scorePopping.set(true);
    setTimeout(() => this.scorePopping.set(false), 150);

    if (this.mode() === 'adventure' && this.missionType() === 'SCORE') {
       this.missionProgress.set(newScore);
       this.checkWinCondition();
    }
    if (this.mode() === 'classic' && newScore > this.highScore()) {
      this.highScore.set(newScore);
      this.persistence.saveClassicHighScore(newScore);
    }
  }

  // --- Chronos Resonance ---

  snapshotEcho() {
    this.temporalEcho.set(JSON.parse(JSON.stringify(this.grid())));
    this.movesSinceEcho.set(0);
    this.audio.playChronos();
    
    if (this.gridElement) {
       const rect = this.gridElement.nativeElement.getBoundingClientRect();
       const boardRect = this.boardContainer.nativeElement.getBoundingClientRect();
       this.spawnFloatingText(rect.left - boardRect.left + rect.width/2, rect.top - boardRect.top + 20, this.lang.t().mechanics.echoRecorded, "#c084fc", 1.2, true);
    }
  }

  checkParadoxCondition(indices: number[]): boolean {
    const echoGrid = JSON.parse(JSON.stringify(this.temporalEcho()));
    indices.forEach(idx => echoGrid[idx] = { filled: true });
    
    let echoLines = 0;
    // Helper to check lines locally in the echo copy
    const check = (isRow: boolean) => {
      for(let i=0; i<8; i++) {
        let full = true;
        for(let j=0; j<8; j++) if(!echoGrid[isRow ? i*8+j : j*8+i].filled) full = false;
        if(full) echoLines++;
      }
    };
    check(true); check(false);
    return echoLines > 0;
  }

  // --- Fever System ---
  
  startDecaySystem() {
    this.decayInterval = setInterval(() => {
       if (!this.isFeverActive() && this.feverProgress() > 0) {
         this.feverProgress.update(v => Math.max(0, v - 1));
       }
    }, 1000);
  }

  activateFever() {
    if (this.isFeverActive()) return; 
    this.isFeverActive.set(true);
    this.feverTimeRemaining.set(10);
    this.feverProgress.set(100);
    this.shakeBoard.set(true);
    setTimeout(() => this.shakeBoard.set(false), 500);

    this.feverInterval = setInterval(() => {
      this.feverTimeRemaining.update(t => t - 1);
      if (this.feverTimeRemaining() <= 0) this.stopFever();
    }, 1000);
  }

  stopFever() {
    this.isFeverActive.set(false);
    this.feverProgress.set(0);
    this.feverTimeRemaining.set(0);
    if (this.feverInterval) {
      clearInterval(this.feverInterval);
      this.feverInterval = null;
    }
  }

  updateGridMetrics() {
    if (this.gridElement) {
      this.gridRect = this.gridElement.nativeElement.getBoundingClientRect();
      this.cellSize = this.gridRect.width / 8;
    }
  }

  preventScroll(e: TouchEvent) {
    if (this.dragState().isDragging) e.preventDefault();
  }

  spawnPieces() {
    this.availablePieces.set(getRandomShapes(3));
    setTimeout(() => this.checkGameOver(), 100);
  }

  // --- Interaction & Drag ---

  isDraggingIndex(index: number) { 
    return this.dragState().isDragging && this.dragState().shapeIndex === index; 
  }

  startDrag(event: MouseEvent | TouchEvent, shape: BlockShape, index: number) {
    if (this.showBriefing() || this.gameComplete()) return; // Block interaction during overlay

    event.preventDefault(); 
    this.updateGridMetrics();

    let clientX: number, clientY: number;
    if (event instanceof MouseEvent) {
        clientX = event.clientX;
        clientY = event.clientY;
    } else {
        clientX = event.touches[0].clientX;
        clientY = event.touches[0].clientY;
    }

    this.dragState.set({
      isDragging: true,
      shape,
      shapeIndex: index,
      x: clientX,
      y: clientY
    });

    this.playPlacementSound(0.5);
    
    // JUICE: Scale board slightly down to anticipate
    this.boardScale.set(0.98);

    this.globalMoveListener = this.renderer.listen('document', 'touchmove', this.onMove.bind(this));
    this.globalMoveListener = this.renderer.listen('document', 'mousemove', this.onMove.bind(this));
    this.globalUpListener = this.renderer.listen('document', 'touchend', this.onEnd.bind(this));
    this.globalUpListener = this.renderer.listen('document', 'mouseup', this.onEnd.bind(this));
  }

  onMove(event: Event) {
    if (!this.dragState().isDragging) return;

    let clientX: number, clientY: number;
    // Strict Type Guard
    if (event instanceof MouseEvent) {
        clientX = event.clientX;
        clientY = event.clientY;
    } else if (event instanceof TouchEvent) {
        clientX = event.touches[0].clientX;
        clientY = event.touches[0].clientY;
    } else {
        return;
    }

    // Direct Signal Update is fast enough for 60fps in Zoneless Angular
    this.dragState.update(s => ({ ...s, x: clientX, y: clientY }));
    this.calculateGhostPosition(clientX, clientY);
  }

  onEnd() {
    if (!this.dragState().isDragging) return;

    const { shape, shapeIndex } = this.dragState();
    const ghost = this.ghostIndices();
    let placed = false;

    if (ghost.length > 0 && shape) {
      placed = this.placePiece(ghost, shape, shapeIndex);
      if (placed) {
        // JUICE: Board bounce
        this.boardScale.set(1.02);
        setTimeout(() => this.boardScale.set(1), 150);
      }
    } 
    
    if (!placed) {
      // JUICE: Reset if drag cancelled/failed
      this.boardScale.set(1);
    }

    this.dragState.set({ isDragging: false, shape: null, shapeIndex: -1, x: 0, y: 0 });
    this.ghostIndices.set([]);
    this.removeListeners();
  }

  removeListeners() {
    if (this.globalMoveListener) this.globalMoveListener();
    if (this.globalUpListener) this.globalUpListener();
  }

  calculateGhostPosition(pointerX: number, pointerY: number) {
    if (!this.gridRect || !this.dragState().shape) return;

    // FIX: Relax boundary check to allow dragging below the grid (necessary for "lifted" drag visuals)
    if (pointerX < this.gridRect.left - 50 || pointerX > this.gridRect.right + 50 ||
        pointerY < this.gridRect.top - 100 || pointerY > this.gridRect.bottom + 150) {
      this.ghostIndices.set([]);
      this.lastGhostRow = -1;
      return;
    }

    // Offset for finger visibility
    const effectiveY = pointerY - (this.cellSize * 2.5); 
    const relativeX = pointerX - this.gridRect.left;
    const relativeY = effectiveY - this.gridRect.top;
    
    const col = Math.floor(relativeX / this.cellSize);
    const row = Math.floor(relativeY / this.cellSize);

    // Optimization: Only run heavy placement logic if the cell changed
    if (col !== this.lastGhostCol || row !== this.lastGhostRow) {
        this.lastGhostCol = col;
        this.lastGhostRow = row;
        
        const shape = this.dragState().shape!;
        const indices = this.getPlacementIndices(shape, row, col);
        this.ghostIndices.set(indices || []);
    }
  }

  getPlacementIndices(shape: BlockShape, startRow: number, startCol: number): number[] | null {
    const indices: number[] = [];
    const matrix = shape.matrix;
    const grid = this.grid();

    const shapeHeight = matrix.length;
    const shapeWidth = matrix[0].length;
    const adjustedRow = Math.round(startRow - (shapeHeight / 2) + 0.5);
    const adjustedCol = Math.round(startCol - (shapeWidth / 2) + 0.5);

    for (let r = 0; r < shapeHeight; r++) {
      for (let c = 0; c < shapeWidth; c++) {
        if (matrix[r][c] === 1) {
          const targetRow = adjustedRow + r;
          const targetCol = adjustedCol + c;
          
          if (targetRow < 0 || targetRow >= 8 || targetCol < 0 || targetCol >= 8) return null;
          
          const index = targetRow * 8 + targetCol;
          if (grid[index].filled) return null;
          indices.push(index);
        }
      }
    }
    return indices;
  }

  placePiece(indices: number[], shape: BlockShape, dockIndex: number): boolean {
    if (!indices || indices.length === 0) return false;

    this.movesSinceEcho.update(v => v + 1);
    if (this.movesSinceEcho() >= 10) this.snapshotEcho();
    
    const paradoxCondition = this.checkParadoxCondition(indices);
    const currentGrid = [...this.grid()];
    
    // Determine Star Position
    let starGridIndex = -1;
    if (shape.starPosition) {
       // Find top-left block of shape to map relative coords
       let firstBlockR = -1, firstBlockC = -1;
       const h = shape.matrix.length, w = shape.matrix[0].length;
       for(let r=0; r<h; r++) {
         for(let c=0; c<w; c++) if(shape.matrix[r][c]===1) { firstBlockR=r; firstBlockC=c; break; }
         if(firstBlockR!==-1) break;
       }
       if (firstBlockR !== -1) {
         const anchor = indices[0];
         const ar = Math.floor(anchor/8), ac = anchor%8;
         const sr = ar + (shape.starPosition.r - firstBlockR);
         const sc = ac + (shape.starPosition.c - firstBlockC);
         starGridIndex = sr*8 + sc;
       }
    }

    indices.forEach(idx => {
      currentGrid[idx] = {
        filled: true,
        colorClass: shape.colorClass,
        shadowClass: shape.shadowClass,
        baseColor: shape.baseColor,
        clearing: false,
        isStar: idx === starGridIndex
      };
    });

    this.grid.set(currentGrid); 
    this.addToScore(indices.length);
    this.audio.playPlacement();
    this.triggerHaptic();

    // REMOVE PIECE FROM DOCK ONLY ON SUCCESS
    const pieces = [...this.availablePieces()];
    pieces[dockIndex] = null;
    this.availablePieces.set(pieces);

    const linesCleared = this.checkLines(paradoxCondition);
    
    if (linesCleared === 0) {
      this.streakCount.set(0);
      if (!this.isFeverActive()) this.feverProgress.update(v => Math.max(0, v - 5));
    } else {
        if (!this.isFeverActive()) {
            let gain = 10 + (linesCleared >= 2 ? 25 : 0) + (15 * Math.min(3, this.streakCount()));
            this.feverProgress.update(v => Math.min(100, v + gain));
            if (this.feverProgress() >= 100) this.activateFever();
        }
    }

    const piecesRemaining = pieces.filter(p => p !== null).length;
    if (piecesRemaining === 0) {
      setTimeout(() => this.spawnPieces(), 300);
    } else {
      this.checkGameOver();
    }

    return true;
  }

  checkLines(potentialParadox: boolean = false): number {
    const grid = this.grid();
    let rowsToClear = new Set<number>();
    let colsToClear = new Set<number>();

    // 1. Natural Lines
    for (let r = 0; r < 8; r++) {
      let full = true;
      for (let c = 0; c < 8; c++) if (!grid[r * 8 + c].filled) full = false;
      if (full) rowsToClear.add(r);
    }
    for (let c = 0; c < 8; c++) {
      let full = true;
      for (let r = 0; r < 8; r++) if (!grid[r * 8 + c].filled) full = false;
      if (full) colsToClear.add(c);
    }

    // 2. Star Blast
    const starTriggers: {r: number, c: number}[] = [];
    rowsToClear.forEach(r => {
      for(let c = 0; c < 8; c++) if(grid[r*8+c].isStar) starTriggers.push({r, c});
    });
    colsToClear.forEach(c => {
      for(let r = 0; r < 8; r++) if(grid[r*8+c].isStar && !starTriggers.some(t => t.r===r && t.c===c)) starTriggers.push({r, c});
    });
    let starBlastTriggered = false;
    starTriggers.forEach(pos => {
      rowsToClear.add(pos.r);
      colsToClear.add(pos.c);
      starBlastTriggered = true;
    });

    // 3. Shockwave (Fever)
    let shockwaveTriggered = false;
    if (this.isFeverActive() && (rowsToClear.size > 0 || colsToClear.size > 0)) {
        const availableRows = [0,1,2,3,4,5,6,7].filter(r => !rowsToClear.has(r));
        const availableCols = [0,1,2,3,4,5,6,7].filter(c => !colsToClear.has(c));
        if (availableRows.length > 0 || availableCols.length > 0) {
            shockwaveTriggered = true;
            if (availableRows.length > 0 && (availableCols.length === 0 || Math.random() > 0.5)) {
                rowsToClear.add(availableRows[Math.floor(Math.random() * availableRows.length)]);
            } else {
                colsToClear.add(availableCols[Math.floor(Math.random() * availableCols.length)]);
            }
        }
    }

    const finalRows = Array.from(rowsToClear);
    const finalCols = Array.from(colsToClear);
    const totalLines = finalRows.length + finalCols.length;
    const paradoxTriggered = potentialParadox && totalLines > 0;

    // Mission Checks
    if (this.mode() === 'adventure') {
        if (this.missionType() === 'CODE_BREAKER') {
            if (finalRows.length > 0) this.horizontalLinesCleared.update(v => v + finalRows.length);
            if (finalCols.length > 0) this.verticalLinesCleared.update(v => v + finalCols.length);
        }
        else if (this.missionType() === 'COMBOS' && totalLines >= 2) this.missionProgress.update(p => p + 1);
        else if (this.missionType() === 'ECHOS' && paradoxTriggered) this.missionProgress.update(p => p + 1);
        this.checkWinCondition();
    }

    if (totalLines > 0) {
      this.clearLines(finalRows, finalCols, starBlastTriggered, starTriggers, shockwaveTriggered, paradoxTriggered);
    }
    return totalLines;
  }

  getOrphans(grid: Cell[], clearingIndices: Set<number>): number[] {
    const orphans: number[] = [];
    for(let i=0; i<64; i++) {
        if(!grid[i].filled || clearingIndices.has(i)) continue;
        const r = Math.floor(i/8), c = i%8;
        let neighbors = 0;
        if (r > 0 && grid[(r-1)*8+c].filled && !clearingIndices.has((r-1)*8+c)) neighbors++;
        if (r < 7 && grid[(r+1)*8+c].filled && !clearingIndices.has((r+1)*8+c)) neighbors++;
        if (c > 0 && grid[r*8+c-1].filled && !clearingIndices.has(r*8+c-1)) neighbors++;
        if (c < 7 && grid[r*8+c+1].filled && !clearingIndices.has(r*8+c+1)) neighbors++;
        if(neighbors === 0) orphans.push(i);
    }
    return orphans;
  }

  clearLines(rows: number[], cols: number[], starBlast: boolean, starOrigins: {r: number, c: number}[], shockwave: boolean, paradox: boolean) {
    const grid = [...this.grid()];
    const echoGrid = [...this.temporalEcho()]; // Clone echo grid to modify
    const uniqueIndices = new Set<number>();
    rows.forEach(r => { for (let c = 0; c < 8; c++) uniqueIndices.add(r * 8 + c); });
    cols.forEach(c => { for (let r = 0; r < 8; r++) uniqueIndices.add(r * 8 + c); });

    if (paradox) {
        this.getOrphans(grid, uniqueIndices).forEach(idx => uniqueIndices.add(idx));
        this.isParadoxActive.set(true);
        setTimeout(() => this.isParadoxActive.set(false), 500);
    }

    const totalLines = rows.length + cols.length;
    const blocksCleared = uniqueIndices.size;
    const currentStreak = this.streakCount() + 1;
    this.streakCount.set(currentStreak);

    // Visual Flash for Lines (Code Breaker Juice)
    if (this.missionType() === 'CODE_BREAKER') {
        const flashes: Flash[] = [];
        rows.forEach(r => flashes.push({ id: Math.random(), x: 0, y: r*this.cellSize, w: this.cellSize*8, h: this.cellSize, isVertical: false }));
        cols.forEach(c => flashes.push({ id: Math.random(), x: c*this.cellSize, y: 0, w: this.cellSize, h: this.cellSize*8, isVertical: true }));
        this.activeFlashes.update(curr => [...curr, ...flashes]);
        setTimeout(() => this.activeFlashes.update(curr => curr.filter(f => !flashes.includes(f))), 400);
    }

    let points = (blocksCleared * 10) + (totalLines * totalLines * 50) + (currentStreak * 20);
    if (starBlast) points += (100 * starOrigins.length); 
    if (paradox) points *= 5;

    this.addToScore(points);
    this.playClearLineSound(totalLines);
    this.triggerHaptic();
    
    // Juice & Feedback
    if (totalLines > 1 || currentStreak > 2 || starBlast || paradox) {
      this.shakeBoard.set(true);
      setTimeout(() => this.shakeBoard.set(false), 300);
    }

    const rect = this.gridElement.nativeElement.getBoundingClientRect();
    const cx = rect.left + rect.width/2 - this.boardContainer.nativeElement.getBoundingClientRect().left;
    const cy = rect.top + rect.height/2 - this.boardContainer.nativeElement.getBoundingClientRect().top;
    
    this.audio.playClear(totalLines);

    if (paradox) {
       this.spawnFloatingText(cx, cy, this.lang.t().mechanics.resonance, '#c084fc', 2.0, true);
    } else if (starBlast) {
       this.spawnFloatingText(cx, cy, this.lang.t().mechanics.starBlast, '#FDD835', 1.8, true);
    } else if (shockwave) {
       this.spawnFloatingText(cx, cy, this.lang.t().mechanics.shockwave, '#D32F2F', 1.8, true);
    } else if (totalLines > 1) {
       this.spawnFloatingText(cx, cy, `${this.lang.t().mechanics.combo} x${totalLines}!`, '#FDD835', 1.5, true);
    } else if (currentStreak > 1) {
       this.spawnFloatingText(cx, cy, this.lang.t().mechanics.excellent, '#fff', 1.3, true);
    }

    uniqueIndices.forEach(idx => {
      // Clear Main Grid
      if (grid[idx].filled) {
         this.spawnParticles(idx, grid[idx].baseColor);
         grid[idx] = { ...grid[idx], clearing: true, isStar: false };
      }

      // FIX: Clear Temporal Echo as well to prevent "Red Shadow" artifacts
      if (echoGrid[idx].filled) {
         echoGrid[idx] = { ...echoGrid[idx], filled: false };
      }
    });

    this.grid.set(grid);
    this.temporalEcho.set(echoGrid); // Apply cleared echo

    // FIX: Ensure brand new object references to avoid "shadow" ghosts of old cells
    setTimeout(() => {
      const freshGrid = this.grid().map((cell, idx) => {
         if (uniqueIndices.has(idx)) {
            // Strict reset of all properties
            return { filled: false, colorClass: '', shadowClass: '', baseColor: '', clearing: false, isStar: false };
         }
         return cell;
      });
      this.grid.set(freshGrid);
      const pieces = this.availablePieces().filter(p => p !== null);
      if (pieces.length > 0) this.checkGameOver();
    }, 250);
  }

  spawnFloatingText(x: number, y: number, text: string, color: string, scale: number, forceCenter: boolean = false) {
    const id = ++this.floatingTextIdCounter;
    this.floatingTexts.update(texts => [...texts, { id, x, y, text, color, scale, isCentered: forceCenter }]);
    setTimeout(() => this.floatingTexts.update(texts => texts.filter(t => t.id !== id)), 1500);
  }

  spawnParticles(cellIndex: number, color: string) {
    const row = Math.floor(cellIndex / 8), col = cellIndex % 8;
    const px = (col * this.cellSize) + (this.cellSize / 2);
    const py = (row * this.cellSize) + (this.cellSize / 2);
    const newParticles: Particle[] = [];
    const count = this.isFeverActive() ? 8 : 4; 
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count;
      const v = 30 + Math.random() * 40;
      newParticles.push({
        id: Math.random(), x: px, y: py,
        vx: Math.cos(angle) * v + (Math.random() * 20 - 10),
        vy: Math.sin(angle) * v + (Math.random() * 20 - 10),
        color: this.isFeverActive() ? '#000000' : color, 
        size: 8 + Math.random() * 8, rotation: Math.random() * 360
      });
    }
    this.particles.update(p => [...p, ...newParticles]);
    setTimeout(() => this.particles.update(p => p.slice(count)), 600);
  }

  checkGameOver() {
    if (this.gameWon()) return;
    const pieces = this.availablePieces().filter(p => p !== null) as BlockShape[];
    if (pieces.length === 0) return;
    let canMove = false;
    for (const piece of pieces) {
      if (this.canFitAnywhere(piece)) { canMove = true; break; }
    }
    if (!canMove) {
      this.stopFever();
      this.gameOver.set(true);
      this.gameLost.emit();
      this.isNewRecord.set(this.score() >= this.highScore() && this.score() > 0);
    }
  }

  canFitAnywhere(piece: BlockShape): boolean {
    const h = piece.matrix.length, w = piece.matrix[0].length;
    const grid = this.grid();
    for (let r = 0; r <= 8 - h; r++) {
      for (let c = 0; c <= 8 - w; c++) {
        let fits = true;
        loop_piece:
        for (let pr = 0; pr < h; pr++) {
          for (let pc = 0; pc < w; pc++) {
            if (piece.matrix[pr][pc] === 1) {
              const idx = (r + pr) * 8 + (c + pc);
              if (grid[idx].filled && !grid[idx].clearing) { fits = false; break loop_piece; }
            }
          }
        }
        if (fits) return true;
      }
    }
    return false;
  }

  restartGame() {
    this.grid.set(this.createEmptyGrid());
    this.temporalEcho.set(this.createEmptyGrid());
    this.movesSinceEcho.set(0);
    this.score.set(0);
    this.streakCount.set(0);
    this.gameOver.set(false);
    this.gameWon.set(false);
    this.gameComplete.set(false);
    this.stopFever();
    this.setupMission();
    this.spawnPieces();
  }

  playPlacementSound(volume: number) {}
  playClearLineSound(comboCount: number) {}
  triggerHaptic() { if (navigator.vibrate) navigator.vibrate(10); }

  isGhostCell(index: number) { return this.ghostIndices().includes(index); }
}