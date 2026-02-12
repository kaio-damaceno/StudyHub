
import { AdaptEngine } from './AdaptEngine';
import { AdaptFlashcard } from './types';

export class Scheduler {
  private engine: AdaptEngine;

  constructor() {
    this.engine = new AdaptEngine();
  }

  /**
   * Gera a "Fila de Foco" determinística.
   * Seleciona apenas cartões que ultrapassaram o limiar de risco seguro.
   * 
   * Critério: R_esc > 10% (ou seja, retrievability < 90%)
   */
  public getFocusQueue(cards: AdaptFlashcard[], limit: number = 50): AdaptFlashcard[] {
    const now = Date.now();

    // 1. Enriquecer cada card com seu Risco Atual calculado pela física
    const analyzedCards = cards.map(card => {
        // Se nextReview já passou, o risco é implicitamente alto, mas calculamos o valor real
        // para ordenação precisa entre cartões atrasados.
        const risk = this.engine.calculateCurrentRisk(card, now);
        return { card, risk };
    });

    // 2. Filtrar: Apenas cards que violam a segurança da memória (Risco > 10%)
    // ou cards Novos (S1) que ainda não foram vistos.
    const dueCards = analyzedCards.filter(item => {
        const isNew = item.card.stage === 'S1_ACQUISITION' && item.card.metrics.stability === 0;
        const isRisky = item.risk > 0.10; // Limiar de segurança do Contrato Cognitivo
        return isNew || isRisky;
    });

    // 3. Ordenar: Maior risco primeiro (Conservadorismo Cognitivo)
    // S1 tem prioridade máxima (risco 1.0)
    dueCards.sort((a, b) => b.risk - a.risk);

    // 4. Retornar os Top N
    return dueCards.slice(0, limit).map(item => item.card);
  }

  /**
   * Retorna metadados visuais baseados no Risco, sem alterar o estado.
   */
  public getCardStatusLabel(card: AdaptFlashcard): { text: string, color: string } {
    const risk = this.engine.calculateCurrentRisk(card);
    
    if (card.stage === 'S1_ACQUISITION') return { text: 'Novo/Crítico', color: 'text-blue-400' };
    if (card.stage === 'S5_LAPSE') return { text: 'Lapso', color: 'text-red-500' };
    
    if (risk > 0.30) return { text: 'Urgente', color: 'text-red-400' };
    if (risk > 0.10) return { text: 'Revisar', color: 'text-orange-400' };
    
    return { text: 'Seguro', color: 'text-green-400' };
  }
}
