
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  navigateToUrl: (url) => ipcRenderer.send('navigate-to-url', url),
  loadToolModule: (moduleName) => ipcRenderer.send('load-tool-module', moduleName),
  toggleFloatingTodo: () => ipcRenderer.send('toggle-floating-todo'),
  openPath: (path) => ipcRenderer.send('open-path', path),
  getWebviewPreloadPath: () => ipcRenderer.invoke('get-webview-preload-path'),
  
  // File Opener
  openFileDialog: () => ipcRenderer.send('open-file-dialog'),
  selectPDF: () => ipcRenderer.invoke('select-document'), 
  selectDocument: () => ipcRenderer.invoke('select-document'),
  readFileBuffer: (path) => ipcRenderer.invoke('read-file-buffer', path),
  
  // Flashcard Actions
  importAnki: () => ipcRenderer.invoke('flashcard-import-anki'),
  exportFlashcards: (data) => ipcRenderer.invoke('flashcard-export', data),
  importFlashcardsDialog: () => ipcRenderer.invoke('flashcard-import-dialog'),

  // Call to Print current page (triggers browser logic)
  savePage: () => ipcRenderer.send('save-page-request'), 

  // Window Management
  openNewWindow: (url) => ipcRenderer.send('open-new-window', url),

  // STORAGE API
  storage: {
    get: (key) => ipcRenderer.invoke('storage-get', key),
    set: (key, value) => ipcRenderer.send('storage-set', { key, value }),
  },

  // Search API
  search: (query, category, engine) => ipcRenderer.invoke('perform-search', { query, category, engine }),

  // EXTENSIONS API
  getInstalledExtensions: () => ipcRenderer.invoke('get-installed-extensions'),
  removeExtension: (id) => ipcRenderer.send('remove-extension', id),
  installExtensionFromFile: (path) => ipcRenderer.send('install-extension-from-file', path),
  toggleExtensionPin: (id) => ipcRenderer.send('toggle-extension-pin', id),
  openExtensionOptions: (id) => ipcRenderer.send('open-extension-options', id),
  
  onExtensionStatus: (callback) => {
    const handler = (_event, data) => callback(data);
    ipcRenderer.on('extension-status', handler);
    return () => ipcRenderer.removeListener('extension-status', handler);
  },
  openExtensionPopup: (id, popupUrl, rect) => {
    ipcRenderer.send('open-extension-popup', { id, popupUrl, x: rect.x, y: rect.y });
  },

  // WINDOW CONTROLS
  minimize: () => ipcRenderer.send('window-minimize'),
  maximize: () => ipcRenderer.send('window-maximize'),
  close: () => ipcRenderer.send('window-close'),
  onWindowStateChanged: (callback) => {
    const handler = (_event, state) => callback(state);
    ipcRenderer.on('window-state-changed', handler);
    return () => ipcRenderer.removeListener('window-state-changed', handler);
  },

  onNewTabRequest: (callback) => {
    const handler = (_event, url) => callback(url);
    ipcRenderer.on('create-tab-request', handler);
    return () => ipcRenderer.removeListener('create-tab-request', handler);
  },
  onToggleTodo: (callback) => {
    const handler = (_event) => callback();
    ipcRenderer.on('toggle-todo', handler);
    return () => ipcRenderer.removeListener('toggle-todo', handler);
  },
  onDownloadStarted: (callback) => {
    const handler = (_event, item) => callback(item);
    ipcRenderer.on('download-started', handler);
    return () => ipcRenderer.removeListener('download-started', handler);
  },
  onDownloadUpdated: (callback) => {
    const handler = (_event, item) => callback(item);
    ipcRenderer.on('download-updated', handler);
    return () => ipcRenderer.removeListener('download-updated', handler);
  },
  onDownloadComplete: (callback) => {
    const handler = (_event, item) => callback(item);
    ipcRenderer.on('download-complete', handler);
    return () => ipcRenderer.removeListener('download-complete', handler);
  },
  
  // PERMISSIONS
  onPermissionRequest: (callback) => {
    const handler = (_event, req) => callback(req);
    ipcRenderer.on('permission-request', handler);
    return () => ipcRenderer.removeListener('permission-request', handler);
  },
  respondToPermission: (id, allow) => ipcRenderer.send('permission-response', { id, allow }),

  // STORAGE SYNC
  onStorageUpdated: (callback) => {
      const handler = (_event, { key, value }) => callback(key, value);
      ipcRenderer.on('storage-updated', handler);
      return () => ipcRenderer.removeListener('storage-updated', handler);
  },

  // --- UPDATER API ---
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  checkForUpdates: () => ipcRenderer.send('check-for-updates'),
  restartAndInstall: () => ipcRenderer.send('restart-app'),
  onUpdateAvailable: (callback) => {
      const handler = (_event, info) => callback(info);
      ipcRenderer.on('update-available', handler);
      return () => ipcRenderer.removeListener('update-available', handler);
  },
  onUpdateProgress: (callback) => {
      const handler = (_event, progress) => callback(progress);
      ipcRenderer.on('update-progress', handler);
      return () => ipcRenderer.removeListener('update-progress', handler);
  },
  onUpdateDownloaded: (callback) => {
      const handler = (_event, info) => callback(info);
      ipcRenderer.on('update-downloaded', handler);
      return () => ipcRenderer.removeListener('update-downloaded', handler);
  }
});
