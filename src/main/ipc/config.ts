import { ipcMain } from 'electron';
import type {
  STMConfig,
  SecretSetRequest,
  SecretStatus,
  ConnectionTestResult,
  Profile,
  OperationResult,
} from '../../shared/types';
import {
  getConfig,
  setConfig,
  saveProfile,
  deleteProfile as deleteProfileInternal,
  applyProfile as applyProfileInternal,
  exportConfig as exportConfigInternal,
  importConfig as importConfigInternal,
  testConnection as testConnectionInternal,
} from '../core/config';
import { setSecret, getSecretStatus } from '../core/secrets';

export function registerConfigHandlers(): void {
  // Get full config (without secrets)
  ipcMain.handle('config.get', async (): Promise<STMConfig> => {
    return getConfig();
  });

  // Set config (partial update, non-sensitive only)
  ipcMain.handle('config.set', async (event, patch: Partial<STMConfig>): Promise<OperationResult> => {
    try {
      setConfig(patch);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  });

  // Set secret
  ipcMain.handle('secret.set', async (event, request: SecretSetRequest): Promise<OperationResult> => {
    try {
      await setSecret(request.provider, request.kind, request.value);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  });

  // Get secret status (which secrets are configured)
  ipcMain.handle('secret.status', async (event, provider: string): Promise<SecretStatus> => {
    return await getSecretStatus(provider as any);
  });

  // Test connection
  ipcMain.handle('config.testConnection', async (): Promise<ConnectionTestResult> => {
    return await testConnectionInternal();
  });

  // Profile management
  ipcMain.handle('config.saveProfile', async (event, profile: Profile): Promise<OperationResult> => {
    try {
      saveProfile(profile);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  });

  ipcMain.handle('config.deleteProfile', async (event, id: string): Promise<OperationResult> => {
    try {
      deleteProfileInternal(id);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  });

  ipcMain.handle('config.applyProfile', async (event, id: string): Promise<OperationResult> => {
    try {
      applyProfileInternal(id);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  });

  // Import/Export
  ipcMain.handle('config.export', async (): Promise<string> => {
    return exportConfigInternal();
  });

  ipcMain.handle('config.import', async (event, jsonString: string): Promise<OperationResult> => {
    try {
      importConfigInternal(jsonString);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  });

  console.log('[config] Handlers registered');
}
