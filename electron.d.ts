
import { DownloadItem } from './types';

export interface ExtensionItem {
  id: string;
  title: string;
  version?: string;
  description?: string;
  installDate: number;
  path: string;
  icon?: string;
  popup?: string;
  optionsUrl?: string;
  pinned?: boolean;
}

export interface ExtensionStatus {
  id: string;
  status: 'downloading' | 'installing' | 'completed' | 'error' | 'removed';
  message: string;
}

export interface PermissionRequest {
  id: string;
  permission: string;
  url: string;
}

export interface ElectronAPI {
  navigateToUrl: (url: string) => void;
  loadToolModule: (moduleName: string) => void;
  toggleFloatingTodo: () => void;
  openPath: (path: string) => void;
  getWebviewPreloadPath: () => Promise<string>;
  openFileDialog: () => void;

  checkForUpdates: () => Promise<any>;
  installUpdate: () => void;

  onUpdateAvailable: (callback: (info: any) => void) => () => void;
  onUpdateNotAvailable: (callback: (info: any) => void) => () => void;
  onUpdateProgress: (callback: (progress: any) => void) => () => void;
  onUpdateDownloaded: (callback: (info: any) => void) => () => void;
  onUpdateError: (callback: (message: string) => void) => () => void;

  // Documentos
  selectPDF: () => Promise<{ path: string; name: string } | null>;
  selectDocument: () => Promise<{ path: string; name: string } | null>; // Adicionado
  readFileBuffer: (path: string) => Promise<Uint8Array | null>; // Adicionado

  savePage: () => void;

  // Flashcard Actions
  importAnki: () => Promise<any>;
  exportFlashcards: (data: { content: string, format: string, defaultName: string }) => Promise<{ success: boolean; reason?: string; message?: string }>;
  importFlashcardsDialog: () => Promise<any>;

  // Window Management
  openNewWindow: (url?: string) => void;

  // Storage API
  storage: {
    get: <T>(key: string) => Promise<T | null>;
    set: <T>(key: string, value: T) => void;
  };

  // Search API
  search: (query: string, category: string, engine?: string) => Promise<string>;

  // Extensions
  getInstalledExtensions: () => Promise<ExtensionItem[]>;
  removeExtension: (id: string) => void;
  installExtensionFromFile: (path: string) => void;
  toggleExtensionPin: (id: string) => void;
  openExtensionOptions: (id: string) => void;

  onExtensionStatus: (callback: (status: ExtensionStatus) => void) => () => void;
  openExtensionPopup: (id: string, popupUrl: string, rect: { x: number, y: number }) => void;

  // Window Controls
  minimize: () => void;
  maximize: () => void;
  close: () => void;
  onWindowStateChanged: (callback: (state: 'maximized' | 'normal') => void) => () => void;

  onNewTabRequest: (callback: (url: string) => void) => () => void;
  onToggleTodo: (callback: () => void) => () => void;

  // Downloads
  onDownloadStarted: (callback: (item: DownloadItem) => void) => () => void;
  onDownloadUpdated: (callback: (item: Partial<DownloadItem>) => void) => () => void;
  onDownloadComplete: (callback: (item: Partial<DownloadItem>) => void) => () => void;

  // Permissions
  onPermissionRequest: (callback: (req: PermissionRequest) => void) => () => void;
  respondToPermission: (id: string, allow: boolean) => void;

  // Storage Sync
  onStorageUpdated: (callback: (key: string, value: any) => void) => () => void;
}

declare global {
  interface Window {
    api: ElectronAPI;
  }
}
