import { useState, useCallback } from 'react';

interface ShortcutsSectionProps {
  config: any;
  toast: any;
}

export function ShortcutsSection({ config, toast }: ShortcutsSectionProps) {
  const [capturing, setCapturing] = useState<string | null>(null);

  const shortcuts = config.config?.shortcuts;

  const handleUpdate = async (field: string, value: string) => {
    const result = await config.update({
      shortcuts: {
        ...shortcuts,
        [field]: value,
      },
    });

    if (result.success) {
      toast.success(`Shortcut updated: ${value}`);
    } else {
      toast.error(result.error || 'Failed to update shortcut');
    }
  };

  const captureShortcut = useCallback(
    (field: string, event: React.KeyboardEvent) => {
      event.preventDefault();

      const keys: string[] = [];

      if (event.ctrlKey || event.metaKey) keys.push('Ctrl');
      if (event.altKey) keys.push('Alt');
      if (event.shiftKey) keys.push('Shift');

      const key = event.key.toUpperCase();
      if (key !== 'CONTROL' && key !== 'ALT' && key !== 'SHIFT' && key !== 'META') {
        keys.push(key === ' ' ? 'Space' : key);
      }

      if (keys.length > 1) {
        const shortcut = keys.join('+');
        handleUpdate(field, shortcut);
        setCapturing(null);
      }
    },
    [handleUpdate]
  );

  const ShortcutInput = ({
    label,
    field,
    value,
    description,
  }: {
    label: string;
    field: string;
    value: string;
    description?: string;
  }) => (
    <div>
      <label className="block text-sm font-medium mb-2">{label}</label>
      {description && <p className="text-xs text-gray-500 mb-2">{description}</p>}
      <input
        type="text"
        value={capturing === field ? 'Press keys...' : value}
        onFocus={() => setCapturing(field)}
        onBlur={() => setCapturing(null)}
        onKeyDown={(e) => capturing === field && captureShortcut(field, e)}
        readOnly
        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 dark:bg-gray-700 dark:text-white cursor-pointer"
        placeholder="Click to capture..."
      />
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 space-y-4">
        <h3 className="text-lg font-semibold">Keyboard Shortcuts</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Click on an input field and press your desired key combination
        </p>

        <div className="space-y-4 mt-4">
          <ShortcutInput
            label="Summon/Hide Maid"
            field="summon"
            value={shortcuts?.summon || 'Alt+Space'}
            description="Show or hide the maid window"
          />

          <ShortcutInput
            label="Speak/Stop TTS"
            field="speak"
            value={shortcuts?.speak || 'Alt+S'}
            description="Start or stop text-to-speech playback"
          />

          <ShortcutInput
            label="Open Settings"
            field="settings"
            value={shortcuts?.settings || 'Alt+,'}
            description="Open the settings window"
          />
        </div>

        <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
          <p className="text-sm text-yellow-800 dark:text-yellow-200">
            ⚠️ Note: Shortcuts will take effect after restarting the application
          </p>
        </div>
      </div>
    </div>
  );
}
