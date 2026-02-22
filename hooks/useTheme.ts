'use client';

/**
 * Theme Hook
 *
 * themeStore의 mode 설정에 따라 <html> 요소에 data-theme 속성을 적용합니다.
 * - 'light' / 'dark' → data-theme="light" / "dark"
 * - 'system' → data-theme 제거 (CSS prefers-color-scheme 미디어쿼리에 위임)
 *
 * WebView 환경에서는 SET_THEME postMessage로 네이티브 상태바 동기화 가능
 */

import { useEffect } from 'react';
import { useThemeStore, type ThemeMode } from '@/lib/stores/themeStore';

function getSystemTheme(): 'light' | 'dark' {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light';
}

/**
 * 현재 적용 중인 테마를 반환 (resolved)
 */
function getResolvedTheme(mode: ThemeMode): 'light' | 'dark' {
  return mode === 'system' ? getSystemTheme() : mode;
}

export function useTheme() {
  const mode = useThemeStore((s) => s.mode);
  const setMode = useThemeStore((s) => s.setMode);

  useEffect(() => {
    const html = document.documentElement;

    if (mode === 'system') {
      html.removeAttribute('data-theme');
    } else {
      html.setAttribute('data-theme', mode);
    }
  }, [mode]);

  // system 모드일 때 OS 설정 변경 감지
  useEffect(() => {
    if (mode !== 'system') return;

    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => {
      // system 모드에서는 data-theme 없이 CSS 미디어쿼리에 위임
      // 별도 처리 불필요 — 브라우저가 자동 적용
    };

    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [mode]);

  return {
    mode,
    setMode,
    resolvedTheme: getResolvedTheme(mode),
  };
}
