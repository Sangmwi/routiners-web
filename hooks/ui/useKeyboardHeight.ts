'use client';

import { useState, useEffect } from 'react';

/**
 * 모바일 키보드 높이를 감지하는 훅
 * visualViewport API를 사용하여 키보드가 올라올 때 높이를 반환
 */
export function useKeyboardHeight() {
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.visualViewport) {
      return;
    }

    const viewport = window.visualViewport;

    const handleResize = () => {
      // visualViewport.height는 키보드가 올라오면 줄어듦
      const windowHeight = window.innerHeight;
      const viewportHeight = viewport.height;
      const diff = windowHeight - viewportHeight;

      // 100px 이상 차이나면 키보드가 올라온 것으로 판단
      if (diff > 100) {
        setKeyboardHeight(diff);
      } else {
        setKeyboardHeight(0);
      }
    };

    viewport.addEventListener('resize', handleResize);
    return () => viewport.removeEventListener('resize', handleResize);
  }, []);

  return keyboardHeight;
}
