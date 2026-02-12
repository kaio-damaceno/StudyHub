
export type CognitiveStage = 'S1_ACQUISITION' | 'S2_FIXATION' | 'S3_CONSOLIDATION' | 'S4_RETENTION' | 'S5_LAPSE';

export type FlashcardType = 'BASIC' | 'REVERSE' | 'CLOZE' | 'TYPING' | 'IMAGE_OCCLUSION' | 'AUDIO';

export type UserGrade = 1 | 2 | 3 | 4;

export interface OcclusionRect {
  id: string;
  x: number; // Porcentagem
  y: number; // Porcentagem
  width: number; // Porcentagem
  height: number; // Porcentagem
}

export interface ReviewLog {
  timestamp: number;
  grade: UserGrade;
  timeToRecall: number; 
  contextualFatigue: number; 
  preReviewStability: number;
  preReviewDifficulty: number;
  calculatedRisk: number; 
}

export interface AdaptMetrics {
  difficulty: number;      
  stability: number;       
  complexity: number;      
  lastReview: number;      
  history: ReviewLog[];    
}

export interface AdaptFlashcard {
  id: string;
  deckId: string;
  type: FlashcardType;
  front: string;
  back: string;
  clozeIndex?: number; 
  
  // Image Occlusion Data
  occlusionData?: {
    imageUrl: string;
    rects: OcclusionRect[];
    targetRectId: string;
  };

  // Audio Data
  audioData?: {
    frontAudio?: string; // Base64
    backAudio?: string;  // Base64
  };
  
  stage: CognitiveStage;
  metrics: AdaptMetrics;
  
  createdAt: number;
  tags: string[];
  isSuspended?: boolean;

  interval?: number;
  repetitions?: number;
  easeFactor?: number;
  nextReview?: number; 
  status?: string; 
}

export interface DeckStats {
  totalCards: number;
  newCards: number;
  criticalCards: number; 
  stableCards: number;   
}

export interface Deck {
  id: string;
  parentId?: string; 
  title: string;
  description?: string;
  createdAt: number;
}

export interface HumanExplanation {
  message: string;      
  visualCue: 'critical' | 'warning' | 'safe' | 'new'; 
  nextPrediction?: string; 
}

export interface CardPresentation {
  card: AdaptFlashcard;
  explanation: HumanExplanation;
  priorityScore: number; 
}

export interface SessionSummary {
  cardsReviewed: number;
  retentionRate: number;
  sessionFatigue: number;
  fatigueMessage: string;
}

export interface DeckHealth {
  deckId: string;
  healthScore: number;
  statusMessage: string;
  distribution: { new: number; learning: number; review: number; suspended: number };
}

export function createNewFlashcard(deckId: string, front: string, back: string, type: FlashcardType = 'BASIC', clozeIndex?: number): AdaptFlashcard {
  const now = Date.now();
  return {
    id: 'card_' + Date.now().toString() + Math.random().toString(36).substr(2, 5),
    deckId,
    type,
    front,
    back,
    clozeIndex,
    stage: 'S1_ACQUISITION',
    metrics: {
      difficulty: 0.3,
      stability: 0,
      complexity: 1.0,
      lastReview: now,
      history: []
    },
    createdAt: now,
    tags: [],
    status: 'new',
    nextReview: now
  };
}
