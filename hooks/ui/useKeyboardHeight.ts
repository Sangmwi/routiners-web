'use client';

import { useEffect } from 'react';

/**
 * 키보드 높이 감지 (일반 모바일 브라우저 폴백)
 *
 * 네이티브 WebView 환경에서는 bridge(KEYBOARD_SHOW/HIDE)가 --keyboard-height를 설정하므로,
 * 이 훅은 일반 모바일 브라우저에서만 VisualViewport API로 키보드 높이를 감지합니다.
 */
export function useKeyboardHeight() {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // 네이티브 WebView 환경이면 bridge가 처리 → skip
    if ((window as { ReactNativeWebView?: unknown }).ReactNativeWebView) return;

    const viewport = window.visualViewport;
    if (!viewport) return;

    const handleResize = () => {
      const keyboardHeight = window.innerHeight - viewport.height;

      // 100px 이상 차이나야 키보드로 판단 (주소창 축소 등과 구분)
      if (keyboardHeight > 100) {
        document.documentElement.style.setProperty(
          '--keyboard-height',
          `${keyboardHeight}px`
        );
      } else {
        document.documentElement.style.setProperty('--keyboard-height', '0px');
      }
    };

    viewport.addEventListener('resize', handleResize);
    return () => viewport.removeEventListener('resize', handleResize);
  }, []);
}
