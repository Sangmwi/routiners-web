'use client';

import { useEffect, type CSSProperties, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { CloseIcon } from '@/components/ui/icons';
import {
  useSwipeGesture,
  useBodyScrollLock,
  useEscapeKey,
} from '@/hooks/ui';
import { useModalLifecycle, ANIMATION_DURATION } from '@/hooks/ui/useModalLifecycle';

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
  /** 스크롤 영역 바깥 하단에 고정되는 요소 (입력창 등) */
  stickyFooter?: ReactNode;
  /** 모달이 열릴 때 실행할 콜백 (autoFocus 등) */
  onOpened?: () => void;
  /** true이면 뒤로가기로 닫히지 않음 (로딩 중 등) */
  preventClose?: boolean;
  /** 닫기 애니메이션 완료 후 호출 (ModalProvider에서 실제 제거 등) */
  onExited?: () => void;
}

// ============================================================================
// Constants
// ============================================================================

const SIZE_CLASSES = {
  sm: 'sm:max-w-sm',
  md: 'sm:max-w-md',
  lg: 'sm:max-w-lg',
  full: 'sm:max-w-full sm:mx-4',
} as const;

const HEIGHT_CLASSES = {
  auto: 'max-h-[85dvh]',
  half: 'h-[50dvh]',
  full: '', // inline style로 키보드 높이 반영
} as const;

const BACKDROP_STYLE: CSSProperties = {
  backgroundColor: 'var(--modal-backdrop)',
  backdropFilter: 'blur(var(--modal-backdrop-blur))',
  WebkitBackdropFilter: 'blur(var(--modal-backdrop-blur))',
};

// ============================================================================
// Animation Helpers
// ============================================================================

function getModalAnimationClass(
  isBottom: boolean,
  isAnimating: boolean,
  isSwipeClosing: boolean,
  isSnappingBack: boolean,
  hasOpened: boolean,
  isDragging: boolean
): string {
  const baseClass = isBottom
    ? 'rounded-t-3xl'
    : 'rounded-2xl mx-4';

  if (isSwipeClosing) return baseClass;

  if (isAnimating) {
    return isBottom
      ? baseClass // bottom sheet 닫기는 inline style transition으로 처리
      : `${baseClass} animate-out zoom-out-95 fade-out duration-200`;
  }

  // 한 번이라도 드래그했으면 애니메이션 재실행 방지
  if (hasOpened || isDragging || isSnappingBack) return baseClass;

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

/**
 * 스와이프 스타일 계산
 * 드래그 중 transform은 useSwipeGesture가 rAF로 직접 DOM 조작하므로 여기서 처리하지 않음
 */
function getSwipeTransform(
  isSwipeClosing: boolean,
  isAnimating: boolean,
  hasOpened: boolean,
): React.CSSProperties | undefined {
  // 스와이프로 닫히는 중
  if (isSwipeClosing) {
    return {
      transform: 'translateY(100%)',
      transition: `transform ${ANIMATION_DURATION}ms ease-out`,
    };
  }

  // backdrop 클릭/ESC 등으로 닫히는 중
  if (isAnimating) {
    return {
      transform: 'translateY(100%)',
      transition: `transform ${ANIMATION_DURATION}ms ease-out`,
      animation: 'none',
    };
  }

  // 이미 열린 상태: 위치 고정 + 애니메이션 비활성화
  if (hasOpened) {
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
  stickyFooter,
  onOpened,
  preventClose,
  onExited,
}: ModalProps) {
  const isBottom = position === 'bottom';

  // 모달 가시성 + 애니메이션 + 히스토리 통합 관리
  const { isVisible, isAnimating, hasOpened, markOpened, executeClose } = useModalLifecycle(
    isOpen,
    onClose,
    { preventClose, onExited }
  );

  // 스와이프 제스처
  const swipe = useSwipeGesture(
    enableSwipe && isBottom,
    swipeThreshold,
    executeClose
  );

  // 모달 열림 콜백
  useEffect(() => {
    if (isVisible && onOpened) {
      const timer = setTimeout(onOpened, 100);
      return () => clearTimeout(timer);
    }
  }, [isVisible, onOpened]);

  // 드래그 시작 시 오픈 애니메이션 재실행 방지
  useEffect(() => {
    if (swipe.isDragging) {
      markOpened();
    }
  }, [swipe.isDragging, markOpened]);

  // 모달 닫힐 때 스와이프 상태 초기화
  useEffect(() => {
    if (!isVisible) {
      swipe.reset();
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

  // SSR 안전: document가 없으면 렌더링하지 않음
  if (typeof document === 'undefined') return null;

  // 스타일 계산
  const heightClass = isBottom ? HEIGHT_CLASSES[height] : 'max-h-[85dvh]';
  const containerAlign = isBottom ? 'items-end' : 'items-center';

  // full 높이일 때 가용 화면 높이를 반영한 inline style
  const heightStyle: React.CSSProperties | undefined =
    isBottom && height === 'full'
      ? {
          height: '100dvh',
          paddingBottom: 'var(--keyboard-safe-clearance)',
        }
      : undefined;

  const modalAnimationClass = getModalAnimationClass(
    isBottom,
    isAnimating,
    swipe.isSwipeClosing,
    swipe.isSnappingBack,
    hasOpened,
    swipe.isDragging
  );

  const backdropAnimationClass = getBackdropAnimationClass(
    isAnimating,
    swipe.isSwipeClosing,
    hasOpened
  );

  const swipeStyle = isBottom
    ? getSwipeTransform(swipe.isSwipeClosing, isAnimating, hasOpened)
    : undefined;

  return createPortal(
    <div
      className={`fixed inset-0 z-60 flex ${containerAlign} justify-center`}
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? 'modal-title' : undefined}
    >
      {/* Backdrop - pointer-events-none으로 클릭이 container로 전달됨 */}
      <div
        className={`absolute inset-0 pointer-events-none ${backdropAnimationClass}`}
        style={BACKDROP_STYLE}
      />

      {/* Modal Content */}
      <div
        ref={swipe.modalRef}
        className={`relative w-full bg-card shadow-xl ${heightClass} flex flex-col overflow-hidden ${modalAnimationClass} ${isBottom ? 'sm:max-w-md' : SIZE_CLASSES[size]} ${className}`}
        style={{ ...heightStyle, ...swipeStyle }}
        onClick={(e) => e.stopPropagation()}
        {...(enableSwipe ? swipe.handlers : {})}
      >
        {/* Drag Handle (Bottom Sheet) — 스와이프 가능할 때만 표시 */}
        {isBottom && enableSwipe && (
          <div className="flex justify-center pt-3 pb-2 cursor-grab active:cursor-grabbing">
            <div className="w-10 h-1 bg-hint-faint rounded-full" />
          </div>
        )}

        {/* Header — title이 있을 때만 렌더 (bottom sheet에서 title 없으면 고아 닫기버튼 방지) */}
        {title && (
          <div className="flex items-center justify-between px-4 py-3 border-b border-edge-subtle">
            {title && (
              <h2
                id="modal-title"
                className="text-base font-medium text-card-foreground"
              >
                {title}
              </h2>
            )}
            <div className="flex items-center gap-2 ml-auto">
              {headerAction}
              {showCloseButton && (
                <button
                  onClick={executeClose}
                  className="p-2 -mr-2 rounded-full hover:bg-surface-muted active:bg-surface-pressed transition-colors"
                  aria-label="닫기"
                >
                  <CloseIcon size="md" className="text-muted-foreground" />
                </button>
              )}
            </div>
          </div>
        )}

        {/* Content */}
        <div
          ref={enableSwipe && isBottom ? swipe.contentRef : undefined}
          className="flex-1 overflow-y-auto overscroll-contain"
          {...(enableSwipe && isBottom ? swipe.contentHandlers : {})}
        >
          {children}
        </div>

        {/* Sticky Footer — 스크롤 영역 바깥 하단 고정 */}
        {stickyFooter}
      </div>
    </div>,
    document.body
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
      className={`flex gap-3 px-4 py-4 border-t border-edge-subtle bg-card ${className}`}
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
  return <div className={className || undefined}>{children}</div>;
}
