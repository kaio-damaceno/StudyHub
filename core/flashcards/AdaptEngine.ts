
import { AdaptFlashcard, CognitiveStage, UserGrade, ReviewLog, FlashcardType } from './types';

interface AlgorithmConfig {
  maxRisk: number;       // Padrão 0.10 (10% de risco = 90% de retenção)
  fatigueImpact: number; // 0.3
  baseIntervalS1: number; // 10 minutos
}

const DEFAULT_CONFIG: AlgorithmConfig = {
  maxRisk: 0.10,
  fatigueImpact: 0.3, 
  baseIntervalS1: 10
};

/**
 * MOTOR ADAPT-SRS (CORRIGIDO v2)
 * Implementação alinhada com a percepção humana de tempo.
 * Base Matemática: Decaimento Exponencial Ancorado em 90% (R90).
 */
export class AdaptEngine {
  private config: AlgorithmConfig;

  constructor(config: Partial<AlgorithmConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  // ===========================================================================
  // 1. Risco de Esquecimento (R_esc)
  // ===========================================================================
  
  /**
   * Calcula o risco atual (0.0 a 1.0).
   * Fórmula Corrigida: R = 0.9 ^ (dias / estabilidade)
   * Onde 'estabilidade' é o tempo exato para a memória chegar a 90%.
   */
  public calculateCurrentRisk(card: AdaptFlashcard, now: number = Date.now()): number {
    if (card.stage === 'S1_ACQUISITION' || card.metrics.stability <= 0) {
        // Se estamos em aquisição, o risco é baseado em minutos, não dias
        const minutesElapsed = (now - card.metrics.lastReview) / (1000 * 60);
        
        // Curva de esquecimento ultra-rápida para memória de curto prazo (S1)
        // Decai para 50% em 20 minutos se não houver reforço
        if (minutesElapsed < 1) return 0;
        const shortTermRetrievability = Math.pow(0.5, minutesElapsed / 20);
        return 1 - shortTermRetrievability;
    }

    const timeElapsedDays = (now - card.metrics.lastReview) / (1000 * 60 * 60 * 24);
    const { stability, difficulty, complexity } = card.metrics;

    // Modulador de Complexidade:
    // Se o card é muito complexo (M > 1), ele decai visualmente mais rápido
    // para o motor ser mais conservador.
    const effectiveStability = stability / complexity;

    // Fórmula R90:
    // Retenção = 0.9 elevado a (tempo / estabilidade)
    const retrievability = Math.pow(0.9, timeElapsedDays / effectiveStability);
    
    return Math.min(1, Math.max(0, 1 - retrievability));
  }

  // ===========================================================================
  // 2. Dificuldade Percebida (Dp)
  // ===========================================================================

  private calculateNewDifficulty(
    currentDifficulty: number, 
    grade: UserGrade, 
    timeToRecall: number,
    cardType: FlashcardType
  ): number {
    // Delta linear simplificado
    // 1(Erro): +0.20 | 2(Difícil): +0.10 | 3(Bom): -0.05 | 4(Fácil): -0.15
    let delta = 0;
    if (grade === 1) delta = 0.20;
    else if (grade === 2) delta = 0.10;
    else if (grade === 3) delta = -0.05;
    else if (grade === 4) delta = -0.15;

    // Penalidade por Tempo (Hesitação)
    // PONTO IMPORTANTE: Não aplica penalidade se o card for de ÁUDIO
    let timePenalty = 0;
    if (cardType !== 'AUDIO' && grade >= 3 && timeToRecall > 15) {
        timePenalty = 0.15; 
        // Se disse que foi fácil (4) mas demorou, anula o bônus de facilidade
        if (grade === 4) delta = 0; 
    }

    // Drift: Dificuldade tende levemente a subir se não houver "Fácil" constante
    // Isso evita o "Inferninho de Estabilidade"
    const drift = 0.01; 

    return Math.min(1, Math.max(0.1, currentDifficulty + delta + timePenalty + drift));
  }

  // ===========================================================================
  // 3. Próximo Intervalo (Safe Interval)
  // ===========================================================================

  private findSafeIntervalDays(stability: number, targetRisk: number): number {
    const retentionTarget = 1 - targetRisk;
    const intervalMultiplier = Math.log(retentionTarget) / Math.log(0.9);
    
    return stability * intervalMultiplier;
  }

  // ===========================================================================
  // 4. Processamento Principal
  // ===========================================================================

  public processReview(
    card: AdaptFlashcard,
    grade: UserGrade,
    timeToRecall: number,
    currentFatigue: number
  ): AdaptFlashcard {
    const now = Date.now();
    const oldMetrics = card.metrics;
    
    // 1. Nova Dificuldade (Passando o tipo do card)
    const newDifficulty = this.calculateNewDifficulty(oldMetrics.difficulty, grade, timeToRecall, card.type);

    // 2. Novo Estágio e Estabilidade
    let newStage = card.stage;
    let newStability = oldMetrics.stability;

    if (grade === 1) {
        // --- ERRO (AGAIN) ---
        const fatigueFactor = currentFatigue > 0.7 ? (1 - this.config.fatigueImpact) : 1.0;
        
        if (newStage === 'S1_ACQUISITION') {
            newStability = 0; 
        } else {
            const retentionFactor = 0.7 * (1 - newDifficulty) * fatigueFactor;
            newStability = Math.max(1, newStability * retentionFactor); 
            newStage = 'S5_LAPSE';
        }

    } else {
        // --- ACERTO (HARD, GOOD, EASY) ---
        
        if (newStage === 'S1_ACQUISITION') {
            if (grade === 2) {
                newStability = 0; 
            } else {
                newStage = 'S2_FIXATION';
                newStability = grade === 4 ? 4 : 1; 
            }
        } else {
            const baseMult = 2.5;
            let difficultyMod = 1 / (1 + newDifficulty * 1.5); 
            const gradeBonus = grade === 4 ? 1.3 : (grade === 2 ? 0.8 : 1.0);
            let newMult = baseMult * difficultyMod * gradeBonus;
            newMult = Math.max(1.1, newMult);
            newStability = newStability * newMult;

            if (newStability > 60) newStage = 'S4_RETENTION';
            else if (newStability > 14) newStage = 'S3_CONSOLIDATION';
            else if (newStability > 3) newStage = 'S2_FIXATION';
            
            if (newStage === 'S5_LAPSE') newStage = 'S2_FIXATION';
        }
    }

    let nextReviewTimestamp: number;
    let safeIntervalDays = 0;

    if (newStage === 'S1_ACQUISITION') {
        const minutes = grade === 1 ? 1 : (grade === 2 ? 6 : this.config.baseIntervalS1);
        nextReviewTimestamp = now + (minutes * 60 * 1000);
        safeIntervalDays = 0;
    } else {
        safeIntervalDays = this.findSafeIntervalDays(newStability, this.config.maxRisk);
        nextReviewTimestamp = now + (safeIntervalDays * 24 * 60 * 60 * 1000);
    }

    return {
        ...card,
        stage: newStage,
        nextReview: nextReviewTimestamp,
        interval: Math.round(safeIntervalDays),
        repetitions: (card.repetitions || 0) + 1,
        status: newStage === 'S1_ACQUISITION' ? 'learning' : 'review',
        metrics: {
            ...oldMetrics,
            difficulty: newDifficulty,
            stability: newStability,
            lastReview: now,
            history: [...oldMetrics.history, {
                timestamp: now,
                grade,
                timeToRecall,
                contextualFatigue: currentFatigue,
                preReviewStability: oldMetrics.stability,
                preReviewDifficulty: oldMetrics.difficulty,
                calculatedRisk: 0 
            }]
        }
    };
  }
}
