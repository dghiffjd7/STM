import { useState } from 'react';
import * as Tabs from '@radix-ui/react-tabs';
import { useConfig } from '../../hooks/useConfig';
import { useToast } from '../../hooks/useToast';
import { ToastContainer } from '../Toast';
import { LLMSection } from './sections/LLMSection';
import { SecretsSection } from './sections/SecretsSection';
import { ProfilesSection } from './sections/ProfilesSection';
import { TTSSection } from './sections/TTSSection';
import { PermissionsSection } from './sections/PermissionsSection';
import { ShortcutsSection } from './sections/ShortcutsSection';
import { AppearanceSection } from './sections/AppearanceSection';

interface SettingsRootProps {
  onClose: () => void;
  standalone?: boolean; // 独立窗口模式
}

export function SettingsRoot({ onClose, standalone = false }: SettingsRootProps) {
  const config = useConfig();
  const toast = useToast();
  const [activeTab, setActiveTab] = useState('llm');

  const handleExport = async () => {
    const json = await config.exportConfig();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `stm-config-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Config exported');
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const text = await file.text();
        const result = await config.importConfig(text);
        if (result.success) {
          toast.success('Config imported successfully');
        } else {
          toast.error(result.error || 'Import failed');
        }
      }
    };
    input.click();
  };

  if (config.loading) {
    return (
      <div className={standalone ? "w-full h-full flex items-center justify-center" : "fixed inset-0 bg-black/50 flex items-center justify-center z-50"}>
        <div className="bg-white dark:bg-gray-900 rounded-2xl p-8">
          <p className="text-lg">Loading settings...</p>
        </div>
      </div>
    );
  }

  const settingsContent = (
    <div className={standalone ? "w-full h-full flex flex-col" : "bg-white dark:bg-gray-900 w-[900px] h-[700px] rounded-2xl shadow-2xl flex flex-col"}>
      {/* Content will be inserted here */}
    </div>
  );

  return (
    <>
      {standalone ? (
        <div className="w-full h-full bg-white dark:bg-gray-900 flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
            <h2 className="text-2xl font-bold">Settings</h2>
            <div className="flex gap-2">
              <button
                onClick={handleExport}
                className="px-3 py-1 text-sm bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600"
              >
                Export
              </button>
              <button
                onClick={handleImport}
                className="px-3 py-1 text-sm bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600"
              >
                Import
              </button>
              <button
                onClick={onClose}
                className="px-3 py-1 text-sm bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Tabs */}
          <Tabs.Root value={activeTab} onValueChange={setActiveTab} className="flex-1 flex overflow-hidden min-h-0">
            <Tabs.List className="w-48 border-r border-gray-200 dark:border-gray-700 p-4 space-y-1 overflow-y-auto">
              <Tabs.Trigger
                value="llm"
                className="w-full text-left px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 data-[state=active]:bg-pink-500 data-[state=active]:text-white transition-colors"
              >
                LLM
              </Tabs.Trigger>
              <Tabs.Trigger
                value="secrets"
                className="w-full text-left px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 data-[state=active]:bg-pink-500 data-[state=active]:text-white transition-colors"
              >
                Secrets
              </Tabs.Trigger>
              <Tabs.Trigger
                value="profiles"
                className="w-full text-left px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 data-[state=active]:bg-pink-500 data-[state=active]:text-white transition-colors"
              >
                Profiles
              </Tabs.Trigger>
              <Tabs.Trigger
                value="tts"
                className="w-full text-left px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 data-[state=active]:bg-pink-500 data-[state=active]:text-white transition-colors"
              >
                TTS
              </Tabs.Trigger>
              <Tabs.Trigger
                value="permissions"
                className="w-full text-left px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 data-[state=active]:bg-pink-500 data-[state=active]:text-white transition-colors"
              >
                Permissions
              </Tabs.Trigger>
              <Tabs.Trigger
                value="shortcuts"
                className="w-full text-left px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 data-[state=active]:bg-pink-500 data-[state=active]:text-white transition-colors"
              >
                Shortcuts
              </Tabs.Trigger>
              <Tabs.Trigger
                value="appearance"
                className="w-full text-left px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 data-[state=active]:bg-pink-500 data-[state=active]:text-white transition-colors"
              >
                Appearance
              </Tabs.Trigger>
            </Tabs.List>

            <div className="flex-1 overflow-y-auto p-6">
              <Tabs.Content value="llm">
                <LLMSection config={config} toast={toast} />
              </Tabs.Content>

              <Tabs.Content value="secrets">
                <SecretsSection config={config} toast={toast} />
              </Tabs.Content>

              <Tabs.Content value="profiles">
                <ProfilesSection config={config} toast={toast} />
              </Tabs.Content>

              <Tabs.Content value="tts">
                <TTSSection config={config} toast={toast} />
              </Tabs.Content>

              <Tabs.Content value="permissions">
                <PermissionsSection config={config} toast={toast} />
              </Tabs.Content>

              <Tabs.Content value="shortcuts">
                <ShortcutsSection config={config} toast={toast} />
              </Tabs.Content>

              <Tabs.Content value="appearance">
                <AppearanceSection config={config} toast={toast} />
              </Tabs.Content>
            </div>
          </Tabs.Root>
        </div>
      ) : (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
          <div
            className="bg-white dark:bg-gray-900 w-[900px] h-[700px] rounded-2xl shadow-2xl flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-2xl font-bold">Settings</h2>
            <div className="flex gap-2">
              <button
                onClick={handleExport}
                className="px-3 py-1 text-sm bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600"
              >
                Export
              </button>
              <button
                onClick={handleImport}
                className="px-3 py-1 text-sm bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600"
              >
                Import
              </button>
              <button
                onClick={onClose}
                className="px-3 py-1 text-sm bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Tabs */}
          <Tabs.Root value={activeTab} onValueChange={setActiveTab} className="flex-1 flex overflow-hidden">
            <Tabs.List className="w-48 border-r border-gray-200 dark:border-gray-700 p-4 space-y-1 overflow-y-auto">
              <Tabs.Trigger
                value="llm"
                className="w-full text-left px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 data-[state=active]:bg-pink-500 data-[state=active]:text-white transition-colors"
              >
                LLM
              </Tabs.Trigger>
              <Tabs.Trigger
                value="secrets"
                className="w-full text-left px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 data-[state=active]:bg-pink-500 data-[state=active]:text-white transition-colors"
              >
                Secrets
              </Tabs.Trigger>
              <Tabs.Trigger
                value="profiles"
                className="w-full text-left px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 data-[state=active]:bg-pink-500 data-[state=active]:text-white transition-colors"
              >
                Profiles
              </Tabs.Trigger>
              <Tabs.Trigger
                value="tts"
                className="w-full text-left px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 data-[state=active]:bg-pink-500 data-[state=active]:text-white transition-colors"
              >
                TTS
              </Tabs.Trigger>
              <Tabs.Trigger
                value="permissions"
                className="w-full text-left px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 data-[state=active]:bg-pink-500 data-[state=active]:text-white transition-colors"
              >
                Permissions
              </Tabs.Trigger>
              <Tabs.Trigger
                value="shortcuts"
                className="w-full text-left px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 data-[state=active]:bg-pink-500 data-[state=active]:text-white transition-colors"
              >
                Shortcuts
              </Tabs.Trigger>
              <Tabs.Trigger
                value="appearance"
                className="w-full text-left px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 data-[state=active]:bg-pink-500 data-[state=active]:text-white transition-colors"
              >
                Appearance
              </Tabs.Trigger>
            </Tabs.List>

            <div className="flex-1 overflow-y-auto p-6">
              <Tabs.Content value="llm">
                <LLMSection config={config} toast={toast} />
              </Tabs.Content>

              <Tabs.Content value="secrets">
                <SecretsSection config={config} toast={toast} />
              </Tabs.Content>

              <Tabs.Content value="profiles">
                <ProfilesSection config={config} toast={toast} />
              </Tabs.Content>

              <Tabs.Content value="tts">
                <TTSSection config={config} toast={toast} />
              </Tabs.Content>

              <Tabs.Content value="permissions">
                <PermissionsSection config={config} toast={toast} />
              </Tabs.Content>

              <Tabs.Content value="shortcuts">
                <ShortcutsSection config={config} toast={toast} />
              </Tabs.Content>

              <Tabs.Content value="appearance">
                <AppearanceSection config={config} toast={toast} />
              </Tabs.Content>
            </div>
          </Tabs.Root>
        </div>
        </div>
      )}

      <ToastContainer toasts={toast.toasts} onRemove={toast.remove} />
    </>
  );
}
