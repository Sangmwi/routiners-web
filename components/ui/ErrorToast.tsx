'use client';

import { useEffect } from 'react';
import { ErrorIcon, CloseIcon } from '@/components/ui/icons';

interface ErrorToastProps {
  message: string;
  onClose: () => void;
  duration?: number;
}

export default function ErrorToast({ message, onClose, duration = 5000 }: ErrorToastProps) {
  useEffect(() => {
    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [onClose, duration]);

  return (
    <div className="fixed bottom-20 left-4 right-4 z-50 animate-in slide-in-from-bottom-4 fade-in duration-200">
      <div className="bg-destructive text-destructive-foreground px-4 py-3 rounded-lg shadow-lg flex items-start gap-3">
        <ErrorIcon size="md" className="shrink-0 mt-0.5" />
        <p className="text-sm flex-1">{message}</p>
        <button
          type="button"
          onClick={onClose}
          className="shrink-0 hover:opacity-80"
        >
          <CloseIcon size="sm" />
        </button>
      </div>
    </div>
  );
}
