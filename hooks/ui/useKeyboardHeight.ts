'use client';

import { useEffect } from 'react';

/**
 * 가용 화면 높이 감지 (키보드 대응)
 *
 * visualViewport.height는 키보드를 제외한 실제 가용 높이를 반환하므로,
 * 모든 환경(WebView, 일반 브라우저)에서 동일하게 동작한다.
 * --app-height CSS 변수로 설정하여 ChatLayout, Modal 등에서 사용.
 */
export function useKeyboardHeight() {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const viewport = window.visualViewport;
    if (!viewport) return;

    const updateHeight = () => {
      document.documentElement.style.setProperty(
        '--app-height',
        `${viewport.height}px`
      );
      // 키보드 열림으로 인한 html 스크롤 즉시 리셋
      if (window.scrollY > 0) {
        window.scrollTo(0, 0);
      }
    };

    // 초기값 설정
    updateHeight();

    viewport.addEventListener('resize', updateHeight);
    return () => viewport.removeEventListener('resize', updateHeight);
  }, []);
}
