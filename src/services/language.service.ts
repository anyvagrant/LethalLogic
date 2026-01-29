import { Injectable, signal, computed, inject } from '@angular/core';
import { PersistenceService } from './persistence.service';

export type Language = 'pt' | 'en';

const DICTIONARY = {
  pt: {
    menu: {
      adventure: 'ASSALTO',
      classic: 'INFINITO',
      newMode: 'NOVO MODO!',
      continue: 'CONTINUAR!',
      consecutiveVictories: 'VITÓRIAS CONSECUTIVAS',
      victory: 'SUCESSO NO ROUBO!',
      subtitle: 'INVASOR DE MENTES',
      newRecord: 'NOVO RECORDE!'
    },
    game: {
      score: 'PONTOS',
      record: 'RECORDE',
      gameOver: 'MISSÃO ABORTADA',
      tryAgain: 'TENTE NOVAMENTE',
      playAgain: 'REINICIAR ASSALTO',
      backMenu: 'ABANDONAR',
      backMap: 'MAPA',
      level: 'ALVO',
      noMoves: 'SEM SAÍDA',
      objectiveNotMet: 'FALHA NA EXTRAÇÃO',
      newRecord: '🏆 NOVO RECORDE! 🏆',
      levelComplete: 'ALVO ELIMINADO!',
      nextLevel: 'PRÓXIMO ALVO'
    },
    adventure: {
      title: 'MODO ASSALTO',
      objective: 'OBJETIVO',
      missionComplete: 'ALVO ELIMINADO!',
      topMountain: 'O GRANDE ROUBO',
      start: 'INFILTRAÇÃO',
      play: 'INICIAR',
      playLevel: 'INICIAR ASSALTO',
      targets: {
        score: 'PONTOS',
        gems: 'JOIAS',
        combos: 'COMBOS',
        echos: 'ECOS'
      }
    },
    briefing: {
      phase1Title: 'ALCANCE A META!',
      phase1Text: 'Obtenha a pontuação necessária para invadir o sistema.',
      phase2Title: 'QUEBRA DE CÓDIGO!',
      phase2Text: 'Os firewalls estão ativos. Decifre a segurança limpando o número exigido de linhas horizontais e verticais.',
      phase3Title: 'COMBOS LETAIS!',
      phase3Text: 'Ataques simples não bastam. Realize combos múltiplos para vencer.',
      phase4Title: 'DOMINE O TEMPO!',
      phase4Text: 'Use a Ressonância de Chronos para colapsar o paradoxo final.',
      startHeist: 'INICIAR ASSALTO'
    },
    mechanics: {
      feverMode: 'MODO FEBRE!',
      fever: 'FEBRE',
      resonance: 'RESSONÂNCIA!',
      paradox: 'PARADOXO!',
      starBlast: 'EXPLOSÃO ESTELAR!',
      shockwave: 'CHOQUE SÍSMICO!',
      combo: 'COMBO',
      streak: 'SEQUÊNCIA',
      excellent: 'EXCELENTE!',
      amazing: 'INCRÍVEL!',
      fantastic: 'FANTÁSTICO!',
      echoRecorded: 'ECO GRAVADO',
      pointsX2: 'PONTOS 2X'
    },
    endGame: {
      title: 'SISTEMA DOMINADO!',
      text: 'Parabéns, Invasor. Você decifrou todos os protocolos e alcançou o núcleo do Lethal Logic. Sua mente é a arma definitiva.',
      reset: 'REINICIAR JORNADA',
      menu: 'VOLTAR AO MENU',
      infinite: 'MODO INFINITO'
    }
  },
  en: {
    menu: {
      adventure: 'HEIST',
      classic: 'INFINITE',
      newMode: 'NEW MODE!',
      continue: 'CONTINUE!',
      consecutiveVictories: 'CONSECUTIVE WINS',
      victory: 'HEIST SUCCESS!',
      subtitle: 'MIND INVASOR',
      newRecord: 'NEW RECORD!'
    },
    game: {
      score: 'SCORE',
      record: 'RECORD',
      gameOver: 'MISSION ABORTED',
      tryAgain: 'RETRY',
      playAgain: 'RESTART HEIST',
      backMenu: 'ABANDON',
      backMap: 'MAP',
      level: 'TARGET',
      noMoves: 'TRAPPED',
      objectiveNotMet: 'EXTRACTION FAILED',
      newRecord: '🏆 NEW RECORD! 🏆',
      levelComplete: 'TARGET ELIMINATED!',
      nextLevel: 'NEXT TARGET'
    },
    adventure: {
      title: 'HEIST MODE',
      objective: 'OBJECTIVE',
      missionComplete: 'TARGET ELIMINATED!',
      topMountain: 'THE BIG SCORE',
      start: 'INFILTRATION',
      play: 'START',
      playLevel: 'START HEIST',
      targets: {
        score: 'POINTS',
        gems: 'GEMS',
        combos: 'COMBOS',
        echos: 'ECHOES'
      }
    },
    briefing: {
      phase1Title: 'REACH THE GOAL!',
      phase1Text: 'Get the necessary score to hack the system.',
      phase2Title: 'CODE BREAK!',
      phase2Text: 'Firewalls active. Decrypt security by clearing the required number of horizontal and vertical lines.',
      phase3Title: 'LETHAL COMBOS!',
      phase3Text: 'Simple attacks are not enough. Perform multiple combos to win.',
      phase4Title: 'MASTER TIME!',
      phase4Text: 'Use the Chronos Resonance to collapse the final paradox.',
      startHeist: 'START HEIST'
    },
    mechanics: {
      feverMode: 'FEVER MODE!',
      fever: 'FEVER',
      resonance: 'RESONANCE!',
      paradox: 'PARADOX!',
      starBlast: 'STAR BLAST!',
      shockwave: 'SHOCKWAVE!',
      combo: 'COMBO',
      streak: 'STREAK',
      excellent: 'EXCELLENT!',
      amazing: 'AMAZING!',
      fantastic: 'FANTASTIC!',
      echoRecorded: 'ECHO RECORDED',
      pointsX2: 'POINTS 2X'
    },
    endGame: {
      title: 'SYSTEM DOMINATED!',
      text: 'Congratulations, Invader. You have decrypted all protocols and reached the core of Lethal Logic. Your mind is the ultimate weapon.',
      reset: 'RESET JOURNEY',
      menu: 'RETURN TO MENU',
      infinite: 'INFINITE MODE'
    }
  }
};

@Injectable({
  providedIn: 'root'
})
export class LanguageService {
  private persistence = inject(PersistenceService);
  
  currentLang = signal<Language>('pt');
  t = computed(() => DICTIONARY[this.currentLang()]);

  constructor() {
    this.loadLanguage();
  }

  toggleLanguage() {
    const newLang = this.currentLang() === 'pt' ? 'en' : 'pt';
    this.currentLang.set(newLang);
    this.persistence.saveLanguage(newLang);
  }

  private loadLanguage() {
    const stored = this.persistence.getLanguage();
    if (stored === 'pt' || stored === 'en') {
      this.currentLang.set(stored as Language);
    } else {
      this.currentLang.set('pt');
    }
  }
}