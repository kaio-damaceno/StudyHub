
import { AdaptEngine } from './AdaptEngine';
import { 
  AdaptFlashcard, 
  CardPresentation, 
  SessionSummary, 
  DeckHealth, 
  UserGrade, 
  HumanExplanation 
} from './types';

interface SessionParams {
  deckId?: string;
  deckIds?: string[]; // Suporte a agregação de hierarquia
  timeLimitMinutes?: number;
  cardLimit?: number;
}

/**
 * FLASHCARD API (Application Layer)
 */
export class FlashcardAPI {
  private engine: AdaptEngine;
  private sessionFatigue: number = 0.0;
  private reviewedCount: number = 0;
  private correctCount: number = 0;

  constructor() {
    this.engine = new AdaptEngine();
  }

  public getRelevantCards(allCards: AdaptFlashcard[], params: SessionParams): CardPresentation[] {
    const { deckId, deckIds, cardLimit = 50 } = params;
    const now = Date.now();

    // Filtra cartões baseando-se no ID único ou na lista de IDs (agregados)
    const deckCards = allCards.filter(c => {
      if (c.isSuspended) return false;
      
      // Estudo agregado: se deckIds for provido (pastas pai), usa ele
      if (deckIds && deckIds.length > 0) {
          return deckIds.includes(c.deckId);
      }
      
      // Estudo individual
      if (deckId) return c.deckId === deckId;
      
      return true;
    });

    const candidates = deckCards.map(card => {
      const risk = this.engine.calculateCurrentRisk(card, now);
      const isNew = card.stage === 'S1_ACQUISITION' && card.metrics.stability === 0;
      const isOverdue = card.nextReview ? card.nextReview < now : false;
      
      let priority = risk;
      if (isNew) priority = 2.0; 
      else if (isOverdue) priority += 0.5; 

      return { card, risk, priority, isNew };
    });

    const relevant = candidates.filter(c => {
       const isDue = c.card.nextReview ? c.card.nextReview <= now : true;
       return isDue || c.isNew;
    });

    // Ordena por prioridade: cartões atrasados e novos primeiro
    relevant.sort((a, b) => b.priority - a.priority);
    const sessionCards = relevant.slice(0, cardLimit);

    return sessionCards.map(item => ({
      card: item.card,
      priorityScore: item.priority,
      explanation: this.generateExplanation(item.card, item.risk, item.isNew)
    }));
  }

  public registerAnswer(card: AdaptFlashcard, grade: UserGrade, timeToRecall: number): { updatedCard: AdaptFlashcard; feedback: string } {
    this.reviewedCount++;
    if (grade >= 3) this.correctCount++;
    
    const fatigueCost = grade === 1 ? 0.05 : (grade === 2 ? 0.03 : 0.01);
    this.sessionFatigue = Math.min(1.0, this.sessionFatigue + fatigueCost);

    const updatedCard = this.engine.processReview(card, grade, timeToRecall, this.sessionFatigue);

    const timeDiff = (updatedCard.nextReview || Date.now()) - Date.now();
    const feedback = this.generateSchedulingFeedback(grade, timeDiff, updatedCard.stage);

    return { updatedCard, feedback };
  }

  public getDeckHealth(allCards: AdaptFlashcard[], deckId: string, descendantIds?: string[]): DeckHealth {
    const targetIds = descendantIds || [deckId];
    const deckCards = allCards.filter(c => targetIds.includes(c.deckId));
    const total = deckCards.length;
    
    if (total === 0) return { deckId, healthScore: 100, statusMessage: "Vazio", distribution: { new: 0, learning: 0, review: 0, suspended: 0 } };

    const now = Date.now();
    let criticalCount = 0;
    const distribution = { new: 0, learning: 0, review: 0, suspended: 0 };

    deckCards.forEach(c => {
      if (c.isSuspended) distribution.suspended++;
      else if (c.stage === 'S1_ACQUISITION') distribution.new++;
      else if (c.stage === 'S2_FIXATION') distribution.learning++;
      else distribution.review++;

      const isOverdue = c.nextReview ? c.nextReview < now : false;
      const risk = this.engine.calculateCurrentRisk(c, now);
      if (isOverdue || risk > 0.30) criticalCount++;
    });

    const healthScore = Math.max(0, 100 - Math.round((criticalCount / total) * 100));
    let statusMessage = "Saudável";
    if (healthScore < 50) statusMessage = "Muitos Atrasos";
    else if (healthScore < 80) statusMessage = "Requer Atenção";

    return { deckId, healthScore, statusMessage, distribution };
  }

  public getSessionSummary(): SessionSummary {
    const retentionRate = this.reviewedCount > 0 ? Math.round((this.correctCount / this.reviewedCount) * 100) : 100;
    let fatigueMessage = "Mente fresca.";
    if (this.sessionFatigue > 0.5) fatigueMessage = "Cansaço leve.";
    if (this.sessionFatigue > 0.8) fatigueMessage = "Fadiga alta. Pausa recomendada.";

    return { cardsReviewed: this.reviewedCount, retentionRate, sessionFatigue: Math.round(this.sessionFatigue * 100), fatigueMessage };
  }

  private generateExplanation(card: AdaptFlashcard, risk: number, isNew: boolean): HumanExplanation {
    if (isNew) return { message: "Novo conceito.", visualCue: 'new' };
    if (card.stage === 'S5_LAPSE') return { message: "Lapso recente.", visualCue: 'critical' };
    
    const isOverdue = card.nextReview ? card.nextReview < Date.now() : false;
    
    if (isOverdue) {
        if (risk > 0.4) return { message: "Esquecimento iminente.", visualCue: 'critical' };
        return { message: "Revisão pendente.", visualCue: 'warning' };
    }

    return { message: "Adiantamento (Cram).", visualCue: 'safe' };
  }

  private generateSchedulingFeedback(grade: UserGrade, timeDiffMs: number, stage: string): string {
    if (stage === 'S1_ACQUISITION') {
        if (grade === 1) return "Errou? Vamos ver de novo já já.";
        return "Aprendendo... Reverei em breve.";
    }

    const minutes = timeDiffMs / (1000 * 60);
    const hours = minutes / 60;
    const days = hours / 24;

    let timeText = "";
    if (minutes < 60) timeText = `${Math.round(minutes)}m`;
    else if (hours < 24) timeText = `${Math.round(hours)}h`;
    else timeText = `${Math.round(days)} dias`;

    if (grade === 1) return "Resetado para aprender.";
    return `Agendado para ${timeText}.`;
  }
}
