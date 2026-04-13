/**
 * preload.js — Electron Preload Script
 * Bridges the renderer (HTML pages) with the main process securely.
 */

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('__electronBridge', {
  isElectron: true,

  // Load saved settings (returns object or null)
  getSettings: () => ipcRenderer.invoke('get-settings'),

  // Save settings object
  saveSettings: (data) => ipcRenderer.invoke('save-settings', data),

  // Called when setup is complete — closes setup, opens main app
  openMainApp: () => ipcRenderer.invoke('open-main-app'),

  // Open settings again from main app
  reopenSetup: () => ipcRenderer.invoke('reopen-setup'),
});
