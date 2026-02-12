
import { ReactNode } from 'react';
import type { AdaptFlashcard } from './core/flashcards/types';

export enum ViewState {
  NEW_TAB = 'NEW_TAB',
  BROWSER = 'BROWSER',
  SEARCH = 'SEARCH',
  TOOL_PLACEHOLDER = 'TOOL_PLACEHOLDER',
  LIBRARY = 'LIBRARY',
  TASKS = 'TASKS',
  SCHEDULE = 'SCHEDULE',
  SETTINGS = 'SETTINGS',
  NOTES = 'NOTES',
  FLASHCARDS = 'FLASHCARDS',
  MINDMAP = 'MINDMAP',
  DOCUMENTS = 'DOCUMENTS'
}

// --- CONTEXT MENU TYPES ---
export type ContextMenuItem = 
  | { type: 'separator' }
  | { 
      label: string;
      icon?: string;
      shortcut?: string;
      onClick?: () => void;
      disabled?: boolean;
      variant?: 'default' | 'danger' | 'warning';
      type?: 'item' | 'submenu';
      submenu?: ContextMenuItem[];
    };

export interface ContextMenuState {
  isOpen: boolean;
  x: number;
  y: number;
  items: ContextMenuItem[];
}

export type TaskType = 'SIMPLE' | 'TIMED';

export interface Task {
  id: string;
  title: string;
  completed: boolean;
  type: TaskType;
  duration?: number;
  remainingTime?: number;
  isTimerRunning?: boolean;
  routineId?: string;
  createdAt: number;
}

export type RoutineScope = 'WEEKLY' | 'MONTHLY';

export interface Routine {
  id: string;
  title: string;
  // Para rotinas semanais (ex: Toda segunda)
  days: number[]; 
  // Para eventos únicos (ex: 25/10/2023) - Sobrescreve 'days' se existir
  specificDate?: string; 
  time: string;
  duration?: number;
  color: string;
  scope: RoutineScope;
  month?: number;
  year?: number;
}

export interface QuickAccessLink {
  id: string;
  label: string;
  iconName: string;
  url?: string;
  internalRoute?: ViewState;
}

export interface StudyTool {
  id: string;
  title: string;
  description: string;
  iconName: string;
  color: string;
}

export interface HistoryEntry {
  url: string;
  title: string;
  timestamp: number;
  id?: string;
  type?: 'link' | 'search' | 'image';
}

export interface BookmarkItem {
  id: string;
  url: string;
  title: string;
  createdAt: number;
  folder?: string;
}

export interface DownloadItem {
  id: string;
  filename: string;
  path: string;
  totalBytes: number;
  receivedBytes: number;
  state: 'progressing' | 'completed' | 'cancelled' | 'interrupted' | 'paused';
  startTime: number;
}

export interface Tab {
  id: string;
  title: string;
  url: string;
  isActive: boolean;
  viewState: ViewState;
  scrollPosition?: number;
  searchQuery?: string;
}

export interface ClosedTab {
  id: string;
  title: string;
  url: string;
  viewState: ViewState;
  closedAt: number;
}

export type HistoryInterval = 'NEVER' | '1_HOUR' | '1_DAY' | '1_WEEK' | '1_MONTH' | '3_MONTHS' | '6_MONTHS' | '1_YEAR' | '2_YEARS';

export interface UserSettings {
  theme: 'default' | 'ocean' | 'midnight' | 'sunset' | 'forest';
  searchEngine: 'google' | 'duckduckgo' | 'bing' | 'yahoo';
  historyClearInterval: HistoryInterval;
  
  // Customização Visual
  fontFamily: 'Inter' | 'Roboto' | 'Lato' | 'Montserrat' | 'Open Sans' | 'Playfair Display' | 'Fira Code';
  textSize: 'small' | 'medium' | 'large' | 'xlarge'; // Escala para acessibilidade
  
  // Animações
  animations: {
    enabled: boolean;
    speed: 'slow' | 'normal' | 'fast'; // slow=1.5x duration, fast=0.5x duration
  };

  // Cursor
  cursorGlow: {
    enabled: boolean;
    color: string;
    size: number; // px
    opacity: number; // 0-1
  };
}

export type SearchCategory = 'ALL' | 'IMAGES' | 'VIDEOS' | 'NEWS' | 'BOOKS' | 'FINANCE';

export interface SearchResultItem {
  title: string;
  link: string;
  snippet: string;
  displayLink: string;
  thumbnail?: string;
}

export interface SearchResponse {
  items: SearchResultItem[];
  meta: {
    totalResults: string;
    searchTime: string;
  };
}

// --- NOTAS ---
export type BlockType = 'text' | 'h1' | 'h2' | 'h3' | 'bullet-list' | 'number-list' | 'todo-list' | 'image' | 'code' | 'table' | 'toggle' | 'callout' | 'divider' | 'quote' | 'container'; 

export interface EditorBlockData {
  id: string;
  type: BlockType;
  content: string; 
  level?: number; 
  properties?: {
    checked?: boolean; 
    language?: string; 
    url?: string; 
    caption?: string; 
    width?: string; 
    isOpen?: boolean; 
    icon?: string; 
    color?: string; 
    rows?: string[][]; 
  };
}

export interface BlockPosition { x: number; y: number; width: number; height: number; }
export interface BlockContent { text?: string; blocks?: EditorBlockData[]; coverImage?: string; icon?: string; tags?: string[]; url?: string; }
export interface NoteBlock { id: string; type: 'container' | 'text' | 'image' | 'code' | string; title: string; content: BlockContent; position: BlockPosition; color?: string; parentId?: string; folderId?: string; isFavorite?: boolean; isTrash?: boolean; tags?: string[]; createdAt: number; updatedAt: number; }
export interface BlockConnection { id: string; fromBlockId: string; toBlockId: string; label?: string; }
export interface CanvasCamera { x: number; y: number; zoom: number; }

// --- VISION BOARD ---
export type VisionBlockType = 'text' | 'image' | 'video' | 'mixed';
export interface VisionBlock {
  id: string;
  type: VisionBlockType;
  x: number; // Porcentagem do canvas
  y: number; // Porcentagem do canvas
  z: number;
  width: number;
  height: number;
  rotation: number;
  content: {
    text?: string;
    url?: string;
    style?: {
      fontFamily?: 'sans' | 'serif' | 'cursive' | 'mono';
      fontSize?: number;
      color?: string;
      backgroundColor?: string;
      bold?: boolean;
      italic?: boolean;
      underline?: boolean;
      strikethrough?: boolean;
      subscript?: boolean;
      hasBorder?: boolean; // Novo: Borda opcional
      borderColor?: string; // Novo: Cor da borda
    }
  };
}

// --- FLASHCARDS ---
export type { CognitiveStage, Deck, DeckStats, CardPresentation, UserGrade, FlashcardType, OcclusionRect, AdaptFlashcard } from './core/flashcards/types';
export { createNewFlashcard } from './core/flashcards/types';

export interface Flashcard extends AdaptFlashcard {
  flag?: 'red' | 'orange' | 'green' | 'blue' | 'pink' | 'turquoise' | 'purple' | null;
}

// --- MEMORY SETTINGS ---
export interface MemorySettings {
  algorithm: {
    isAdaptiveDefault: boolean; // Modo automático
    retentionTarget: number; 
    newCardsLimit: number;
    reviewsLimit: number;
    lapseReset: boolean;
  };
  ui: {
    fontFamily: 'sans' | 'serif' | 'mono';
    fontSize: number;
    theme: 'midnight' | 'paper' | 'foco' | 'dark';
    alignment: 'center' | 'left';
    leftyMode: boolean;
  };
  session: {
    showTimer: boolean;
    autoPlayAudio: boolean;
    studyOrder: 'MIXED' | 'NEW_FIRST' | 'REVIEWS_FIRST';
    showIntervals: boolean;
  };
  gamification: {
    dailyGoal: number;
    showStreak: boolean;
    notifications: boolean;
  };
}

// --- MIND MAP ---
export interface MindMapReference {
  type: 'FLASHCARD' | 'NOTE' | 'DOCUMENT';
  id: string;
  label?: string; // Título do recurso vinculado (ex: nome da nota)
}

export interface MindMapNodeStyle {
  fontSize?: number; // 12, 14, 18, 24
  fontWeight?: 'normal' | 'bold';
  fontStyle?: 'normal' | 'italic';
  textColor?: string;
  backgroundColor?: string;
}

export interface MindMapNode {
  id: string;
  text: string;
  parentId: string | null;
  childrenIds: string[];
  isCollapsed: boolean;
  color?: string; // Cor da Borda/Conexão
  references?: MindMapReference[];
  
  // Style & Content Extensions
  style?: MindMapNodeStyle;
  image?: string; // Base64 or URL
  
  // Manual Positioning Override (relative to auto-layout position)
  offset?: { x: number, y: number };

  // Calculated Layout Properties (Runtime only)
  x?: number;
  y?: number;
  width?: number;
  height?: number;
}

export interface MindMap {
  id: string;
  title: string;
  rootId: string;
  nodes: Record<string, MindMapNode>; // Normalized structure for O(1) access
  createdAt: number;
  updatedAt: number;
}

// --- DOCUMENTS ---
export interface DocumentFile {
  id: string;
  path: string;
  title: string;
  lastOpened: number;
  currentPage: number;
  totalPages?: number;
  zoom?: number;
  isFavorite?: boolean;
  tags?: string[];
}
