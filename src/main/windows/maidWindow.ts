import { BrowserWindow, app, screen } from 'electron';
import path from 'path';

export function createMaidWindow(): BrowserWindow {
  // dist/main/windows/*.js 中的 __dirname 指向 dist/main/windows
  // 需要相对路径 ../../preload/index.js 来访问 dist/preload/index.js
  const preloadPath = path.resolve(__dirname, '../../preload/index.js');

  // 获取主显示器尺寸
  const { width, height } = screen.getPrimaryDisplay().workAreaSize;

  const win = new BrowserWindow({
    width,
    height,
    x: 0,
    y: 0,
    transparent: true,
    frame: false,
    alwaysOnTop: true,
    resizable: false,
    skipTaskbar: true,
    webPreferences: {
      preload: preloadPath,
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  // 初始不穿透，由 renderer 动态控制
  // renderer 会根据鼠标位置判断是否需要穿透
  win.setIgnoreMouseEvents(false);

  // Load the renderer
  // In development, always use Vite dev server
  const isDev = !app.isPackaged;
  if (isDev) {
    win.loadURL('http://localhost:5173');
    // DevTools can be opened manually with F12 if needed
    // win.webContents.openDevTools({ mode: 'detach' });
  } else {
    win.loadFile(path.join(__dirname, '../renderer/index.html'));
  }

  // Debug logging for window lifecycle
  win.webContents.on('did-start-navigation', (_event, url) => {
    console.log('[maidWindow] did-start-navigation:', url);
  });

  win.webContents.on('did-start-loading', () => {
    console.log('[maidWindow] did-start-loading');
  });

  win.webContents.on('did-finish-load', () => {
    console.log('[maidWindow] did-finish-load');
  });

  win.webContents.on('did-fail-load', (_event, errorCode, errorDescription, validatedURL) => {
    console.error('[maidWindow] did-fail-load', { errorCode, errorDescription, validatedURL });
  });

  win.webContents.on('render-process-gone', (_event, details) => {
    console.error('[maidWindow] render-process-gone', details);
  });

  win.webContents.on('console-message', (_event, level, message, line, sourceId) => {
    console.log(`[maidWindow][console ${level}] ${message} (${sourceId}:${line})`);
  });

  return win;
}
