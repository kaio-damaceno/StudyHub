
import { AdaptFlashcard, CognitiveStage, UserGrade, createNewFlashcard } from './types';

export interface AnkiNote {
  id: string;
  front: string;
  back: string;
  deckName: string;
  interval: number;
  ease: number;
  lapses: number;
  reps: number;
  queue: number; // 0=new, 1=lrn, 2=rev, 3=day_lrn, -1=susp, -2=buried
}

export class AnkiService {
  /**
   * Converte uma nota bruta do Anki para o Motor Adaptativo do Study Hub.
   * Aplica a Reconstrução Cognitiva baseada no histórico canônico.
   */
  public static mapToAdapt(ankiNote: AnkiNote, deckId: string): AdaptFlashcard {
    const card = createNewFlashcard(deckId, ankiNote.front, ankiNote.back);
    
    // 1. Determinação do Estágio (S1-S5)
    let stage: CognitiveStage = 'S1_ACQUISITION';
    if (ankiNote.queue === 0) stage = 'S1_ACQUISITION';
    else if (ankiNote.queue === 1 || ankiNote.queue === 3) stage = 'S2_FIXATION';
    else if (ankiNote.queue === 2) {
      if (ankiNote.interval > 21) stage = 'S4_RETENTION';
      else stage = 'S3_CONSOLIDATION';
    } else if (ankiNote.lapses > 0 && ankiNote.interval <= 1) {
      stage = 'S5_LAPSE';
    }

    // 2. Tradução de Métricas (Reconstrução)
    // Anki Ease Factor (2500 = 2.5x) -> Adapt Difficulty (0.0 a 1.0)
    // No Anki, 250% é o padrão. No Adapt, 0.3 é o padrão (fácil).
    // Ease 130% (mínimo Anki) -> Dificuldade ~0.9 (Muito difícil)
    // Ease 300% -> Dificuldade ~0.1 (Muito fácil)
    const easeNormalized = ankiNote.ease / 1000; // 2.5
    const difficulty = Math.max(0.1, Math.min(1.0, 1 - (easeNormalized / 4)));

    // Estabilidade inicial baseada no intervalo atual do Anki
    const stability = ankiNote.interval > 0 ? ankiNote.interval : 0;

    return {
      ...card,
      id: `anki_${ankiNote.id}`,
      stage,
      metrics: {
        ...card.metrics,
        difficulty,
        stability,
        lastReview: Date.now(),
      },
      tags: [...card.tags, 'anki_import'],
      repetitions: ankiNote.reps
    };
  }
}
