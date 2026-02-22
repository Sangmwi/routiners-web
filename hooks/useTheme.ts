'use client';

/**
 * Theme Hook
 *
 * themeStore의 mode 설정에 따라 <html> 요소에 data-theme 속성을 적용합니다.
 * - 'light' / 'dark' → data-theme="light" / "dark"
 * - 'system' → OS 테마를 resolve하여 data-theme="light" / "dark" 적용
 *
 * 항상 data-theme을 설정하므로 CSS에서 @media (prefers-color-scheme) 중복 불필요
 */

import { useEffect, useState } from 'react';
import { useThemeStore, type ThemeMode } from '@/lib/stores/themeStore';

function getSystemTheme(): 'light' | 'dark' {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light';
}

function getResolvedTheme(mode: ThemeMode): 'light' | 'dark' {
  return mode === 'system' ? getSystemTheme() : mode;
}

export function useTheme() {
  const mode = useThemeStore((s) => s.mode);
  const setMode = useThemeStore((s) => s.setMode);
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>(() =>
    getResolvedTheme(mode),
  );

  // 항상 data-theme을 설정 (system 모드 포함)
  useEffect(() => {
    const resolved = getResolvedTheme(mode);
    setResolvedTheme(resolved);
    document.documentElement.setAttribute('data-theme', resolved);
  }, [mode]);

  // system 모드일 때 OS 설정 변경 실시간 반영
  useEffect(() => {
    if (mode !== 'system') return;

    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => {
      const resolved = getSystemTheme();
      setResolvedTheme(resolved);
      document.documentElement.setAttribute('data-theme', resolved);
    };

    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [mode]);

  return { mode, setMode, resolvedTheme };
}
