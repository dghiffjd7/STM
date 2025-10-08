import { useEffect, useState, useRef } from 'react';
import { Maid } from './components/Maid';
import { PromptBar } from './components/PromptBar';
import { ChatView } from './components/ChatView';
import { useConfigStore } from './store';

export function App() {
  const { loadConfig } = useConfigStore();
  const [showUI, setShowUI] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadConfig();
  }, [loadConfig]);

  const handleOpenSettings = () => {
    window.electronAPI.sysOpenSettings();
  };

  const handleMaidClick = () => {
    setShowUI(!showUI);
  };

  // 监听鼠标移动，动态控制穿透
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    const container = containerRef.current;

    // 如果鼠标在根容器上（即透明背景区域），启用穿透
    if (target === container) {
      window.electronAPI.sysSetIgnoreMouse(true);
    } else {
      // 鼠标在桌宠或UI元素上，禁用穿透
      window.electronAPI.sysSetIgnoreMouse(false);
    }
  };

  return (
    <div
      ref={containerRef}
      className="w-screen h-screen overflow-hidden bg-transparent"
      onMouseMove={handleMouseMove}
    >
      <Maid onClick={handleMaidClick} />

      {showUI && (
        <>
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
        </>
      )}
    </div>
  );
}
