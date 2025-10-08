import { useState, useCallback, useRef, useEffect } from 'react';

interface AudioQueueItem {
  id: string;
  url: string;
  text: string;
}

export function useAudioQueue() {
  const [queue, setQueue] = useState<AudioQueueItem[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentItem, setCurrentItem] = useState<AudioQueueItem | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const enqueue = useCallback((item: AudioQueueItem) => {
    setQueue((prev) => [...prev, item]);
  }, []);

  const dequeue = useCallback(() => {
    setQueue((prev) => prev.slice(1));
  }, []);

  const clear = useCallback(() => {
    setQueue([]);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = '';
    }
    setIsPlaying(false);
    setCurrentItem(null);
  }, []);

  const pause = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  }, []);

  const resume = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.play();
      setIsPlaying(true);
    }
  }, []);

  // Auto-play next item in queue
  useEffect(() => {
    if (!isPlaying && queue.length > 0) {
      const nextItem = queue[0];
      setCurrentItem(nextItem);

      if (!audioRef.current) {
        audioRef.current = new Audio();
      }

      audioRef.current.src = nextItem.url;
      audioRef.current.play();
      setIsPlaying(true);

      audioRef.current.onended = () => {
        dequeue();
        setIsPlaying(false);
        setCurrentItem(null);
      };

      audioRef.current.onerror = () => {
        console.error('Audio playback failed');
        dequeue();
        setIsPlaying(false);
        setCurrentItem(null);
      };
    }
  }, [queue, isPlaying, dequeue]);

  return {
    queue,
    currentItem,
    isPlaying,
    enqueue,
    clear,
    pause,
    resume,
  };
}
