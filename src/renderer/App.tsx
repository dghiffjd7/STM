import { useEffect, useRef, useState } from 'react';
import { ChatView } from './components/ChatView';
import { Maid } from './components/Maid';
import { PromptBar } from './components/PromptBar';
import { useConfigStore } from './store';

export function App() {
  const { loadConfig, config } = useConfigStore();
  const [showUI, setShowUI] = useState(false);

  console.log('[App] Render start');

  useEffect(() => {
    loadConfig();
  }, [loadConfig]);

  // Apply appearance config to document and window
  useEffect(() => {
    if (!config) return;

    console.log('[App] Applying appearance config:', config.appearance);

    const { theme, opacity, size, alwaysOnTop } = config.appearance;

    // Apply theme
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else if (theme === 'light') {
      document.documentElement.classList.remove('dark');
    } else {
      // System theme
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (prefersDark) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }

    // Apply size via CSS variable (for character scaling)
    const sizeScale = size === 'sm' ? 0.8 : size === 'lg' ? 1.2 : 1.0;
    document.documentElement.style.setProperty('--character-scale', sizeScale.toString());

    // Notify main process to update window properties
    window.electronAPI.sysUpdateAppearance({ opacity, alwaysOnTop });
  }, [config]);

  // 初始化：默认启用穿透（透明区域可点击穿透到桌面）
  useEffect(() => {
    console.log('[App] Initializing click-through: enabled by default');
    window.electronAPI.sysSetIgnoreMouse(true);
  }, []);

  const handleOpenSettings = () => {
    window.electronAPI.sysOpenSettings();
  };

  const handleMaidClick = () => {
    setShowUI(!showUI);
  };

  // 鼠标进入可交互区域时禁用穿透
  const handleMouseEnter = () => {
    console.log('[App] Mouse entered interactive area - disabling click-through');
    window.electronAPI.sysSetIgnoreMouse(false);
  };

  // 鼠标离开可交互区域时重新启用穿透
  const handleMouseLeave = () => {
    console.log('[App] Mouse left interactive area - enabling click-through');
    window.electronAPI.sysSetIgnoreMouse(true);
  };

  return (
    <div className="w-screen h-screen overflow-hidden bg-transparent pointer-events-none">
      <Maid
        onClick={handleMaidClick}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      />

      {showUI && (
        <div className="pointer-events-auto" onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
          <ChatView />
          <PromptBar />

          {/* Settings Button */}
          <button
            onClick={handleOpenSettings}
            className="fixed top-4 right-4 p-2 bg-white/80 dark:bg-gray-800/80 rounded-lg shadow-lg hover:bg-white dark:hover:bg-gray-800 transition-colors z-40"
            aria-label="Open Settings"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}
