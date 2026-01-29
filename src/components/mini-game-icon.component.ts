import { Component, ChangeDetectionStrategy, input } from '@angular/core';

@Component({
  selector: 'app-mini-game-icon',
  standalone: true,
  template: `
    <div class="flex flex-col items-center gap-1 active:scale-95 transition-transform cursor-pointer">
      <div class="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl border-2 border-white/40 flex items-center justify-center shadow-lg relative overflow-hidden">
        <ng-content></ng-content>
      </div>
      <div class="bg-[#4a7aed] text-white text-[10px] font-bold px-2 py-0.5 rounded-full border border-[#6b8ff0]">
        {{ label() }}
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MiniGameIconComponent {
  label = input.required<string>();
}