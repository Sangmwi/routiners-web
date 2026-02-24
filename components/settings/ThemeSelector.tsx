'use client';

import { useTheme } from '@/hooks/useTheme';
import type { ThemeMode } from '@/lib/stores/themeStore';

const THEME_OPTIONS: { value: ThemeMode; label: string }[] = [
  { value: 'light', label: '라이트' },
  { value: 'dark', label: '다크' },
  { value: 'system', label: '시스템' },
];

export default function ThemeSelector() {
  const { mode, setMode } = useTheme();

  return (
    <div className="flex gap-1.5 bg-surface-hover rounded-xl p-1.5">
      {THEME_OPTIONS.map((option) => (
        <button
          key={option.value}
          onClick={() => setMode(option.value)}
          className={`flex-1 py-2.5 px-4 whitespace-nowrap rounded-lg text-xs font-medium transition-all ${
            mode === option.value
              ? 'bg-card text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
