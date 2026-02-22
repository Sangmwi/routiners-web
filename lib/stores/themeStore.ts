/**
 * Theme Store (Zustand)
 *
 * 테마 상태 관리 (light / dark / system)
 * localStorage에 영속화하여 새로고침 시에도 유지
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// ============================================================================
// Types
// ============================================================================

export type ThemeMode = 'light' | 'dark' | 'system';

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
