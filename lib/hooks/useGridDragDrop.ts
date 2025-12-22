'use client';

import { useState, useRef, useEffect, useCallback } from 'react';

interface UseGridDragDropOptions<T> {
  items: (T | null)[];
  onReorder: (fromIndex: number, toIndex: number) => void;
  canDrag?: (index: number) => boolean;
  canDrop?: (index: number) => boolean;
}

interface UseGridDragDropReturn {
  // State
  draggedIndex: number | null;
  dragOverIndex: number | null;
  longPressIndex: number | null;
  touchDragIndex: number | null;
  isMobile: boolean;

  // Refs
  gridRef: React.RefObject<HTMLDivElement | null>;

  // Desktop handlers
  handleDragStart: (e: React.DragEvent, index: number) => void;
  handleDragOver: (e: React.DragEvent, index: number) => void;
  handleDragLeave: () => void;
  handleDrop: (e: React.DragEvent, dropIndex: number) => void;
  handleDragEnd: () => void;

  // Touch handlers
  handleTouchStart: (e: React.TouchEvent, index: number) => void;
  handleTouchMove: (e: React.TouchEvent) => void;
  handleTouchEnd: () => void;
  handleTouchCancel: () => void;

  // Utility
  resetLongPress: () => void;
}

export function useGridDragDrop<T>({
  items,
  onReorder,
  canDrag = () => true,
  canDrop = (index) => !!items[index],
}: UseGridDragDropOptions<T>): UseGridDragDropReturn {
  // State
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [longPressIndex, setLongPressIndex] = useState<number | null>(null);
  const [touchDragIndex, setTouchDragIndex] = useState<number | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  // Refs
  const gridRef = useRef<HTMLDivElement>(null);
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

  // 모바일 감지
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile('ontouchstart' in window || navigator.maxTouchPoints > 0);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // 터치 드래그 중 스크롤 방지
  useEffect(() => {
    const grid = gridRef.current;
    if (!grid) return;

    const preventScroll = (e: TouchEvent) => {
      if (touchDragIndex !== null) {
        e.preventDefault();
      }
    };

    grid.addEventListener('touchmove', preventScroll, { passive: false });
    return () => grid.removeEventListener('touchmove', preventScroll);
  }, [touchDragIndex]);

  // Desktop Drag & Drop
  const handleDragStart = useCallback((e: React.DragEvent, index: number) => {
    if (!canDrag(index)) return;
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', index.toString());
  }, [canDrag]);

  const handleDragOver = useCallback(
    (e: React.DragEvent, index: number) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      if (draggedIndex !== null && draggedIndex !== index && canDrop(index)) {
        setDragOverIndex(index);
      }
    },
    [draggedIndex, canDrop]
  );

  const handleDragLeave = useCallback(() => {
    setDragOverIndex(null);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent, dropIndex: number) => {
      e.preventDefault();
      const fromIndex = draggedIndex;
      setDraggedIndex(null);
      setDragOverIndex(null);

      if (fromIndex !== null && fromIndex !== dropIndex && canDrop(dropIndex)) {
        onReorder(fromIndex, dropIndex);
      }
    },
    [draggedIndex, canDrop, onReorder]
  );

  const handleDragEnd = useCallback(() => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  }, []);

  // Mobile Touch
  const handleTouchStart = useCallback((e: React.TouchEvent, index: number) => {
    if (!canDrag(index)) return;

    const touch = e.touches[0];
    touchStartRef.current = { x: touch.clientX, y: touch.clientY };

    longPressTimerRef.current = setTimeout(() => {
      setLongPressIndex(index);
      setTouchDragIndex(index);
      if ('vibrate' in navigator) {
        navigator.vibrate(50);
      }
    }, 500);
  }, [canDrag]);

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (!touchStartRef.current) return;

      const touch = e.touches[0];
      const deltaX = Math.abs(touch.clientX - touchStartRef.current.x);
      const deltaY = Math.abs(touch.clientY - touchStartRef.current.y);

      // 움직임 감지 시 long press 취소
      if (deltaX > 10 || deltaY > 10) {
        if (longPressTimerRef.current) {
          clearTimeout(longPressTimerRef.current);
          longPressTimerRef.current = null;
        }
      }

      // 터치 드래그 중이면 드롭 대상 찾기
      if (touchDragIndex !== null && gridRef.current) {
        const gridItems = gridRef.current.children;
        let foundTarget = false;

        for (let i = 0; i < gridItems.length; i++) {
          const item = gridItems[i] as HTMLElement;
          const rect = item.getBoundingClientRect();

          if (
            touch.clientX >= rect.left &&
            touch.clientX <= rect.right &&
            touch.clientY >= rect.top &&
            touch.clientY <= rect.bottom
          ) {
            if (i !== touchDragIndex && canDrop(i)) {
              setDragOverIndex(i);
            } else {
              setDragOverIndex(null);
            }
            foundTarget = true;
            break;
          }
        }

        if (!foundTarget) {
          setDragOverIndex(null);
        }
      }
    },
    [touchDragIndex, canDrop]
  );

  const handleTouchEnd = useCallback(() => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
    touchStartRef.current = null;

    const fromIndex = touchDragIndex;
    const toIndex = dragOverIndex;

    setTouchDragIndex(null);
    setDragOverIndex(null);
    setLongPressIndex(null);

    if (fromIndex !== null && toIndex !== null && fromIndex !== toIndex) {
      onReorder(fromIndex, toIndex);
    }
  }, [touchDragIndex, dragOverIndex, onReorder]);

  const handleTouchCancel = useCallback(() => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
    touchStartRef.current = null;
    setTouchDragIndex(null);
    setDragOverIndex(null);
    setLongPressIndex(null);
  }, []);

  const resetLongPress = useCallback(() => {
    setLongPressIndex(null);
  }, []);

  return {
    // State
    draggedIndex,
    dragOverIndex,
    longPressIndex,
    touchDragIndex,
    isMobile,

    // Refs
    gridRef,

    // Desktop handlers
    handleDragStart,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleDragEnd,

    // Touch handlers
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    handleTouchCancel,

    // Utility
    resetLongPress,
  };
}
