import { useEffect, useRef, useState } from 'react';
import { motion, useMotionValue, useTransform } from 'framer-motion';
import { useMaidState } from '../hooks/useMaidState';

interface MaidProps {
  onClick?: () => void;
}

export function Maid({ onClick }: MaidProps) {
  const { state, setState } = useMaidState();
  const [isDragging, setIsDragging] = useState(false);
  const constraintsRef = useRef<HTMLDivElement>(null);

  const x = useMotionValue(0);
  const y = useMotionValue(0);

  // Simple rotation based on drag
  const rotate = useTransform(x, [-100, 100], [-5, 5]);

  useEffect(() => {
    if (isDragging) {
      setState('drag');
    } else if (state === 'drag') {
      setState('idle');
    }
  }, [isDragging, state, setState]);

  const handleClick = (e: React.MouseEvent) => {
    if (!isDragging && onClick) {
      onClick();
    }
  };

  return (
    <div ref={constraintsRef} className="fixed inset-0 pointer-events-none">
      <motion.div
        drag
        dragConstraints={constraintsRef}
        dragElastic={0.1}
        dragTransition={{ bounceStiffness: 300, bounceDamping: 20 }}
        onDragStart={() => setIsDragging(true)}
        onDragEnd={() => setIsDragging(false)}
        onHoverStart={() => !isDragging && setState('hover')}
        onHoverEnd={() => !isDragging && setState('idle')}
        onClick={handleClick}
        style={{ x, y, rotate }}
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-auto cursor-grab active:cursor-grabbing"
      >
        <div className="relative w-48 h-48">
          {/* Placeholder maid sprite - replace with actual artwork */}
          <div
            className={`w-full h-full rounded-full flex items-center justify-center text-white font-bold text-4xl transition-all duration-300 ${
              state === 'idle'
                ? 'bg-gradient-to-br from-pink-400 to-purple-500'
                : state === 'hover'
                ? 'bg-gradient-to-br from-pink-500 to-purple-600 scale-110'
                : state === 'drag'
                ? 'bg-gradient-to-br from-pink-300 to-purple-400 scale-95'
                : state === 'speak'
                ? 'bg-gradient-to-br from-blue-400 to-cyan-500 animate-pulse'
                : state === 'think'
                ? 'bg-gradient-to-br from-yellow-400 to-orange-500'
                : state === 'error'
                ? 'bg-gradient-to-br from-red-400 to-pink-500'
                : 'bg-gradient-to-br from-gray-400 to-gray-600'
            }`}
          >
            <span className="select-none">
              {state === 'idle' && '😊'}
              {state === 'hover' && '😄'}
              {state === 'drag' && '😮'}
              {state === 'speak' && '💬'}
              {state === 'think' && '🤔'}
              {state === 'error' && '😵'}
              {state === 'sleep' && '😴'}
            </span>
          </div>

          {/* State label for debugging */}
          <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-xs text-gray-600 bg-white/80 px-2 py-1 rounded">
            {state}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
