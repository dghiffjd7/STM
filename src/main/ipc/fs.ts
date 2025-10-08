import { ipcMain } from 'electron';
import { IPC_CHANNELS } from '../../shared/constants';
import { Command, CommandResult } from '../../shared/types';
import { executeCommand } from '../core/commands';

export function registerFsHandlers(): void {
  ipcMain.handle(IPC_CHANNELS.FS_EXEC, async (event, command: Command): Promise<CommandResult> => {
    return await executeCommand(command);
  });
}
