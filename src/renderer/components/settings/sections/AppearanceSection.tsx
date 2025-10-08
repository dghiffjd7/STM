interface AppearanceSectionProps {
  config: any;
  toast: any;
}

export function AppearanceSection({ config, toast }: AppearanceSectionProps) {
  const appearance = config.config?.appearance;

  const handleUpdate = async (field: string, value: any) => {
    const result = await config.update({
      appearance: {
        ...appearance,
        [field]: value,
      },
    });

    if (result.success) {
      toast.success('Appearance updated');
    } else {
      toast.error(result.error || 'Failed to update appearance');
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 space-y-4">
        <h3 className="text-lg font-semibold">Theme</h3>

        <div className="grid grid-cols-3 gap-3">
          {[
            { value: 'light', label: 'Light', icon: '☀️' },
            { value: 'dark', label: 'Dark', icon: '🌙' },
            { value: 'system', label: 'System', icon: '💻' },
          ].map((theme) => (
            <button
              key={theme.value}
              onClick={() => handleUpdate('theme', theme.value)}
              className={`p-3 border-2 rounded-lg transition-all ${
                appearance?.theme === theme.value
                  ? 'border-pink-500 bg-pink-50 dark:bg-pink-900/20'
                  : 'border-gray-200 dark:border-gray-700 hover:border-pink-300'
              }`}
            >
              <div className="text-2xl mb-1">{theme.icon}</div>
              <div className="text-sm font-medium">{theme.label}</div>
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 space-y-4">
        <h3 className="text-lg font-semibold">Maid Size</h3>

        <div className="grid grid-cols-3 gap-3">
          {[
            { value: 'sm', label: 'Small' },
            { value: 'md', label: 'Medium' },
            { value: 'lg', label: 'Large' },
          ].map((size) => (
            <button
              key={size.value}
              onClick={() => handleUpdate('size', size.value)}
              className={`p-3 border-2 rounded-lg transition-all ${
                appearance?.size === size.value
                  ? 'border-pink-500 bg-pink-50 dark:bg-pink-900/20'
                  : 'border-gray-200 dark:border-gray-700 hover:border-pink-300'
              }`}
            >
              <div className="text-sm font-medium">{size.label}</div>
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 space-y-4">
        <h3 className="text-lg font-semibold">Opacity</h3>

        <div>
          <label className="block text-sm font-medium mb-2">
            Transparency: {Math.round((appearance?.opacity || 0.95) * 100)}%
          </label>
          <input
            type="range"
            min="0.3"
            max="1"
            step="0.05"
            value={appearance?.opacity || 0.95}
            onChange={(e) => handleUpdate('opacity', parseFloat(e.target.value))}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>30%</span>
            <span>100%</span>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 space-y-4">
        <h3 className="text-lg font-semibold">Window Behavior</h3>

        <div className="flex items-center justify-between">
          <div>
            <label className="text-sm font-medium">Always on Top</label>
            <p className="text-xs text-gray-500">Keep maid window above other windows</p>
          </div>
          <button
            onClick={() => handleUpdate('alwaysOnTop', !appearance?.alwaysOnTop)}
            className={`relative w-12 h-6 rounded-full transition-colors ${
              appearance?.alwaysOnTop ? 'bg-pink-500' : 'bg-gray-300'
            }`}
          >
            <span
              className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                appearance?.alwaysOnTop ? 'translate-x-6' : ''
              }`}
            />
          </button>
        </div>
      </div>
    </div>
  );
}
