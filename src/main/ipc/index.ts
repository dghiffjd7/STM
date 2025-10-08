import { ipcMain } from 'electron';
import { IPC_CHANNELS } from '../../shared/constants';
import { registerAiHandlers } from './ai';
import { registerTtsHandlers } from './tts';
import { registerFsHandlers } from './fs';
import { registerSysHandlers } from './sys';
import { registerConfigHandlers } from './config';
import { registerPermissionHandlers } from './permission';

export function registerIpcHandlers(): void {
  registerAiHandlers();
  registerTtsHandlers();
  registerFsHandlers();
  registerSysHandlers();
  registerConfigHandlers();
  registerPermissionHandlers();

  console.log('All IPC handlers registered');
}
 