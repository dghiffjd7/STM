import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useChatStore } from '../store';

export function ChatView() {
  const { messages } = useChatStore();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (messages.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 w-96 max-h-[600px] overflow-y-auto bg-white/90 backdrop-blur-sm rounded-2xl shadow-2xl p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800">Chat History</h3>
        <button
          onClick={() => useChatStore.getState().clearMessages()}
          className="text-sm text-gray-500 hover:text-red-500 transition-colors"
        >
          Clear
        </button>
      </div>

      <div className="space-y-4">
        <AnimatePresence>
          {messages.map((message, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] px-4 py-2 rounded-2xl ${
                  message.role === 'user'
                    ? 'bg-gradient-to-r from-pink-500 to-purple-500 text-white'
                    : 'bg-gray-100 text-gray-800'
                }`}
              >
                <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
}
