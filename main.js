
import { app, BrowserWindow, ipcMain, Menu, session, dialog, protocol } from 'electron';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { createRequire } from 'node:module'; // Importação crítica para compatibilidade

// Cria um "require" compatível com CJS dentro deste módulo ESM
const require = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// --- SISTEMA DE LOGS DE EMERGÊNCIA ---
// Salva um arquivo 'app-debug.log' na pasta de dados do usuário (ex: %APPDATA%/Study Hub/app-debug.log)
const logPath = path.join(app.getPath('userData'), 'app-debug.log');

function log(message) {
    try {
        const timestamp = new Date().toISOString();
        const logMessage = `[${timestamp}] ${message}\n`;
        fs.appendFileSync(logPath, logMessage);
        // Também mostra no terminal se estiver em dev
        if (process.env.NODE_ENV === 'development') console.log(logMessage.trim());
    } catch (e) {
        // Falha silenciosa no logger para não crashar o app
    }
}

// Limpa log antigo ao iniciar
try { fs.writeFileSync(logPath, `--- INÍCIO DO LOG (v${app.getVersion()}) ---\n`); } catch(e){}

log("Iniciando Main Process...");

// --- TRATAMENTO DE ERROS CRÍTICOS ---
process.on('uncaughtException', (error) => {
    log(`CRITICAL ERROR (Uncaught): ${error.stack || error}`);
    dialog.showErrorBox('Erro Crítico', `Ocorreu um erro inesperado:\n${error.message}\n\nVerifique o log em: ${logPath}`);
});

process.on('unhandledRejection', (reason) => {
    log(`CRITICAL ERROR (Promise Rejection): ${reason}`);
});

// --- IMPORTAÇÕES CJS SEGURAS ---
let autoUpdater;
let AdmZip;

try {
    log("Carregando dependências CJS...");
    AdmZip = require('adm-zip');
    // electron-updater deve ser carregado via require para evitar erros de 'default export' no build
    const updaterModule = require('electron-updater');
    autoUpdater = updaterModule.autoUpdater;
    log("Dependências carregadas com sucesso.");
} catch (e) {
    log(`ERRO AO IMPORTAR DEPENDÊNCIAS: ${e.message}`);
}

// --- CONFIGURAÇÃO SILENCIOSA ---
process.env.ELECTRON_DISABLE_SECURITY_WARNINGS = 'true';

const originalEmitWarning = process.emitWarning;
process.emitWarning = (warning, ...args) => {
    if (typeof warning === 'string' && (
        warning.includes('ExtensionLoadWarning') || 
        warning.includes('Manifest version 2') ||
        warning.includes('Permission')
    )) {
        return;
    }
    return originalEmitWarning.call(process, warning, ...args);
};

app.commandLine.appendSwitch('ignore-certificate-errors');
app.commandLine.appendSwitch('allow-insecure-localhost');
app.commandLine.appendSwitch('disable-site-isolation-trials');
app.commandLine.appendSwitch('enable-experimental-web-platform-features');

const GLOBAL_USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36';

let mainWindow;
let extensionPopupWindow = null;

// --- AUTO UPDATER ---
if (autoUpdater) {
    try {
        autoUpdater.autoDownload = true;
        autoUpdater.autoInstallOnAppQuit = true;
        
        autoUpdater.on('error', (err) => log(`Updater Error: ${err.message}`));
        autoUpdater.on('checking-for-update', () => log('Verificando atualizações...'));
        autoUpdater.on('update-available', () => {
            log('Atualização disponível.');
            if (mainWindow) mainWindow.webContents.send('update-available');
        });
        autoUpdater.on('update-not-available', () => log('Nenhuma atualização disponível.'));
        autoUpdater.on('update-downloaded', (info) => {
            log(`Atualização baixada: ${info.version}`);
            if (mainWindow) mainWindow.webContents.send('update-downloaded', info);
        });
    } catch (e) {
        log(`Erro configuração updater: ${e.message}`);
    }
}

// --- STORAGE ---
const storagePath = path.join(app.getPath('userData'), 'storage');
if (!fs.existsSync(storagePath)) {
    fs.mkdirSync(storagePath, { recursive: true });
}

const atomicWriteAsync = async (filePath, content) => {
    const tempPath = `${filePath}.tmp`;
    try {
        await fs.promises.writeFile(tempPath, content, 'utf-8');
        await fs.promises.rename(tempPath, filePath);
    } catch (e) {
        log(`Erro ao salvar arquivo ${filePath}: ${e.message}`);
    }
};

// --- HANDLERS (IPCs) ---

// File Dialogs
ipcMain.handle('select-document', async () => {
    try {
        const { filePaths, canceled } = await dialog.showOpenDialog(mainWindow, {
            title: 'Selecionar Documento',
            filters: [
                { name: 'Documentos', extensions: ['pdf', 'docx', 'doc', 'txt', 'md', 'jpg', 'png'] },
                { name: 'Todos', extensions: ['*'] }
            ],
            properties: ['openFile']
        });

        if (canceled || !filePaths || filePaths.length === 0) return null;
        
        return {
            path: filePaths[0],
            name: path.basename(filePaths[0])
        };
    } catch (error) {
        log(`Erro select-document: ${error.message}`);
        return null;
    }
});

ipcMain.handle('read-file-buffer', async (event, filePath) => {
    try {
        return await fs.promises.readFile(filePath);
    } catch (error) {
        log(`Erro read-file-buffer: ${error.message}`);
        return null;
    }
});

ipcMain.handle('flashcard-export', async (event, { content, format, defaultName }) => {
    try {
        const { filePath, canceled } = await dialog.showSaveDialog(mainWindow, {
            title: 'Exportar Flashcards',
            defaultPath: defaultName || `studyhub_export.${format}`,
            filters: [{ name: 'Arquivo Texto', extensions: ['txt'] }]
        });

        if (canceled || !filePath) return { success: false, reason: 'canceled' };

        fs.writeFileSync(filePath, content, 'utf8');
        return { success: true };
    } catch (error) {
        return { success: false, message: error.message };
    }
});

ipcMain.handle('flashcard-import-dialog', async () => {
    try {
        const { filePaths, canceled } = await dialog.showOpenDialog(mainWindow, {
            title: 'Importar Flashcards',
            filters: [{ name: 'Arquivos Suportados', extensions: ['json', 'txt'] }],
            properties: ['openFile']
        });

        if (canceled || !filePaths || filePaths.length === 0) return null;

        const content = fs.readFileSync(filePaths[0], 'utf-8');
        return { 
            type: path.extname(filePaths[0]).replace('.', ''), 
            content, 
            fileName: path.basename(filePaths[0]) 
        };
    } catch (error) {
        return { error: error.message };
    }
});

// --- PERMISSIONS & PROTOCOLS ---
protocol.registerSchemesAsPrivileged([
  { scheme: 'studyhub-ext', privileges: { standard: true, secure: true, supportFetchAPI: true, corsEnabled: true } }
]);

// --- EXTENSIONS LOGIC ---
const extensionsPath = path.join(app.getPath('userData'), 'extensions');
const extensionsManifestPath = path.join(app.getPath('userData'), 'extensions.json');

if (!fs.existsSync(extensionsPath)) {
    fs.mkdirSync(extensionsPath, { recursive: true });
}

const getSavedExtensions = () => {
    if (!fs.existsSync(extensionsManifestPath)) return [];
    try {
        return JSON.parse(fs.readFileSync(extensionsManifestPath, 'utf-8'));
    } catch {
        return [];
    }
};

const saveExtensionToList = (extData) => {
    const list = getSavedExtensions();
    const index = list.findIndex(e => e.id === extData.id);
    if (index >= 0) {
        list[index] = { ...list[index], ...extData };
    } else {
        list.push({ pinned: false, ...extData });
    }
    fs.writeFileSync(extensionsManifestPath, JSON.stringify(list, null, 2));
    if (mainWindow) mainWindow.webContents.send('extension-status', { id: extData.id, status: 'completed', message: 'Ativo' });
};

const removeExtensionFromList = (id) => {
    const list = getSavedExtensions().filter(e => e.id !== id);
    fs.writeFileSync(extensionsManifestPath, JSON.stringify(list, null, 2));
};

const findExtensionRoot = (dir) => {
    if (fs.existsSync(path.join(dir, 'manifest.json'))) return dir;
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
        if (entry.isDirectory() && !entry.name.startsWith('_') && !entry.name.startsWith('.')) {
            const found = findExtensionRoot(path.join(dir, entry.name));
            if (found) return found;
        }
    }
    return null;
};

const installExtensionFromBuffer = async (bufferOrPath, isFile, cwsId = null, win) => {
    try {
        if (!AdmZip) throw new Error("AdmZip não carregado");

        let zipBuffer = isFile ? fs.readFileSync(bufferOrPath) : bufferOrPath;
        const tempId = `temp_${Date.now()}`;
        const tempDir = path.join(extensionsPath, tempId);
        fs.mkdirSync(tempDir, { recursive: true });
        
        const zip = new AdmZip(zipBuffer);
        zip.extractAllTo(tempDir, true);
        
        const rootDir = findExtensionRoot(tempDir);
        if (!rootDir) throw new Error("manifest.json não encontrado.");
        
        // Limpar metadados do Chrome
        const metadataPath = path.join(rootDir, '_metadata');
        if (fs.existsSync(metadataPath)) fs.rmSync(metadataPath, { recursive: true, force: true });
        
        let folderId = cwsId || `local_${Date.now()}`;
        const finalDir = path.join(extensionsPath, folderId);
        if (fs.existsSync(finalDir)) fs.rmSync(finalDir, { recursive: true, force: true });
        
        fs.cpSync(rootDir, finalDir, { recursive: true });
        fs.rmSync(tempDir, { recursive: true, force: true });
        
        const manifest = JSON.parse(fs.readFileSync(path.join(finalDir, 'manifest.json'), 'utf-8'));
        const loadedExtension = await session.defaultSession.extensions.loadExtension(finalDir, { allowFileAccess: true });
        
        saveExtensionToList({
            id: loadedExtension.id,
            cwsId: cwsId,
            title: manifest.name,
            version: manifest.version,
            description: manifest.description,
            installDate: Date.now(),
            path: finalDir
        });
        
        if (win) win.webContents.send('extension-status', { id: loadedExtension.id, status: 'completed', message: 'Instalado!' });
    } catch (error) {
        log(`Install Extension Error: ${error.message}`);
        if (win) win.webContents.send('extension-status', { id: cwsId || 'unknown', status: 'error', message: 'Falha.' });
    }
};

const loadPersistedExtensions = async () => {
    const list = getSavedExtensions();
    for (const ext of list) {
        if (fs.existsSync(ext.path)) {
            try {
                await session.defaultSession.extensions.loadExtension(ext.path, { allowFileAccess: true });
            } catch (e) {
                log(`Falha carregar extensão ${ext.title}: ${e.message}`);
            }
        }
    }
};

// --- WINDOW CREATION ---

function createWindow() {
    log("Criando janela principal...");
    const win = new BrowserWindow({
      width: 1280, height: 800, frame: false, titleBarStyle: 'hidden', show: false,
      backgroundColor: '#0a0e27',
      webPreferences: {
        preload: path.join(__dirname, 'preload.js'),
        webviewTag: true,
        nodeIntegration: false,
        contextIsolation: true,
        spellcheck: true,
        webSecurity: false,
      },
    });
    
    if (!mainWindow) mainWindow = win;
    Menu.setApplicationMenu(null); 
  
    win.once('ready-to-show', () => {
        win.show();
        log("Janela principal exibida.");
        
        if (app.isPackaged && autoUpdater) {
            log("Verificando updates (packaged mode)...");
            autoUpdater.checkForUpdatesAndNotify().catch(err => log(`Erro check update: ${err.message}`));
        }
    });
    
    win.webContents.session.setPermissionRequestHandler((webContents, permission, callback) => {
        const url = webContents.getURL();
        if (url.startsWith('file://')) return callback(true);
        callback(true);
    });
    
    const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;
    
    if (isDev) {
        log("Carregando URL de desenvolvimento (localhost:5173)");
        win.loadURL('http://localhost:5173').catch((e) => {
            log(`Erro ao carregar dev URL: ${e.message}`);
            setTimeout(() => win.loadURL('http://localhost:5173'), 3000);
        });
    } else {
        const prodPath = path.join(__dirname, 'dist-vite', 'index.html');
        log(`Carregando arquivo de produção: ${prodPath}`);
        win.loadFile(prodPath).catch((e) => {
            log(`ERRO FATAL ao carregar index.html: ${e.message}`);
        });
    }
}

// --- IPC HANDLERS GERAIS ---

ipcMain.on('check-for-updates', () => {
    if (app.isPackaged && autoUpdater) autoUpdater.checkForUpdatesAndNotify();
});

ipcMain.on('restart-app', () => {
    if (autoUpdater) autoUpdater.quitAndInstall();
});

ipcMain.handle('get-app-version', () => app.getVersion());

ipcMain.on('window-minimize', (e) => BrowserWindow.fromWebContents(e.sender)?.minimize());
ipcMain.on('window-maximize', (e) => {
    const win = BrowserWindow.fromWebContents(e.sender);
    if (win) win.isMaximized() ? win.unmaximize() : win.maximize();
});
ipcMain.on('window-close', (e) => BrowserWindow.fromWebContents(e.sender)?.close());

ipcMain.handle('storage-get', async (event, key) => {
      const filePath = path.join(storagePath, `${key}.json`);
      if (fs.existsSync(filePath)) {
          try {
              return JSON.parse(await fs.promises.readFile(filePath, 'utf-8'));
          } catch { return null; }
      }
      return null;
});

ipcMain.on('storage-set', async (event, { key, value }) => {
      const filePath = path.join(storagePath, `${key}.json`);
      await atomicWriteAsync(filePath, JSON.stringify(value, null, 2));
      BrowserWindow.getAllWindows().forEach(win => {
          if (win.webContents !== event.sender) win.webContents.send('storage-updated', { key, value });
      });
});

ipcMain.handle('perform-search', async (event, { query, engine }) => {
    try {
        const url = `https://www.google.com/search?q=${encodeURIComponent(query)}&hl=pt-BR`;
        const response = await fetch(url, { headers: { 'User-Agent': GLOBAL_USER_AGENT } });
        return await response.text();
    } catch { return ""; }
});

ipcMain.on('install-cws-extension', async (event, data) => {
      try {
          const crxUrl = `https://clients2.google.com/service/update2/crx?response=redirect&prodversion=132.0.0.0&acceptformat=crx2,crx3&x=id%3D${data.id}%26uc`;
          const response = await fetch(crxUrl);
          if (!response.ok) throw new Error("Falha ao baixar extensão");
          const buffer = Buffer.from(await response.arrayBuffer());
          await installExtensionFromBuffer(buffer, false, data.id, mainWindow);
      } catch (e) {
          log(`Erro download extensão CWS: ${e.message}`);
          if (mainWindow) mainWindow.webContents.send('extension-status', { id: data.id, status: 'error', message: 'Erro download' });
      }
});

ipcMain.handle('get-installed-extensions', () => getSavedExtensions());

ipcMain.on('remove-extension', (event, id) => {
    const list = getSavedExtensions();
    const ext = list.find(e => e.id === id);
    if (ext) {
        try {
            session.defaultSession.removeExtension(id);
            if (fs.existsSync(ext.path)) fs.rmSync(ext.path, { recursive: true, force: true });
            removeExtensionFromList(id);
            if (mainWindow) mainWindow.webContents.send('extension-status', { id, status: 'removed', message: 'Removido' });
        } catch (e) { log(`Erro remover extensão: ${e.message}`); }
    }
});

ipcMain.on('install-extension-from-file', async (event, pathStr) => {
    try {
        if (pathStr === '__UNPACKED__') {
             const { filePaths } = await dialog.showOpenDialog(mainWindow, { properties: ['openDirectory'] });
             if (filePaths && filePaths.length > 0) {
                 await session.defaultSession.extensions.loadExtension(filePaths[0], { allowFileAccess: true });
                 if(mainWindow) mainWindow.webContents.send('extension-status', { id: 'local', status: 'completed', message: 'Carregado (Dev)' });
             }
        } else {
             const buffer = fs.readFileSync(pathStr);
             await installExtensionFromBuffer(buffer, true, null, mainWindow);
        }
    } catch(e) {
        log(`Erro install from file: ${e.message}`);
    }
});

ipcMain.on('toggle-extension-pin', (event, id) => {
    const list = getSavedExtensions();
    const idx = list.findIndex(e => e.id === id);
    if (idx >= 0) {
        list[idx].pinned = !list[idx].pinned;
        fs.writeFileSync(extensionsManifestPath, JSON.stringify(list, null, 2));
        if (mainWindow) mainWindow.webContents.send('extension-status', { id, status: 'completed', message: 'Atualizado' });
    }
});

ipcMain.on('open-extension-popup', (event, { id, popupUrl, x, y }) => {
    if (extensionPopupWindow && !extensionPopupWindow.isDestroyed()) {
        extensionPopupWindow.close();
        extensionPopupWindow = null;
        return;
    }
    const url = `chrome-extension://${id}/${popupUrl}`;
    
    extensionPopupWindow = new BrowserWindow({
        width: 350, height: 500, x: Math.round(x - 320), y: Math.round(y),
        frame: false, show: false, parent: mainWindow, skipTaskbar: true,
        webPreferences: { nodeIntegration: false, contextIsolation: true, webSecurity: false }
    });
    
    extensionPopupWindow.loadURL(url).catch(err => log(`Erro popup ext: ${err.message}`));
    
    extensionPopupWindow.once('ready-to-show', () => extensionPopupWindow.show());
    extensionPopupWindow.on('blur', () => {
        if (extensionPopupWindow && !extensionPopupWindow.isDestroyed()) extensionPopupWindow.close();
    });
});

ipcMain.on('open-path', (event, p) => {
    require('electron').shell.openPath(p);
});

ipcMain.on('open-new-window', (event, url) => {
    const win = new BrowserWindow({ width: 1000, height: 700 });
    win.setMenu(null);
    win.loadURL(url || 'about:blank');
});

ipcMain.on('save-page-request', async (event) => {
    if (mainWindow) {
        mainWindow.webContents.send('trigger-save-page');
    }
});

// --- APP STARTUP ---

app.whenReady().then(() => {
    log("App Ready.");
    session.defaultSession.setUserAgent(GLOBAL_USER_AGENT);
    loadPersistedExtensions();
    createWindow();
});

app.on('window-all-closed', () => {
    log("Todas janelas fechadas. Encerrando.");
    if (process.platform !== 'darwin') app.quit();
});
