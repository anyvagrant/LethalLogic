import { Injectable, signal, inject } from '@angular/core';
import { PersistenceService } from './persistence.service';

@Injectable({
  providedIn: 'root'
})
export class AudioService {
  private persistence = inject(PersistenceService);
  
  // State
  isMuted = signal<boolean>(false);
  
  // Audio Context for SFX
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;

  // BGM Element
  private bgmAudio: HTMLAudioElement | null = null;
  private readonly BGM_VOLUME = 0.4;

  constructor() {
    this.isMuted.set(this.persistence.getMuteState());
    this.initAudioContext();
    this.initBGM();
    this.applyMuteState();
  }

  async unlockAudio() {
    if (this.ctx && this.ctx.state === 'suspended') {
      await this.ctx.resume();
    }
    this.playBGM();
  }

  toggleMute() {
    this.isMuted.update(v => !v);
    this.persistence.saveMuteState(this.isMuted());
    this.applyMuteState();
  }

  private initAudioContext() {
    try {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      this.masterGain = this.ctx.createGain();
      this.masterGain.connect(this.ctx.destination);
    } catch (e) {
      console.error('Web Audio API not supported', e);
    }
  }

  private initBGM() {
    this.bgmAudio = new Audio();
    this.bgmAudio.src = 'assets/bgm.mp3'; 
    this.bgmAudio.loop = true;
    this.bgmAudio.volume = this.BGM_VOLUME;
  }

  private applyMuteState() {
    const muted = this.isMuted();
    if (this.bgmAudio) {
      if (muted) {
        this.bgmAudio.pause();
      } else {
        if (this.ctx && this.ctx.state === 'running') {
            this.bgmAudio.play().catch(() => {});
        }
      }
    }
    if (this.masterGain) {
      const t = this.ctx?.currentTime || 0;
      this.masterGain.gain.cancelScheduledValues(t);
      this.masterGain.gain.setValueAtTime(this.masterGain.gain.value, t);
      this.masterGain.gain.linearRampToValueAtTime(muted ? 0 : 1, t + 0.1);
    }
  }

  private playBGM() {
    if (!this.isMuted() && this.bgmAudio) {
      this.bgmAudio.play().catch(e => console.log("Waiting for interaction to play BGM"));
    }
  }

  // --- PROCEDURAL SFX GENERATION ---

  playPlacement() {
    if (this.isMuted() || !this.ctx || !this.masterGain) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(200, t);
    osc.frequency.exponentialRampToValueAtTime(50, t + 0.15);

    gain.gain.setValueAtTime(0.8, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.15);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(t);
    osc.stop(t + 0.15);
    // GC Cleanup
    setTimeout(() => { osc.disconnect(); gain.disconnect(); }, 200);
  }

  playClear(count: number = 1) {
    if (this.isMuted() || !this.ctx || !this.masterGain) return;
    const t = this.ctx.currentTime;
    const notes = [1046.50]; 
    if (count > 1) notes.push(1318.51);
    if (count > 2) notes.push(1568.00);
    if (count > 3) notes.push(2093.00);

    notes.forEach((freq, i) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, t);
        gain.gain.setValueAtTime(0, t);
        gain.gain.linearRampToValueAtTime(0.3, t + 0.02); 
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.4 + (i * 0.1));
        osc.connect(gain);
        gain.connect(this.masterGain!);
        osc.start(t);
        osc.stop(t + 0.5);
        setTimeout(() => { osc.disconnect(); gain.disconnect(); }, 600);
    });
  }

  playCombo() {
    if (this.isMuted() || !this.ctx || !this.masterGain) return;
    const t = this.ctx.currentTime;
    // Note 1
    const osc1 = this.ctx.createOscillator();
    const gain1 = this.ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(523.25, t);
    gain1.gain.setValueAtTime(0.3, t);
    gain1.gain.exponentialRampToValueAtTime(0.01, t + 0.1);
    osc1.connect(gain1);
    gain1.connect(this.masterGain);
    osc1.start(t);
    osc1.stop(t + 0.1);
    // Note 2
    const osc2 = this.ctx.createOscillator();
    const gain2 = this.ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(783.99, t + 0.1);
    gain2.gain.setValueAtTime(0, t + 0.1);
    gain2.gain.linearRampToValueAtTime(0.3, t + 0.12);
    gain2.gain.exponentialRampToValueAtTime(0.01, t + 0.3);
    osc2.connect(gain2);
    gain2.connect(this.masterGain);
    osc2.start(t + 0.1);
    osc2.stop(t + 0.3);
    
    setTimeout(() => {
        osc1.disconnect(); gain1.disconnect();
        osc2.disconnect(); gain2.disconnect();
    }, 400);
  }

  playChronos() {
    if (this.isMuted() || !this.ctx || !this.masterGain) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const lfo = this.ctx.createOscillator();
    const lfoGain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(110, t); 
    lfo.type = 'square';
    lfo.frequency.setValueAtTime(20, t);
    lfoGain.gain.setValueAtTime(500, t); 

    lfo.connect(lfoGain);
    lfoGain.connect(osc.frequency);
    gain.gain.setValueAtTime(0.2, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.3);

    osc.connect(gain);
    gain.connect(this.masterGain);
    lfo.start(t);
    osc.start(t);
    lfo.stop(t + 0.3);
    osc.stop(t + 0.3);
    
    setTimeout(() => {
        lfo.disconnect(); lfoGain.disconnect();
        osc.disconnect(); gain.disconnect();
    }, 400);
  }

  playWin() {
    if (this.isMuted() || !this.ctx || !this.masterGain) return;
    const t = this.ctx.currentTime;
    const melody = [523.25, 659.25, 783.99]; 
    const spacing = 0.1;

    melody.forEach((freq, i) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        const start = t + (i * spacing);
        osc.type = 'square'; 
        osc.frequency.setValueAtTime(freq, start);
        gain.gain.setValueAtTime(0, start);
        gain.gain.linearRampToValueAtTime(0.15, start + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.01, start + 0.3);
        osc.connect(gain);
        gain.connect(this.masterGain!);
        osc.start(start);
        osc.stop(start + 0.3);
        setTimeout(() => { osc.disconnect(); gain.disconnect(); }, 500);
    });
  }
}