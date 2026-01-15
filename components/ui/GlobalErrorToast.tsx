'use client';

import { AlertCircle, X } from 'lucide-react';
import { useErrorStore } from '@/lib/stores/errorStore';

/**
 * 전역 에러 토스트
 *
 * App 레이아웃에서 한 번만 렌더링
 * useShowError() 훅으로 어디서든 에러 표시 가능
 */
export default function GlobalErrorToast() {
  const message = useErrorStore((state) => state.message);
  const clearError = useErrorStore((state) => state.clearError);

  if (!message) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 z-50 animate-in slide-in-from-bottom-4 fade-in duration-200">
      <div className="bg-destructive text-destructive-foreground px-4 py-3 rounded-lg shadow-lg flex items-start gap-3">
        <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
        <p className="text-sm flex-1">{message}</p>
        <button
          type="button"
          onClick={clearError}
          className="shrink-0 hover:opacity-80"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
