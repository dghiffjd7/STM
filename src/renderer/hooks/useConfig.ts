import { useState, useEffect, useCallback } from 'react';
import type {
  STMConfig,
  SecretSetRequest,
  SecretStatus,
  ConnectionTestResult,
  Profile,
  Provider,
} from '../../shared/types';

export function useConfig() {
  const [config, setConfig] = useState<STMConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [dirty, setDirty] = useState(false);
 
  const refresh = useCallback(async () => {
    try {
      const data = await window.config.get();
      setConfig(data);
      setDirty(false);
    } catch (err) {
      console.error('Failed to load config:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const update = useCallback(
    async (patch: Partial<STMConfig>) => {
      try {
        await window.config.set(patch);
        setDirty(true);
        await refresh();
        return { success: true };
      } catch (err: any) {
        console.error('Failed to update config:', err);
        return { success: false, error: err.message };
      }
    },
    [refresh]
  );

  const setSecretValue = useCallback(
    async (provider: Provider, kind: string, value: string) => {
      try {
        await window.secret.set({ provider, kind, value } as SecretSetRequest);
        await refresh();
        return { success: true };
      } catch (err: any) {
        console.error('Failed to set secret:', err);
        return { success: false, error: err.message };
      }
    },
    [refresh]
  );

  const getSecretStatus = useCallback(async (provider: Provider): Promise<SecretStatus> => {
    return await window.secret.status(provider);
  }, []);

  const testConnection = useCallback(async (): Promise<ConnectionTestResult> => {
    return await window.config.testConnection();
  }, []);

  const saveProfile = useCallback(
    async (profile: Profile) => {
      try {
        await window.config.saveProfile(profile);
        await refresh();
        return { success: true };
      } catch (err: any) {
        return { success: false, error: err.message };
      }
    },
    [refresh]
  );

  const deleteProfile = useCallback(
    async (id: string) => {
      try {
        await window.config.deleteProfile(id);
        await refresh();
        return { success: true };
      } catch (err: any) {
        return { success: false, error: err.message };
      }
    },
    [refresh]
  );

  const applyProfile = useCallback(
    async (id: string) => {
      try {
        await window.config.applyProfile(id);
        await refresh();
        return { success: true };
      } catch (err: any) {
        return { success: false, error: err.message };
      }
    },
    [refresh]
  );

  const exportConfig = useCallback(async (): Promise<string> => {
    return await window.config.export();
  }, []);

  const importConfig = useCallback(
    async (jsonString: string) => {
      try {
        await window.config.import(jsonString);
        await refresh();
        return { success: true };
      } catch (err: any) {
        return { success: false, error: err.message };
      }
    },
    [refresh]
  );

  return {
    config,
    loading,
    dirty,
    refresh,
    update,
    setSecretValue,
    getSecretStatus,
    testConnection,
    saveProfile,
    deleteProfile,
    applyProfile,
    exportConfig,
    importConfig,
  };
}
