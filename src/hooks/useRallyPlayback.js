import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Custom hook for rally playback state machine.
 * Auto-advances touches when playing at the configured speed.
 */
export default function useRallyPlayback(totalTouches) {
  const [currentTouchIndex, setCurrentTouchIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const intervalRef = useRef(null);

  const clearTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  // Auto-advance when playing
  useEffect(() => {
    clearTimer();
    if (!isPlaying || totalTouches <= 0) return;

    const ms = 1500 / speed;
    intervalRef.current = setInterval(() => {
      setCurrentTouchIndex(prev => {
        if (prev >= totalTouches - 1) {
          setIsPlaying(false);
          return prev;
        }
        return prev + 1;
      });
    }, ms);

    return clearTimer;
  }, [isPlaying, speed, totalTouches, clearTimer]);

  // Stop playing if we reach the end
  useEffect(() => {
    if (currentTouchIndex >= totalTouches - 1 && isPlaying) {
      setIsPlaying(false);
    }
  }, [currentTouchIndex, totalTouches, isPlaying]);

  const goNext = useCallback(() => {
    setCurrentTouchIndex(prev => Math.min(prev + 1, totalTouches - 1));
  }, [totalTouches]);

  const goPrev = useCallback(() => {
    setCurrentTouchIndex(prev => Math.max(prev - 1, 0));
  }, []);

  const togglePlay = useCallback(() => {
    setIsPlaying(prev => {
      // If at end, restart from beginning
      if (!prev) {
        setCurrentTouchIndex(idx => (idx >= totalTouches - 1 ? 0 : idx));
      }
      return !prev;
    });
  }, [totalTouches]);

  const goToTouch = useCallback((index) => {
    setCurrentTouchIndex(Math.max(0, Math.min(index, totalTouches - 1)));
  }, [totalTouches]);

  return {
    currentTouchIndex,
    isPlaying,
    speed,
    goNext,
    goPrev,
    togglePlay,
    setSpeed,
    goToTouch,
  };
}
