import { ipcMain, BrowserWindow } from 'electron';
import { IPC_CHANNELS } from '../../shared/constants';
import { createSettingsWindow } from '../windows/settingsWindow';

export function registerSysHandlers(): void {
  ipcMain.on(IPC_CHANNELS.SYS_TOGGLE, () => {
    const win = BrowserWindow.getFocusedWindow();
    if (win) {
      if (win.isVisible()) {
        win.hide();
      } else {
        win.show();
        win.focus();
      }
    }
  });

  ipcMain.on(IPC_CHANNELS.SYS_MINIMIZE, () => {
    const win = BrowserWindow.getFocusedWindow();
    win?.minimize();
  });

  ipcMain.on(IPC_CHANNELS.SYS_CLOSE, () => {
    const win = BrowserWindow.getFocusedWindow();
    win?.close();
  });

  ipcMain.on(IPC_CHANNELS.SYS_OPEN_SETTINGS, () => {
    createSettingsWindow();
  });

  ipcMain.on(IPC_CHANNELS.SYS_SET_IGNORE_MOUSE, (event, ignore: boolean) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    if (win) {
      win.setIgnoreMouseEvents(ignore, { forward: true });
    }
  });
}
