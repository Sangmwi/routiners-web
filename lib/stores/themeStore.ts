/**
 * Theme Store (Zustand)
 *
 * 테마 상태 관리 (light / dark / system)
 * localStorage에 영속화하여 새로고침 시에도 유지
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ThemeMode } from '@sauhi/shared-contracts';
export type { ThemeMode } from '@sauhi/shared-contracts';

// ============================================================================
// Types
// ============================================================================

interface ThemeState {
  mode: ThemeMode;
}

interface ThemeActions {
  setMode: (mode: ThemeMode) => void;
}

type ThemeStore = ThemeState & ThemeActions;

// ============================================================================
// Store
// ============================================================================

export const useThemeStore = create<ThemeStore>()(
  persist(
    (set) => ({
      mode: 'system',
      setMode: (mode) => set({ mode }),
    }),
    {
      name: 'routiners-theme',
    }
  )
);

// ============================================================================
// Convenience Hooks
// ============================================================================

/** 현재 테마 모드 반환 */
export const useThemeMode = () => useThemeStore((s) => s.mode);

/** 테마 모드 변경 액션 반환 */
export const useSetTheme = () => useThemeStore((s) => s.setMode);
