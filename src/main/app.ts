import { app, BrowserWindow, globalShortcut } from 'electron';
import path from 'path';
import { createMaidWindow } from './windows/maidWindow';
import { registerIpcHandlers } from './ipc';
import { initConfig, getConfig } from './core/config';

let maidWindow: BrowserWindow | null = null;
 
// Single instance lock
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (maidWindow) {
      if (maidWindow.isMinimized()) maidWindow.restore();
      maidWindow.focus();
    }
  });

  app.whenReady().then(() => {
    // Initialize configuration
    initConfig();

    // Register IPC handlers
    registerIpcHandlers();

    // Create maid window
    maidWindow = createMaidWindow();

    // Register global shortcut
    const config = getConfig();
    const { summon } = config.shortcuts;
    globalShortcut.register(summon, () => {
      if (maidWindow) {
        if (maidWindow.isVisible()) {
          maidWindow.hide();
        } else {
          maidWindow.show();
          maidWindow.focus();
        }
      }
    });

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        maidWindow = createMaidWindow();
      }
    });
  });

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
      app.quit();
    }
  });

  app.on('will-quit', () => {
    globalShortcut.unregisterAll();
  });
}
