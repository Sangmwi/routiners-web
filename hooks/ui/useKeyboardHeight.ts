'use client';

import { useEffect } from 'react';

/**
 * 가용 화면 높이 감지 (키보드 대응)
 *
 * visualViewport.height는 키보드를 제외한 실제 가용 높이를 반환하므로,
 * 모든 환경(WebView, 일반 브라우저)에서 동일하게 동작한다.
 * --app-height CSS 변수로 설정하여 ChatLayout, Modal 등에서 사용.
 *
 * 키보드가 열리면 html 요소를 가시 영역으로 제약하여
 * Android edge-to-edge 모드의 네이티브 팬(스크롤)을 방지한다.
 */
export function useKeyboardHeight() {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const viewport = window.visualViewport;
    if (!viewport) return;

    let savedScrollY = 0;
    let wasKeyboardOpen = false;

    const updateHeight = () => {
      const newHeight = viewport.height;
      document.documentElement.style.setProperty(
        '--app-height',
        `${newHeight}px`
      );

      // 키보드 열림 감지: 가시 영역이 전체 뷰포트보다 150px 이상 작으면 키보드 열림
      const isKeyboardOpen = newHeight < window.innerHeight - 150;

      if (isKeyboardOpen) {
        if (!wasKeyboardOpen) {
          // 키보드가 막 열림 — 현재 스크롤 위치 저장
          savedScrollY = window.scrollY;
        }
        // html 요소를 가시 영역으로 제약 → document 스크롤 불가 → 네이티브 팬 방지
        document.documentElement.style.overflow = 'hidden';
        document.documentElement.style.height = `${newHeight}px`;
        wasKeyboardOpen = true;
      } else if (wasKeyboardOpen) {
        // 키보드가 닫힘 — html 제약 해제 + 스크롤 위치 복원
        document.documentElement.style.overflow = '';
        document.documentElement.style.height = '';
        window.scrollTo(0, savedScrollY);
        wasKeyboardOpen = false;
      }
    };

    // 초기값 설정
    updateHeight();

    viewport.addEventListener('resize', updateHeight);
    return () => {
      viewport.removeEventListener('resize', updateHeight);
      // 클린업: html 제약 해제
      document.documentElement.style.overflow = '';
      document.documentElement.style.height = '';
    };
  }, []);
}
