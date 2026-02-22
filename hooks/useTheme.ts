'use client';

/**
 * Theme Hook
 *
 * - 'light'  → data-theme="light" (OS 다크여도 라이트 강제)
 * - 'dark'   → data-theme="dark"  (OS 라이트여도 다크 강제)
 * - 'system' → OS 감지 후 data-theme="light"|"dark" 설정 + 변경 실시간 반영
 */

import { useEffect } from 'react';
import { useThemeStore, type ThemeMode } from '@/lib/stores/themeStore';

function getSystemTheme(): 'light' | 'dark' {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function applyTheme(mode: ThemeMode) {
  const resolved = mode === 'system' ? getSystemTheme() : mode;
  document.documentElement.setAttribute('data-theme', resolved);
}

export function useTheme() {
  const mode = useThemeStore((s) => s.mode);
  const setMode = useThemeStore((s) => s.setMode);

  useEffect(() => {
    applyTheme(mode);
  }, [mode]);

  // system 모드일 때 OS 변경 실시간 반영
  useEffect(() => {
    if (mode !== 'system') return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => applyTheme('system');
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [mode]);

  return { mode, setMode };
}
