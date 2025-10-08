import { ipcMain, BrowserWindow, dialog } from 'electron';
import { IPC_CHANNELS } from '../../shared/constants';
import { PermissionRequest, PermissionResponse, PermissionDomain } from '../../shared/types';
import { checkPermission, grantPermission } from '../core/permissions';

export function registerPermissionHandlers(): void {
  ipcMain.handle(
    IPC_CHANNELS.PERMISSION_REQUEST,
    async (event, request: PermissionRequest): Promise<PermissionResponse> => {
      // Check if permission already granted
      const hasPermission = checkPermission(request.domain, request.scope);
      if (hasPermission) {
        return { granted: true };
      }

      // Show permission dialog
      const win = BrowserWindow.fromWebContents(event.sender);
      if (!win) {
        return { granted: false };
      }

      const result = await dialog.showMessageBox(win, {
        type: 'question',
        title: 'Permission Request',
        message: `STM is requesting permission to ${request.action}`,
        detail: request.detail || `Domain: ${request.domain}\nScope: ${request.scope || 'all'}`,
        buttons: ['Allow Once', 'Always Allow', 'Deny'],
        defaultId: 0,
        cancelId: 2,
      });

      const granted = result.response !== 2;
      const remember = result.response === 1;

      if (granted && remember) {
        grantPermission(request.domain, true, request.scope);
      }

      return { granted, remember };
    }
  );

  ipcMain.handle(
    IPC_CHANNELS.PERMISSION_CHECK,
    async (event, domain: PermissionDomain, scope?: string): Promise<boolean> => {
      return checkPermission(domain, scope);
    }
  );
}
