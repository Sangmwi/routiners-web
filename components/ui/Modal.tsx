'use client';

import { useEffect, ReactNode } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  /** 모달 크기 */
  size?: 'sm' | 'md' | 'lg' | 'full';
  /** 닫기 버튼 표시 여부 */
  showCloseButton?: boolean;
  /** 배경 클릭으로 닫기 허용 여부 */
  closeOnBackdrop?: boolean;
  /** ESC 키로 닫기 허용 여부 */
  closeOnEsc?: boolean;
  /** 추가 클래스 */
  className?: string;
  /** 헤더 추가 액션 */
  headerAction?: ReactNode;
  /** 모달 위치: bottom(하단 시트), center(중앙) */
  position?: 'bottom' | 'center';
}

// 모바일: 전체 폭, 데스크톱: 사이즈별 max-width
const sizeClasses = {
  sm: 'sm:max-w-sm',
  md: 'sm:max-w-md',
  lg: 'sm:max-w-lg',
  full: 'sm:max-w-full sm:mx-4',
};

export default function Modal({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  showCloseButton = true,
  closeOnBackdrop = true,
  closeOnEsc = true,
  className = '',
  headerAction,
  position = 'center',
}: ModalProps) {
  const isBottom = position === 'bottom';
  const isCenter = position === 'center';

  // ESC 키 핸들러
  const handleEsc = (e: KeyboardEvent) => {
    if (e.key === 'Escape' && closeOnEsc) {
      onClose();
    }
  };

  // 배경 클릭 핸들러
  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget && closeOnBackdrop) {
      onClose();
    }
  };

  // ESC 키 이벤트 등록
  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleEsc);
      // 모달 오픈 시 스크롤 방지
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, handleEsc]);

  if (!isOpen) return null;

  // 위치별 스타일
  const containerPositionClass = isBottom
    ? 'items-end' // 하단 시트
    : 'items-center'; // 중앙
  const modalPositionClass = isBottom
    ? 'rounded-t-2xl sm:rounded-2xl animate-in slide-in-from-bottom-4 duration-200'
    : 'rounded-2xl animate-in zoom-in-95 duration-200 mx-4';

  return (
    <div
      className={`fixed min-h-screen inset-0 z-60 flex ${containerPositionClass} justify-center`}
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? 'modal-title' : undefined}
    >
      {/* 배경 오버레이 */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200" />

      {/* 모달 컨텐츠 */}
      <div
        className={`relative w-full bg-card shadow-xl max-h-[90vh] flex flex-col ${modalPositionClass} ${sizeClasses[size]} ${className}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 모바일 드래그 핸들 - 하단 시트일 때만 */}
        {isBottom && (
          <div className="sm:hidden flex justify-center pt-2 pb-1">
            <div className="w-10 h-1 bg-muted-foreground/30 rounded-full" />
          </div>
        )}

        {/* 헤더 */}
        {(title || showCloseButton) && (
          <div className="flex items-center justify-between px-4 py-3 border-b border-border/50">
            {title && (
              <h2
                id="modal-title"
                className="text-lg font-semibold text-card-foreground"
              >
                {title}
              </h2>
            )}
            <div className="flex items-center gap-2">
              {headerAction}
              {showCloseButton && (
                <button
                  onClick={onClose}
                  className="p-1.5 rounded-lg hover:bg-muted/50 transition-colors"
                  aria-label="닫기"
                >
                  <X className="w-5 h-5 text-muted-foreground" />
                </button>
              )}
            </div>
          </div>
        )}

        {/* 컨텐츠 */}
        <div className="flex-1 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}

// 모달 푸터 컴포넌트
interface ModalFooterProps {
  children: ReactNode;
  className?: string;
}

export function ModalFooter({ children, className = '' }: ModalFooterProps) {
  return (
    <div
      className={`flex gap-3 px-4 py-4 border-t border-border/50 bg-card ${className}`}
    >
      {children}
    </div>
  );
}

// 모달 바디 컴포넌트
interface ModalBodyProps {
  children: ReactNode;
  className?: string;
}

export function ModalBody({ children, className = '' }: ModalBodyProps) {
  return <div className={`p-4 ${className}`}>{children}</div>;
}
