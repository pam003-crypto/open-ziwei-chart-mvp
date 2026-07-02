"use client";

import { useCallback, useRef, type TouchEventHandler } from "react";

type DoubleTapHandlers = {
  onTouchStart: TouchEventHandler<HTMLElement>;
  onTouchMove: TouchEventHandler<HTMLElement>;
  onTouchEnd: TouchEventHandler<HTMLElement>;
};

export function useDoubleTap(
  onDoubleTap: () => void,
  delay = 300,
): DoubleTapHandlers {
  const lastTapAtRef = useRef(0);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const movedRef = useRef(false);

  const onTouchStart = useCallback<TouchEventHandler<HTMLElement>>((event) => {
    const touch = event.touches[0];

    if (!touch) {
      return;
    }

    touchStartRef.current = { x: touch.clientX, y: touch.clientY };
    movedRef.current = false;
  }, []);

  const onTouchMove = useCallback<TouchEventHandler<HTMLElement>>((event) => {
    const touch = event.touches[0];
    const start = touchStartRef.current;

    if (!touch || !start) {
      return;
    }

    if (
      Math.abs(touch.clientX - start.x) > 10 ||
      Math.abs(touch.clientY - start.y) > 10
    ) {
      movedRef.current = true;
    }
  }, []);

  const onTouchEnd = useCallback<TouchEventHandler<HTMLElement>>(
    (event) => {
      if (movedRef.current) {
        lastTapAtRef.current = 0;
        return;
      }

      const now = Date.now();

      if (now - lastTapAtRef.current < delay) {
        lastTapAtRef.current = 0;
        event.preventDefault();
        onDoubleTap();
        return;
      }

      lastTapAtRef.current = now;
    },
    [delay, onDoubleTap],
  );

  return { onTouchStart, onTouchMove, onTouchEnd };
}
