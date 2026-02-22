'use client';

import { useEffect, useRef, useState, type RefObject } from 'react';
import { snapToNearest } from './useSnapScroll';

interface SnapConfig {
  enabled: boolean;
  itemSelector?: string;
}

interface UseDragScrollOptions {
  enabled?: boolean;
  scrollSpeed?: number;
  dragThreshold?: number;
  snap?: SnapConfig;
}

interface UseDragScrollReturn<T extends HTMLElement> {
  containerRef: RefObject<T | null>;
  isDragging: boolean;
  hasDragged: boolean;
  handlers: {
    onMouseDown: (e: React.MouseEvent) => void;
    onMouseMove: (e: React.MouseEvent) => void;
    onMouseUp: () => void;
    onMouseLeave: () => void;
  };
}

export function useDragScroll<T extends HTMLElement = HTMLDivElement>({
  enabled = true,
  scrollSpeed = 2,
  dragThreshold = 5,
  snap,
}: UseDragScrollOptions = {}): UseDragScrollReturn<T> {
  const containerRef = useRef<T | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [hasDragged, setHasDragged] = useState(false);

  const dragStateRef = useRef({ startX: 0, scrollLeft: 0 });

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!enabled || !containerRef.current) return;

    setIsDragging(true);
    setHasDragged(false);
    dragStateRef.current = {
      startX: e.pageX - containerRef.current.offsetLeft,
      scrollLeft: containerRef.current.scrollLeft,
    };
    e.preventDefault();
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !containerRef.current) return;

    e.preventDefault();
    const x = e.pageX - containerRef.current.offsetLeft;
    const walk = (x - dragStateRef.current.startX) * scrollSpeed;

    if (Math.abs(walk) > dragThreshold) {
      setHasDragged(true);
    }

    containerRef.current.scrollLeft = dragStateRef.current.scrollLeft - walk;
  };

  const handleMouseUpOrLeave = () => {
    if (isDragging && snap?.enabled && containerRef.current && hasDragged) {
      snapToNearest(containerRef.current, snap.itemSelector);
    }
    setIsDragging(false);
  };

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !enabled) return;

    container.style.cursor = isDragging ? 'grabbing' : 'grab';
  }, [enabled, isDragging]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleClick = (e: MouseEvent) => {
      if (hasDragged) {
        e.stopPropagation();
        e.preventDefault();
        setHasDragged(false);
      }
    };

    container.addEventListener('click', handleClick, true);
    return () => container.removeEventListener('click', handleClick, true);
  }, [hasDragged]);

  return {
    containerRef,
    isDragging,
    hasDragged,
    handlers: {
      onMouseDown: handleMouseDown,
      onMouseMove: handleMouseMove,
      onMouseUp: handleMouseUpOrLeave,
      onMouseLeave: handleMouseUpOrLeave,
    },
  };
}
