/**
 * electron-main.js — MultiChat Desktop App
 */

const { app, BrowserWindow, Tray, Menu, nativeImage, ipcMain, shell } = require('electron');
const path = require('path');
const fs   = require('fs');
const { fork } = require('child_process');

// Settings stored in OS user data dir
// Uses a fixed filename — version checked inside the file itself
const SETTINGS_PATH = path.join(app.getPath('userData'), 'multichat-settings.json');
const APP_VERSION   = app.getVersion(); // from package.json

let mainWindow   = null;
let setupWindow  = null;
let tray         = null;
let bridgeProc   = null;
let isQuitting   = false;

// ── Settings helpers ──────────────────────────────────────────────────────────
function readSettings() {
  try {
    if (!fs.existsSync(SETTINGS_PATH)) return null;
    return JSON.parse(fs.readFileSync(SETTINGS_PATH, 'utf8'));
  } catch(e) { return null; }
}

function writeSettings(data) {
  fs.writeFileSync(SETTINGS_PATH, JSON.stringify(data, null, 2), 'utf8');
}

function isSetupComplete() {
  const s = readSettings();
  if (!s || !s._setupDone || !s.BRAND_NAME || s.BRAND_NAME === 'YourName') return false;
  // If major version changed, force setup again
  const savedMajor = (s._appVersion || '0').split('.')[0];
  const currentMajor = APP_VERSION.split('.')[0];
  if (savedMajor !== currentMajor) {
    console.log(`[Setup] Major version changed (${savedMajor} → ${currentMajor}) — showing setup`);
    return false;
  }
  return true;
}

// ── IPC handlers (called from renderer pages) ─────────────────────────────────
ipcMain.handle('get-settings', () => readSettings());

ipcMain.handle('save-settings', (_, data) => {
  data._setupDone  = true;
  data._appVersion = APP_VERSION;
  writeSettings(data);
  return true;
});

ipcMain.handle('open-main-app', () => {
  if (setupWindow) setupWindow.close();
  startBridge();
  createMainWindow();
  createTray();
});

ipcMain.handle('reopen-setup', () => {
  if (mainWindow) mainWindow.hide();
  createSetupWindow();
});

ipcMain.handle('reset-settings', () => {
  if (fs.existsSync(SETTINGS_PATH)) fs.unlinkSync(SETTINGS_PATH);
  return true;
});

// ── Discord bridge ────────────────────────────────────────────────────────────
function startBridge() {
  const bridgePath = path.join(__dirname, 'discord-bridge.js');
  if (!fs.existsSync(bridgePath)) return;

  const settings = readSettings();
  if (!settings || !settings.DISCORD_BOT_TOKEN ||
      settings.DISCORD_BOT_TOKEN === 'YOUR_DISCORD_BOT_TOKEN') {
    console.log('[Bridge] No Discord token configured — bridge not started');
    return;
  }

  bridgeProc = fork(bridgePath, [], {
    cwd: __dirname,
    silent: true,
    env: {
      ...process.env,
      DISCORD_BOT_TOKEN:  settings.DISCORD_BOT_TOKEN,
      DISCORD_CHANNEL_ID: settings.DISCORD_CHANNEL_ID,
      DISCORD_BRIDGE_WS_PORT: '8081'
    }
  });

  bridgeProc.stdout.on('data', (d) => process.stdout.write(`[Bridge] ${d}`));
  bridgeProc.stderr.on('data', (d) => process.stderr.write(`[Bridge] ${d}`));
  bridgeProc.on('exit', (code) => {
    if (!isQuitting) {
      console.log(`[Bridge] Crashed (${code}) — restarting in 3s`);
      setTimeout(startBridge, 3000);
    }
  });
  console.log('[Bridge] Started');
}

// ── Setup window ──────────────────────────────────────────────────────────────
function createSetupWindow() {
  setupWindow = new BrowserWindow({
    width:  560,
    height: 780,
    resizable: false,
    title: 'MultiChat — Setup',
    backgroundColor: '#0e0e10',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
    show: false,
    autoHideMenuBar: true,
  });

  setupWindow.loadFile('setup.html');
  setupWindow.once('ready-to-show', () => setupWindow.show());
  setupWindow.on('closed', () => { setupWindow = null; });
}

// ── Main chat window ──────────────────────────────────────────────────────────
function createMainWindow() {
  mainWindow = new BrowserWindow({
    width:  420,
    height: 900,
    minWidth:  320,
    minHeight: 400,
    title: 'MultiChat',
    backgroundColor: '#0e0e10',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
    show: false,
    autoHideMenuBar: true,
  });

  mainWindow.loadFile('multichat.html');
  mainWindow.once('ready-to-show', () => mainWindow.show());

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  mainWindow.on('close', (e) => {
    if (!isQuitting) { e.preventDefault(); mainWindow.hide(); }
  });
}

// ── System tray ───────────────────────────────────────────────────────────────
function createTray() {
  if (tray) return; // Only create once
  // Use platform-appropriate icon format
  const iconFile = process.platform === 'darwin' ? 'icon.png'
                 : process.platform === 'win32'  ? 'icon.ico'
                 : 'icon.png';
  const iconPath = path.join(__dirname, 'assets', iconFile);
  const icon = fs.existsSync(iconPath)
    ? nativeImage.createFromPath(iconPath)
    : nativeImage.createEmpty();

  tray = new Tray(icon);
  tray.setToolTip('MultiChat');

  const menu = Menu.buildFromTemplate([
    {
      label: 'Show MultiChat',
      click: () => { if (mainWindow) { mainWindow.show(); mainWindow.focus(); } }
    },
    {
      label: 'Settings',
      click: () => { createSetupWindow(); }
    },
    {
      label: 'Reset & Clear Data',
      click: () => {
        const { dialog } = require('electron');
        dialog.showMessageBox({
          type: 'question',
          buttons: ['Delete & Restart Setup', 'Cancel'],
          defaultId: 1,
          title: 'Reset MultiChat',
          message: 'Delete all saved settings?',
          detail: 'This will remove your stream links, Discord token, and preferences. The setup wizard will reopen.'
        }).then(({ response }) => {
          if (response === 0) {
            if (fs.existsSync(SETTINGS_PATH)) fs.unlinkSync(SETTINGS_PATH);
            if (bridgeProc) { bridgeProc.kill(); bridgeProc = null; }
            if (mainWindow) { mainWindow.destroy(); mainWindow = null; }
            createSetupWindow();
          }
        });
      }
    },
    { type: 'separator' },
    {
      label: 'Quit',
      click: () => { isQuitting = true; app.quit(); }
    }
  ]);

  tray.setContextMenu(menu);
  // Mac uses single click on tray; Windows uses double-click
  if (process.platform === 'darwin') {
    tray.on('click', () => { if (mainWindow) { mainWindow.show(); mainWindow.focus(); } });
  } else {
    tray.on('double-click', () => { if (mainWindow) { mainWindow.show(); mainWindow.focus(); } });
  }
}

// ── App start ─────────────────────────────────────────────────────────────────
app.whenReady().then(() => {
  // Mac: hide from dock — lives in menu bar tray only
  if (process.platform === 'darwin') {
    app.dock.hide();
    // Set Mac app menu so copy/paste/select-all work in text inputs
    const macMenu = Menu.buildFromTemplate([{
      label: app.name,
      submenu: [{ role: 'hide' }, { role: 'quit' }]
    }, {
      label: 'Edit',
      submenu: [
        { role: 'undo' }, { role: 'redo' }, { type: 'separator' },
        { role: 'cut' }, { role: 'copy' }, { role: 'paste' },
        { role: 'selectAll' }
      ]
    }]);
    Menu.setApplicationMenu(macMenu);
  } else {
    Menu.setApplicationMenu(null); // No menu bar on Windows/Linux
  }

  if (isSetupComplete()) {
    // Returning user — go straight to chat
    startBridge();
    createMainWindow();
    createTray();
  } else {
    // First launch — show setup wizard
    createSetupWindow();
  }
});

app.on('window-all-closed', (e) => e.preventDefault());

app.on('before-quit', () => {
  isQuitting = true;
  if (bridgeProc) { bridgeProc.kill(); }
});

app.on('activate', () => {
  if (mainWindow) mainWindow.show();
});
