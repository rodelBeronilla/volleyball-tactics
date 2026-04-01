import { useEffect, useRef } from 'react';

export function useSwipeGesture(elementRef, onSwipeLeft, onSwipeRight) {
  const touchStart = useRef(null);

  useEffect(() => {
    const el = elementRef.current;
    if (!el) return;

    const handleTouchStart = (e) => {
      if (e.touches.length === 1) {
        touchStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY, time: Date.now() };
      }
    };

    const handleTouchEnd = (e) => {
      if (!touchStart.current) return;
      const dx = e.changedTouches[0].clientX - touchStart.current.x;
      const dy = e.changedTouches[0].clientY - touchStart.current.y;
      const dt = Date.now() - touchStart.current.time;

      if (Math.abs(dx) > 50 && dt < 400 && Math.abs(dx) > Math.abs(dy) * 1.3) {
        if (dx > 0) onSwipeRight();
        else onSwipeLeft();
      }
      touchStart.current = null;
    };

    el.addEventListener('touchstart', handleTouchStart, { passive: true });
    el.addEventListener('touchend', handleTouchEnd, { passive: true });
    return () => {
      el.removeEventListener('touchstart', handleTouchStart);
      el.removeEventListener('touchend', handleTouchEnd);
    };
  }, [elementRef, onSwipeLeft, onSwipeRight]);
}
