'use client';

import { useEffect, useRef, ReactNode } from 'react';
import { X } from 'lucide-react';

// ============================================================================
// Types
// ============================================================================

interface ModalBaseProps {
  /** 모달 표시 여부 */
  isOpen: boolean;
  /** 모달 닫기 핸들러 */
  onClose: () => void;
  /** 모달 제목 */
  title?: string;
  /** 모달 내용 */
  children: ReactNode;
  /** 닫기 버튼 표시 여부 */
  showCloseButton?: boolean;
  /** 배경 클릭 시 닫기 */
  closeOnBackdrop?: boolean;
  /** ESC 키로 닫기 */
  closeOnEscape?: boolean;
  /** 모달 크기 */
  size?: 'sm' | 'md' | 'lg' | 'full';
  /** 추가 클래스 */
  className?: string;
}

// ============================================================================
// Component
// ============================================================================

/**
 * 모달 기본 컴포넌트
 *
 * 모든 모달의 기반이 되는 컴포넌트
 * 백드롭, 애니메이션, 키보드 핸들링 포함
 */
export default function ModalBase({
  isOpen,
  onClose,
  title,
  children,
  showCloseButton = true,
  closeOnBackdrop = true,
  closeOnEscape = true,
  size = 'md',
  className = '',
}: ModalBaseProps) {
  const modalRef = useRef<HTMLDivElement>(null);

  // ESC 키 핸들링
  useEffect(() => {
    if (!closeOnEscape || !isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, closeOnEscape, onClose]);

  // 스크롤 잠금
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

  // 포커스 트랩
  useEffect(() => {
    if (!isOpen || !modalRef.current) return;

    const focusableElements = modalRef.current.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

    if (focusableElements.length > 0) {
      (focusableElements[0] as HTMLElement).focus();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // 크기별 스타일
  const sizeStyles = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    full: 'max-w-full mx-4',
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? 'modal-title' : undefined}
    >
      {/* 백드롭 */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
        onClick={closeOnBackdrop ? onClose : undefined}
        aria-hidden="true"
      />

      {/* 모달 컨텐츠 */}
      <div
        ref={modalRef}
        className={`
          relative z-10 w-full ${sizeStyles[size]}
          rounded-2xl bg-card shadow-xl
          animate-in fade-in zoom-in-95 duration-200
          ${className}
        `}
      >
        {/* 헤더 */}
        {(title || showCloseButton) && (
          <div className="flex items-center justify-between border-b border-border px-6 py-4">
            {title && (
              <h2
                id="modal-title"
                className="text-lg font-semibold text-foreground"
              >
                {title}
              </h2>
            )}
            {showCloseButton && (
              <button
                type="button"
                onClick={onClose}
                className="rounded-full p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                aria-label="닫기"
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </div>
        )}

        {/* 내용 */}
        <div className="px-6 py-4">{children}</div>
      </div>
    </div>
  );
}
