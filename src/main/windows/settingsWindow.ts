import { BrowserWindow, app } from 'electron';
import path from 'path';

let settingsWindow: BrowserWindow | null = null;

export function createSettingsWindow(): BrowserWindow {
  // 如果窗口已存在，聚焦并返回
  if (settingsWindow && !settingsWindow.isDestroyed()) {
    settingsWindow.focus();
    return settingsWindow;
  }

  // dist/main/windows/*.js 中的 __dirname 指向 dist/main/windows
  // 需要相对路径 ../../preload/index.js 来访问 dist/preload/index.js
  const preloadPath = path.resolve(__dirname, '../../preload/index.js');

  settingsWindow = new BrowserWindow({
    width: 1000,
    height: 750,
    minWidth: 900,
    minHeight: 700,
    title: 'STM Settings',
    backgroundColor: '#ffffff',
    webPreferences: {
      preload: preloadPath,
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  // 窗口关闭时清理引用
  settingsWindow.on('closed', () => {
    settingsWindow = null;
  });

  const isDev = !app.isPackaged;
  if (isDev) {
    settingsWindow.loadURL('http://localhost:5173/#/settings');
    settingsWindow.webContents.openDevTools({ mode: 'detach' });
  } else {
    settingsWindow.loadFile(path.join(__dirname, '../renderer/index.html'), {
      hash: '/settings',
    });
  }

  return settingsWindow;
}

export function getSettingsWindow(): BrowserWindow | null {
  return settingsWindow;
}
