
import { app, BrowserWindow, ipcMain, Menu, MenuItem, shell, clipboard, session, dialog, protocol } from 'electron';
import pkg from 'electron-updater';
const { autoUpdater } = pkg;
import log from 'electron-log';
import path from 'path';
import fs from 'fs';
import { fileURLToPath, pathToFileURL } from 'url';
import AdmZip from 'adm-zip';

// Necessário para ES Modules no Electron
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// --- SILENCE NOTICES & WARNINGS ---
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
app.commandLine.appendSwitch('disable-features', 'OutOfBlinkCors,ExtensionManifestV2DeprecationWarning');
app.commandLine.appendSwitch('enable-experimental-web-platform-features');

// --- ERROR HANDLING ---
process.on('uncaughtException', (error) => {
    log.error('!!! CRASH (uncaughtException):', error);
});

process.on('unhandledRejection', (reason, promise) => {
    log.error('!!! CRASH (unhandledRejection):', reason);
});

const GLOBAL_USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36';

let mainWindow;
let extensionPopupWindow = null;
const permissionCallbacks = new Map();

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
        console.error(`Erro ao salvar arquivo ${filePath}:`, e);
    }
};

// --- FILE SELECTORS & READERS ---

ipcMain.handle('select-document', async () => {
    try {
        const { filePaths, canceled } = await dialog.showOpenDialog(mainWindow, {
            title: 'Selecionar Documento',
            filters: [
                { name: 'Documentos Suportados', extensions: ['pdf', 'docx', 'doc', 'txt', 'md', 'jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'] },
                { name: 'PDF', extensions: ['pdf'] },
                { name: 'Word', extensions: ['docx', 'doc'] },
                { name: 'Texto & Markdown', extensions: ['txt', 'md'] },
                { name: 'Imagens', extensions: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'] },
                { name: 'Todos os Arquivos', extensions: ['*'] }
            ],
            properties: ['openFile']
        });

        if (canceled || !filePaths || filePaths.length === 0) return null;

        return {
            path: filePaths[0],
            name: path.basename(filePaths[0])
        };
    } catch (error) {
        console.error("Erro ao selecionar documento:", error);
        return null;
    }
});

ipcMain.handle('read-file-buffer', async (event, filePath) => {
    try {
        const buffer = await fs.promises.readFile(filePath);
        return buffer;
    } catch (error) {
        console.error("Erro ao ler arquivo:", error);
        return null;
    }
});

// --- FLASHCARD PORTABILITY HANDLERS ---

ipcMain.handle('flashcard-export', async (event, { content, format, defaultName }) => {
    try {
        const filters = format === 'json' ?
            [{ name: 'Backup Study Hub (JSON)', extensions: ['json'] }] :
            [{ name: 'Lista de Estudo (TXT)', extensions: ['txt'] }];

        const { filePath, canceled } = await dialog.showSaveDialog(mainWindow, {
            title: 'Exportar Coleção de Flashcards',
            defaultPath: defaultName || `studyhub_export.${format}`,
            filters
        });

        if (canceled || !filePath) return { success: false, reason: 'canceled' };

        fs.writeFileSync(filePath, content, 'utf8');
        return { success: true };
    } catch (error) {
        console.error("Erro na Exportação Física:", error);
        return { success: false, reason: 'error', message: error.message };
    }
});

ipcMain.handle('flashcard-import-dialog', async (event) => {
    try {
        const { filePaths, canceled } = await dialog.showOpenDialog(mainWindow, {
            title: 'Selecionar Arquivo de Flashcards',
            filters: [
                { name: 'Formatos Suportados', extensions: ['json', 'txt'] },
                { name: 'Backup Study Hub', extensions: ['json'] },
                { name: 'Texto Simples', extensions: ['txt'] }
            ],
            properties: ['openFile']
        });

        if (canceled || !filePaths || filePaths.length === 0) return null;

        const filePath = filePaths[0];
        const ext = path.extname(filePath).toLowerCase();
        const content = fs.readFileSync(filePath, 'utf-8');

        return {
            type: ext.replace('.', ''),
            content,
            fileName: path.basename(filePath)
        };
    } catch (error) {
        console.error("Erro na Leitura do Arquivo:", error);
        return { error: error.message };
    }
});

// --- PERMISSIONS ---
const permissionsPath = path.join(storagePath, 'permissions.json');
const getSavedPermissions = () => {
    if (!fs.existsSync(permissionsPath)) return {};
    try {
        return JSON.parse(fs.readFileSync(permissionsPath, 'utf-8'));
    } catch {
        return {};
    }
};

const savePermissionDecision = (url, permission, allowed) => {
    try {
        const origin = new URL(url).origin;
        const perms = getSavedPermissions();
        if (!perms[origin]) perms[origin] = {};
        perms[origin][permission] = allowed;
        atomicWriteAsync(permissionsPath, JSON.stringify(perms, null, 2));
    } catch (e) {
        console.error("Erro ao salvar permissão:", e);
    }
};

// --- HISTORY PRUNING ---
const pruneHistory = async (win) => {
    const historyPath = path.join(storagePath, 'history.json');
    if (!fs.existsSync(historyPath)) return;
    try {
        const data = await fs.promises.readFile(historyPath, 'utf-8');
        let history = JSON.parse(data);
        const initialLength = history.length;
        const ONE_YEAR_MS = 365 * 24 * 60 * 60 * 1000;
        const MAX_ITEMS = 50000;
        const now = Date.now();
        history = history.filter(item => (now - item.timestamp) < ONE_YEAR_MS);
        if (history.length > MAX_ITEMS) {
            history.sort((a, b) => b.timestamp - a.timestamp);
            history = history.slice(0, MAX_ITEMS);
        }
        if (history.length < initialLength) {
            await atomicWriteAsync(historyPath, JSON.stringify(history, null, 2));
            if (win) {
                win.webContents.send('storage-updated', { key: 'history', value: history });
            }
        }
    } catch (e) { console.error("Erro ao limpar histórico:", e); }
};

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
    const index = list.findIndex(e => e.id === extData.id || e.path === extData.path);
    if (index >= 0) {
        list[index] = { ...list[index], ...extData };
    } else {
        list.push({ pinned: false, ...extData });
    }
    fs.writeFileSync(extensionsManifestPath, JSON.stringify(list, null, 2));
    if (mainWindow) mainWindow.webContents.send('extension-status', { id: extData.id, status: 'completed', message: 'Ativo' });
};

const removeExtensionFromList = (id) => {
    let list = getSavedExtensions();
    list = list.filter(e => e.id !== id);
    fs.writeFileSync(extensionsManifestPath, JSON.stringify(list, null, 2));
};

const findExtensionRoot = (dir) => {
    if (fs.existsSync(path.join(dir, 'manifest.json'))) return dir;
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
        if (entry.isDirectory()) {
            if (entry.name.startsWith('_') || entry.name.startsWith('.')) continue;
            const found = findExtensionRoot(path.join(dir, entry.name));
            if (found) return found;
        }
    }
    return null;
};

const cleanupMetadata = (dir) => {
    const metadataPath = path.join(dir, '_metadata');
    if (fs.existsSync(metadataPath)) {
        try { fs.rmSync(metadataPath, { recursive: true, force: true }); } catch (e) { }
    }
};

const parseExtensionManifest = (folderPath) => {
    try {
        const manifestPath = path.join(folderPath, 'manifest.json');
        if (!fs.existsSync(manifestPath)) return null;
        const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
        let iconPath = '';
        const icons = manifest.icons;
        if (icons) {
            iconPath = icons['128'] || icons['48'] || icons['32'] || icons['16'] || Object.values(icons)[0];
        } else if (manifest.browser_action?.default_icon) {
            const defIcons = manifest.browser_action.default_icon;
            if (typeof defIcons === 'string') iconPath = defIcons;
            else if (typeof defIcons === 'object') iconPath = defIcons['32'] || Object.values(defIcons)[0];
        }
        let popupPath = '';
        if (manifest.action?.default_popup) popupPath = manifest.action.default_popup;
        else if (manifest.browser_action?.default_popup) popupPath = manifest.browser_action.default_popup;

        return {
            name: manifest.name,
            version: manifest.version,
            description: manifest.description,
            icon: iconPath,
            popup: popupPath
        };
    } catch (e) {
        return null;
    }
};

const installExtensionFromBuffer = async (bufferOrPath, isFile, cwsId = null, win) => {
    try {
        let zipBuffer = isFile ? fs.readFileSync(bufferOrPath) : bufferOrPath;
        const tempId = `temp_${Date.now()}`;
        const tempDir = path.join(extensionsPath, tempId);
        fs.mkdirSync(tempDir, { recursive: true });

        const zip = new AdmZip(zipBuffer);
        zip.extractAllTo(tempDir, true);

        const rootDir = findExtensionRoot(tempDir);
        if (!rootDir) throw new Error("manifest.json não encontrado.");
        cleanupMetadata(rootDir);

        let folderId = cwsId || `local_${Date.now()}`;
        const finalDir = path.join(extensionsPath, folderId);
        if (fs.existsSync(finalDir)) fs.rmSync(finalDir, { recursive: true, force: true });
        fs.cpSync(rootDir, finalDir, { recursive: true });
        fs.rmSync(tempDir, { recursive: true, force: true });

        const details = parseExtensionManifest(finalDir);
        if (!details) throw new Error("Manifesto inválido.");

        const loadedExtension = await session.defaultSession.extensions.loadExtension(finalDir, { allowFileAccess: true });

        saveExtensionToList({
            id: loadedExtension.id,
            cwsId: cwsId,
            title: details.name,
            version: details.version,
            description: details.description,
            installDate: Date.now(),
            path: finalDir,
            icon: details.icon,
            popup: details.popup
        });

        if (win) {
            win.webContents.send('extension-status', { id: loadedExtension.id, status: 'completed', message: 'Instalado!' });
        }
    } catch (error) {
        console.error("Install Error:", error);
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
                console.error(`Falha ao carregar extensão: ${ext.title}`, e);
            }
        }
    }
};

// --- WINDOW CREATION & CORE IPC ---

function createWindow() {
    log.info('Iniciando createWindow()...');
    const splash = new BrowserWindow({
        width: 1280, height: 800, frame: false, titleBarStyle: 'hidden', show: true,
        backgroundColor: '#0a0e27',
        center: true,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true
        }
    });
    log.info('Splash screen criada.');
    splash.loadFile(path.join(__dirname, 'loading.html'));

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
    log.info('Janela principal instanciada.');

    if (!mainWindow) mainWindow = win;

    Menu.setApplicationMenu(null);

    let isSplashClosed = false;

    const closeSplashAndShowMain = () => {
        if (isSplashClosed) return;
        isSplashClosed = true;
        if (!splash.isDestroyed()) {
            splash.close();
        }
        if (!win.isDestroyed()) {
            win.show();
        }
    };

    // Fechar splash screen quando a janela principal estiver pronta
    win.webContents.once('did-finish-load', closeSplashAndShowMain);
    win.webContents.once('did-fail-load', closeSplashAndShowMain);

    ipcMain.once('app-ready', () => {
        closeSplashAndShowMain();
    });

    // Limite máximo de 1500ms para a tela de loading
    setTimeout(closeSplashAndShowMain, 1500);

    // Handler para permitir a seleção de mídia (Display Media) sem erro
    win.webContents.session.setDisplayMediaRequestHandler((request, callback) => {
        // Isso permite que o navegador abra a janela nativa de seleção
        // sem rejeitar a promessa imediatamente.
        callback({});
    });

    win.webContents.on('console-message', (event, level, message, line, sourceId) => {
        console.log(`[Renderer] ${message} (${sourceId}:${line})`);
    });

    const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;
    log.info(`Modo: ${isDev ? 'Development' : 'Production'} (Packaged: ${app.isPackaged})`);

    if (isDev) {
        log.info('Tentando carregar URL de desenvolvimento...');
        win.loadURL('http://localhost:5173').catch(() => {
            log.warn('Falha ao carregar server dev, usando fallback local.');
            win.loadFile(path.join(__dirname, 'dist-vite', 'index.html')).catch(() => win.loadFile(path.join(__dirname, 'fallback.html')));
        });
    } else {
        log.info('Carregando arquivos locais (Production)...');
        win.loadFile(path.join(__dirname, 'dist-vite', 'index.html')).catch((err) => {
            log.error('Erro ao carregar index.html:', err);
            win.loadFile(path.join(__dirname, 'fallback.html'));
        });
    }
}

// --- HANDLERS IPC (ÚNICOS E CONSOLIDADOS) ---

ipcMain.on('window-minimize', (event) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    if (win) win.minimize();
});

ipcMain.on('window-maximize', (event) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    if (win) {
        if (win.isMaximized()) win.unmaximize();
        else win.maximize();
    }
});

ipcMain.on('window-close', (event) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    if (win) win.close();
});

ipcMain.handle('storage-get', async (event, key) => {
    const filePath = path.join(storagePath, `${key}.json`);
    if (fs.existsSync(filePath)) {
        try {
            const data = await fs.promises.readFile(filePath, 'utf-8');
            return JSON.parse(data);
        } catch (e) { return null; }
    }
    return null;
});

ipcMain.on('storage-set', async (event, { key, value }) => {
    const filePath = path.join(storagePath, `${key}.json`);
    await atomicWriteAsync(filePath, JSON.stringify(value, null, 2));
    // Sincroniza outras janelas se existirem
    BrowserWindow.getAllWindows().forEach(win => {
        if (win.webContents !== event.sender) {
            win.webContents.send('storage-updated', { key, value });
        }
    });
});

ipcMain.handle('perform-search', async (event, { query, category, engine }) => {
    try {
        let url = '';
        const searchEngine = engine || 'google';
        const searchCategory = category || 'ALL';

        if (searchEngine === 'google') {
            let tbm = '';
            if (searchCategory === 'IMAGES') tbm = '&tbm=isch';
            else if (searchCategory === 'NEWS') tbm = '&tbm=nws';
            else if (searchCategory === 'VIDEOS') tbm = '&tbm=vid';
            url = `https://www.google.com/search?q=${encodeURIComponent(query)}${tbm}&hl=pt-BR`;
        } else if (searchEngine === 'bing') {
            url = `https://www.bing.com/search?q=${encodeURIComponent(query)}`;
        } else if (searchEngine === 'duckduckgo') {
            url = `https://duckduckgo.com/?q=${encodeURIComponent(query)}&kl=br-pt`;
        } else {
            url = `https://www.google.com/search?q=${encodeURIComponent(query)}&hl=pt-BR`;
        }

        const response = await fetch(url, {
            headers: { 'User-Agent': GLOBAL_USER_AGENT }
        });
        if (!response.ok) throw new Error(`Status ${response.status}`);
        return await response.text();
    } catch (e) {
        console.error(`Search error:`, e);
        return "";
    }
});

ipcMain.on('install-cws-extension', async (event, data) => {
    try {
        const crxUrl = `https://clients2.google.com/service/update2/crx?response=redirect&prodversion=132.0.6834.160&acceptformat=crx2,crx3&x=id%3D${data.id}%26uc`;
        const response = await fetch(crxUrl);
        const buffer = Buffer.from(await response.arrayBuffer());
        await installExtensionFromBuffer(buffer, false, data.id, mainWindow);
    } catch (e) {
        console.error(e);
    }
});

ipcMain.on('remove-extension', (event, id) => {
    const list = getSavedExtensions();
    const ext = list.find(e => e.id === id);
    if (ext) {
        try {
            session.defaultSession.removeExtension(id);
            fs.rmSync(ext.path, { recursive: true, force: true });
            removeExtensionFromList(id);
            if (mainWindow) mainWindow.webContents.send('extension-status', { id, status: 'removed', message: 'Removido' });
        } catch (e) { console.error(e); }
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
        width: 350, height: 500, x: Math.round(x - 300), y: Math.round(y),
        frame: false, show: false, parent: mainWindow, skipTaskbar: true,
        webPreferences: { nodeIntegration: false, contextIsolation: true, webSecurity: false }
    });
    extensionPopupWindow.loadURL(url);
    extensionPopupWindow.once('ready-to-show', () => extensionPopupWindow.show());
    extensionPopupWindow.on('blur', () => extensionPopupWindow?.close());
});

// IPC for manual update check
ipcMain.handle('check-for-updates', async () => {
    log.info('Verificação manual de updates iniciada...');
    try {
        await autoUpdater.checkForUpdatesAndNotify();
        return { status: 'checking' };
    } catch (error) {
        log.error('Erro na verificação manual:', error);
        throw error;
    }
});

// IPC to trigger quit and install
ipcMain.on('install-update', () => {
    log.info('Usuário solicitou instalação do update. Reiniciando...');
    autoUpdater.quitAndInstall(false, true);
});

// --- APP LIFECYCLE ---

app.whenReady().then(() => {
    session.defaultSession.setUserAgent(GLOBAL_USER_AGENT);
    loadPersistedExtensions();
    createWindow();

    // Auto Updater Setup
    autoUpdater.logger = log;
    autoUpdater.autoDownload = false; // Desabilitado para evitar crash no download automático
    autoUpdater.autoInstallOnAppQuit = true;
    log.info('App inicializado. Auto-updater configurado (autoDownload: false).');

    autoUpdater.on('checking-for-update', () => {
        log.info('Verificando atualizações...');
    });

    autoUpdater.on('update-available', (info) => {
        log.info('Update disponível:', info.version);
        mainWindow?.webContents.send('update-available', info);
    });

    autoUpdater.on('update-not-available', (info) => {
        log.info('Nenhum update disponível. Versão atual:', info.version);
        mainWindow?.webContents.send('update-not-available', info);
    });

    autoUpdater.on('download-progress', (progress) => {
        log.info(`Download progress: ${Math.round(progress.percent)}%`);
        mainWindow?.webContents.send('update-progress', progress);
    });

    autoUpdater.on('update-downloaded', (info) => {
        log.info('Update baixado, reiniciar para instalar:', info.version);
        mainWindow?.webContents.send('update-downloaded', info);
    });

    autoUpdater.on('error', (error) => {
        log.error('Erro no auto-updater:', error);
        mainWindow?.webContents.send('update-error', error?.message || 'Erro desconhecido');
    });

    // Verificação inicial atrasada para evitar crash na largada e garantir que a janela esteja pronta
    log.info('Agendando verificação inicial de updates em 10s...');
    setTimeout(() => {
        try {
            log.info('Iniciando checkForUpdates() agendado...');
            // Usando checkForUpdates em vez de checkForUpdatesAndNotify para mais controle
            autoUpdater.checkForUpdates().then((result) => {
                log.info('Check for updates concluído com sucesso.');
            }).catch(err => {
                log.error('Erro pego no .catch() do checkForUpdates:', err);
            });
        } catch (error) {
            log.error('Erro catastrófico ao tentar iniciar check de updates:', error);
        }
    }, 10000);

    // Verificação periódica a cada 30 minutos
    setInterval(() => {
        log.info('Verificação periódica de updates...');
        autoUpdater.checkForUpdatesAndNotify();
    }, 30 * 60 * 1000);
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});
