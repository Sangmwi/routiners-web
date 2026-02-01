'use client';

import { useEffect, useRef, useState, ReactNode } from 'react';
import { CloseIcon } from '@/components/ui/icons';
import {
  useModalState,
  useSwipeGesture,
  useBodyScrollLock,
  useEscapeKey,
} from '@/hooks/ui';

// ============================================================================
// Types
// ============================================================================

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'full';
  showCloseButton?: boolean;
  closeOnBackdrop?: boolean;
  closeOnEsc?: boolean;
  className?: string;
  headerAction?: ReactNode;
  position?: 'bottom' | 'center';
  enableSwipe?: boolean;
  swipeThreshold?: number;
  height?: 'auto' | 'half' | 'full';
}

// ============================================================================
// Constants
// ============================================================================

const ANIMATION_DURATION = 200;

const SIZE_CLASSES = {
  sm: 'sm:max-w-sm',
  md: 'sm:max-w-md',
  lg: 'sm:max-w-lg',
  full: 'sm:max-w-full sm:mx-4',
} as const;

const HEIGHT_CLASSES = {
  auto: 'max-h-[85vh]',
  half: 'h-[50vh]',
  full: 'h-[90vh]',
} as const;

// ============================================================================
// Animation Helpers
// ============================================================================

function getModalAnimationClass(
  isBottom: boolean,
  isAnimating: boolean,
  isSwipeClosing: boolean,
  isSnappingBack: boolean,
  hasOpened: boolean,
  isDragging: boolean,
  hasEverDragged: boolean
): string {
  const baseClass = isBottom
    ? 'rounded-t-3xl sm:rounded-2xl'
    : 'rounded-2xl mx-4';

  if (isSwipeClosing) return baseClass;

  if (isAnimating) {
    return isBottom
      ? `${baseClass} animate-out slide-out-to-bottom duration-200`
      : `${baseClass} animate-out zoom-out-95 fade-out duration-200`;
  }

  // 한 번이라도 드래그했으면 애니메이션 재실행 방지
  if (hasOpened || isDragging || isSnappingBack || hasEverDragged) return baseClass;

  return isBottom
    ? `${baseClass} animate-in slide-in-from-bottom duration-300`
    : `${baseClass} animate-in zoom-in-95 duration-200`;
}

function getBackdropAnimationClass(
  isAnimating: boolean,
  isSwipeClosing: boolean,
  hasOpened: boolean
): string {
  if (isSwipeClosing || isAnimating) return 'animate-out fade-out duration-200';
  if (hasOpened) return '';
  return 'animate-in fade-in duration-200';
}

function getSwipeTransform(
  isSwipeClosing: boolean,
  isSnappingBack: boolean,
  isDragging: boolean,
  deltaY: number,
  hasOpened: boolean,
  hasEverDragged: boolean
): React.CSSProperties | undefined {
  // 스와이프로 닫히는 중
  if (isSwipeClosing) {
    return {
      transform: 'translateY(100%)',
      transition: `transform ${ANIMATION_DURATION}ms ease-out`,
    };
  }

  // 임계치 미달로 복귀 중 (스냅백 애니메이션)
  if (isSnappingBack) {
    return {
      transform: 'translateY(0)',
      transition: `transform ${ANIMATION_DURATION}ms ease-out`,
      animation: 'none',
    };
  }

  // 드래그 중
  if (isDragging && deltaY > 0) {
    return {
      transform: `translateY(${deltaY}px)`,
      transition: 'none',
      animation: 'none',
    };
  }

  // 이미 열린 상태 또는 드래그 경험 있으면 위치 고정 + 애니메이션 명시적 비활성화
  if (hasOpened || hasEverDragged) {
    return {
      transform: 'translateY(0)',
      animation: 'none',
    };
  }

  // 초기 오픈 애니메이션: CSS가 처리
  return undefined;
}

// ============================================================================
// Modal Component
// ============================================================================

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
  enableSwipe = false,
  swipeThreshold = 100,
  height = 'auto',
}: ModalProps) {
  const isBottom = position === 'bottom';
  const modalRef = useRef<HTMLDivElement>(null);

  // 모달 상태 관리
  const { isVisible, isAnimating, hasOpened, executeClose } = useModalState(
    isOpen,
    onClose
  );

  // 스와이프 제스처
  const swipe = useSwipeGesture(
    enableSwipe && isBottom,
    swipeThreshold,
    executeClose
  );

  // 드래그 상호작용 추적 (한 번 드래그하면 애니메이션 재실행 방지)
  const [hasEverDragged, setHasEverDragged] = useState(false);

  useEffect(() => {
    if (swipe.isDragging && !hasEverDragged) {
      setHasEverDragged(true);
    }
  }, [swipe.isDragging, hasEverDragged]);

  // 모달 닫힐 때 스와이프 상태 초기화
  useEffect(() => {
    if (!isVisible) {
      swipe.reset();
      setHasEverDragged(false);
    }
  }, [isVisible, swipe]);

  // 스크롤 잠금
  useBodyScrollLock(isVisible);

  // ESC 키
  useEscapeKey(isVisible && closeOnEsc, executeClose);

  // 배경 클릭
  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget && closeOnBackdrop) {
      executeClose();
    }
  };

  if (!isVisible) return null;

  // 스타일 계산
  const heightClass = isBottom ? HEIGHT_CLASSES[height] : 'max-h-[90vh]';
  const containerAlign = isBottom ? 'items-end' : 'items-center';

  const modalAnimationClass = getModalAnimationClass(
    isBottom,
    isAnimating,
    swipe.isSwipeClosing,
    swipe.isSnappingBack,
    hasOpened,
    swipe.isDragging,
    hasEverDragged
  );

  const backdropAnimationClass = getBackdropAnimationClass(
    isAnimating,
    swipe.isSwipeClosing,
    hasOpened
  );

  const swipeStyle = isBottom
    ? getSwipeTransform(swipe.isSwipeClosing, swipe.isSnappingBack, swipe.isDragging, swipe.deltaY, hasOpened, hasEverDragged)
    : undefined;

  return (
    <div
      className={`fixed inset-0 z-60 flex ${containerAlign} justify-center`}
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? 'modal-title' : undefined}
    >
      {/* Backdrop - pointer-events-none으로 클릭이 container로 전달됨 */}
      <div
        className={`absolute inset-0 bg-black/50 backdrop-blur-sm pointer-events-none ${backdropAnimationClass}`}
      />

      {/* Modal Content */}
      <div
        ref={modalRef}
        className={`relative w-full bg-card shadow-xl ${heightClass} flex flex-col ${modalAnimationClass} ${SIZE_CLASSES[size]} ${className}`}
        style={swipeStyle}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drag Handle (Bottom Sheet) - 스와이프 핸들러는 여기에만 적용 */}
        {isBottom && (
          <div
            className={`flex justify-center pt-3 pb-2 ${
              enableSwipe ? 'cursor-grab active:cursor-grabbing' : ''
            }`}
            {...(enableSwipe ? swipe.handlers : {})}
          >
            <div className="w-10 h-1 bg-muted-foreground/30 rounded-full" />
          </div>
        )}

        {/* Header */}
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
            <div className="flex items-center gap-2 ml-auto">
              {headerAction}
              {showCloseButton && (
                <button
                  onClick={executeClose}
                  className="p-2 -mr-2 rounded-full hover:bg-muted/50 active:bg-muted/80 transition-colors"
                  aria-label="닫기"
                >
                  <CloseIcon size="md" className="text-muted-foreground" />
                </button>
              )}
            </div>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto overscroll-contain">
          {children}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Sub-components
// ============================================================================

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

interface ModalBodyProps {
  children: ReactNode;
  className?: string;
}

export function ModalBody({ children, className = '' }: ModalBodyProps) {
  return <div className={`p-4 ${className}`}>{children}</div>;
}
