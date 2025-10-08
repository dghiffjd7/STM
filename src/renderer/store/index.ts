import { create } from 'zustand';
import type { MaidState, LLMMessage, STMConfig } from '../../shared/types';
import { DEFAULT_CONFIG } from '../../shared/constants';

interface MaidStore {
  state: MaidState;
  setState: (state: MaidState) => void;
}

interface ChatStore {
  messages: LLMMessage[];
  isStreaming: boolean;
  addMessage: (message: LLMMessage) => void;
  updateLastMessage: (content: string) => void;
  setStreaming: (isStreaming: boolean) => void;
  clearMessages: () => void;
}

interface ConfigStore {
  config: STMConfig;
  loadConfig: () => Promise<void>;
  updateConfig: (config: Partial<STMConfig>) => Promise<void>;
}

export const useMaidStore = create<MaidStore>((set) => ({
  state: 'idle',
  setState: (state) => set({ state }),
}));

export const useChatStore = create<ChatStore>((set) => ({
  messages: [],
  isStreaming: false,
  addMessage: (message) =>
    set((state) => ({
      messages: [...state.messages, message],
    })),
  updateLastMessage: (content) =>
    set((state) => {
      const messages = [...state.messages];
      const lastMessage = messages[messages.length - 1];
      if (lastMessage && lastMessage.role === 'assistant') {
        lastMessage.content += content;
      }
      return { messages };
    }),
  setStreaming: (isStreaming) => set({ isStreaming }),
  clearMessages: () => set({ messages: [] }),
}));

export const useConfigStore = create<ConfigStore>((set) => ({
  config: DEFAULT_CONFIG,
  loadConfig: async () => {
    const config = await window.config?.get();
    if (config) set({ config });
  },
  updateConfig: async (newConfig) => {
    await window.config?.set(newConfig);
    const updated = await window.config?.get();
    if (updated) set({ config: updated });
  },
}));
 