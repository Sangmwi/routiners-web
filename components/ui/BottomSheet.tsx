'use client';

import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  /** 시트 높이: 'auto' | 'half' | 'full' */
  height?: 'auto' | 'half' | 'full';
}

/**
 * BottomSheet
 *
 * Android/iOS 스타일 바텀시트 컴포넌트
 * - 터치 친화적 (48px+ 터치 영역)
 * - 백드롭 클릭으로 닫기
 * - CSS transition 애니메이션
 */
export function BottomSheet({
  isOpen,
  onClose,
  title,
  children,
  height = 'auto',
}: BottomSheetProps) {
  const sheetRef = useRef<HTMLDivElement>(null);

  // ESC 키로 닫기
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  // 스크롤 방지
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const heightClass = {
    auto: 'max-h-[85vh]',
    half: 'h-[50vh]',
    full: 'h-[90vh]',
  }[height];

  return (
    <>
      {/* Backdrop */}
      <div
        className={`
          fixed inset-0 z-50 bg-black/50 backdrop-blur-sm
          transition-opacity duration-300
          ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}
        `}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Sheet */}
      <div
        ref={sheetRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`
          fixed bottom-0 left-0 right-0 z-50
          bg-card rounded-t-3xl shadow-2xl
          transition-transform duration-300 ease-out
          ${isOpen ? 'translate-y-0' : 'translate-y-full'}
          ${heightClass}
          flex flex-col
        `}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-10 h-1 bg-muted-foreground/30 rounded-full" />
        </div>

        {/* Header */}
        {title && (
          <div className="flex items-center justify-between px-6 pb-4 border-b border-border">
            <h2 className="text-lg font-semibold text-foreground">{title}</h2>
            <button
              onClick={onClose}
              className="p-2 -mr-2 rounded-full hover:bg-muted active:bg-muted/80 transition-colors"
              aria-label="닫기"
            >
              <X className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto overscroll-contain px-6 py-4">
          {children}
        </div>
      </div>
    </>
  );
}
