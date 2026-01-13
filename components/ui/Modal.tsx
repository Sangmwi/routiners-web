'use client';

import { useEffect, useRef, useState, useCallback, ReactNode } from 'react';
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
  /** 스와이프로 닫기 활성화 (position=bottom일 때만) */
  enableSwipe?: boolean;
  /** 스와이프 닫기 임계값 (px) */
  swipeThreshold?: number;
  /** 바텀시트 높이 (position=bottom일 때만) */
  height?: 'auto' | 'half' | 'full';
}

// 모바일: 전체 폭, 데스크톱: 사이즈별 max-width
const sizeClasses = {
  sm: 'sm:max-w-sm',
  md: 'sm:max-w-md',
  lg: 'sm:max-w-lg',
  full: 'sm:max-w-full sm:mx-4',
};

// 바텀시트 높이 클래스
const heightClasses = {
  auto: 'max-h-[85vh]',
  half: 'h-[50vh]',
  full: 'h-[90vh]',
};

// 애니메이션 duration (ms)
const ANIMATION_DURATION = 200;

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

  // 모달 표시 상태 (애니메이션 포함)
  const [isVisible, setIsVisible] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [hasOpened, setHasOpened] = useState(false); // 열기 애니메이션 완료 여부

  // 스와이프 상태
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchDelta, setTouchDelta] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isSwipeClosing, setIsSwipeClosing] = useState(false); // 스와이프로 닫기 중

  // 닫기 핸들러 (버튼/배경 클릭 시 - 애니메이션 후 실제 닫기)
  const handleClose = useCallback(() => {
    if (isClosing || isSwipeClosing) return; // 이미 닫는 중이면 무시
    setIsClosing(true);
    setTimeout(() => {
      setIsClosing(false);
      setIsVisible(false);
      onClose();
    }, ANIMATION_DURATION);
  }, [isClosing, isSwipeClosing, onClose]);

  // ESC 키 핸들러
  const handleEsc = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape' && closeOnEsc) {
      handleClose();
    }
  }, [closeOnEsc, handleClose]);

  // 배경 클릭 핸들러
  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget && closeOnBackdrop) {
      handleClose();
    }
  };

  // 터치 시작
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (!enableSwipe || !isBottom) return;
    setTouchStart(e.touches[0].clientY);
    setIsDragging(true);
  }, [enableSwipe, isBottom]);

  // 터치 이동
  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isDragging || touchStart === null) return;
    const currentY = e.touches[0].clientY;
    const delta = currentY - touchStart;
    // 아래로만 드래그 허용
    if (delta > 0) {
      setTouchDelta(delta);
    }
  }, [isDragging, touchStart]);

  // 터치 종료
  const handleTouchEnd = useCallback(() => {
    if (!isDragging) return;

    if (touchDelta > swipeThreshold) {
      // 스와이프 닫기 시작 - touchDelta 유지하여 현재 위치에서 애니메이션
      setIsSwipeClosing(true);
      setIsDragging(false);
      setTouchStart(null);
      // touchDelta는 리셋하지 않음 - 스와이프 스타일에서 사용

      // 애니메이션 완료 후 실제 닫기
      setTimeout(() => {
        setIsSwipeClosing(false);
        setTouchDelta(0);
        setIsVisible(false);
        onClose();
      }, ANIMATION_DURATION);
    } else {
      // 임계값 미달 - 원래 위치로 스냅백
      setTouchStart(null);
      setTouchDelta(0);
      setIsDragging(false);
    }
  }, [isDragging, touchDelta, swipeThreshold, onClose]);

  // isOpen 변경 시 visible 상태 관리
  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      setIsClosing(false);
      setHasOpened(false);
      // 열기 애니메이션 완료 후 hasOpened 설정
      const timer = setTimeout(() => {
        setHasOpened(true);
      }, 300); // 열기 애니메이션 duration
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // ESC 키 이벤트 등록
  useEffect(() => {
    if (isVisible) {
      document.addEventListener('keydown', handleEsc);
      // 모달 오픈 시 스크롤 방지
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = 'unset';
    };
  }, [isVisible, handleEsc]);

  // 스와이프 상태 초기화 (모달 닫힐 때)
  useEffect(() => {
    if (!isVisible) {
      setTouchStart(null);
      setTouchDelta(0);
      setIsDragging(false);
      setIsSwipeClosing(false);
    }
  }, [isVisible]);

  if (!isVisible) return null;

  // 위치별 스타일
  const containerPositionClass = isBottom
    ? 'items-end' // 하단 시트
    : 'items-center'; // 중앙

  // 바텀시트 높이 클래스 적용 (position=bottom일 때만)
  const heightClass = isBottom ? heightClasses[height] : 'max-h-[90vh]';

  // 애니메이션 클래스 (열기/닫기/드래그 상태 분리)
  const getAnimationClass = () => {
    const baseClass = isBottom
      ? 'rounded-t-3xl sm:rounded-2xl'
      : 'rounded-2xl mx-4';

    // 스와이프 닫기 - CSS 애니메이션 없음 (인라인 transform으로 처리)
    if (isSwipeClosing) {
      return baseClass;
    }

    // 버튼/배경 닫기 - CSS 애니메이션 사용
    if (isClosing) {
      return isBottom
        ? `${baseClass} animate-out slide-out-to-bottom duration-200`
        : `${baseClass} animate-out zoom-out-95 fade-out duration-200`;
    }

    // 드래그 중이거나 열기 애니메이션 완료 후: 애니메이션 없음 (인라인 transform 사용)
    if (hasOpened || isDragging) {
      return baseClass;
    }

    // 열기 애니메이션 (처음 열릴 때만)
    return isBottom
      ? `${baseClass} animate-in slide-in-from-bottom duration-300`
      : `${baseClass} animate-in zoom-in-95 duration-200`;
  };

  const modalPositionClass = getAnimationClass();

  // 배경 애니메이션 클래스
  const getBackdropAnimationClass = () => {
    // 스와이프 닫기 또는 버튼/배경 닫기 시 페이드 아웃
    if (isSwipeClosing || isClosing) return 'animate-out fade-out duration-200';
    if (hasOpened) return ''; // 애니메이션 완료 후 정적
    return 'animate-in fade-in duration-200';
  };
  const backdropAnimationClass = getBackdropAnimationClass();

  // 스와이프 트랜스폼 스타일
  const getSwipeStyle = () => {
    // 스와이프 닫기 중 - 현재 위치에서 100%로 애니메이션
    if (isSwipeClosing) {
      return {
        transform: 'translateY(100%)',
        transition: `transform ${ANIMATION_DURATION}ms ease-out`,
      };
    }

    // 드래그 중 - 손가락 따라감 (transition 없음)
    if (isDragging && touchDelta > 0) {
      return {
        transform: `translateY(${touchDelta}px)`,
        transition: 'none',
      };
    }

    // 기본 상태 또는 스냅백
    return {
      transform: 'translateY(0)',
      transition: 'transform 300ms ease-out',
    };
  };
  const swipeStyle = getSwipeStyle();

  return (
    <div
      className={`fixed min-h-screen inset-0 z-60 flex ${containerPositionClass} justify-center`}
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? 'modal-title' : undefined}
    >
      {/* 배경 오버레이 */}
      <div className={`absolute inset-0 bg-black/50 backdrop-blur-sm ${backdropAnimationClass}`} />

      {/* 모달 컨텐츠 */}
      <div
        ref={modalRef}
        className={`relative w-full bg-card shadow-xl ${heightClass} flex flex-col ${modalPositionClass} ${sizeClasses[size]} ${className}`}
        style={isBottom ? swipeStyle : undefined}
        onClick={(e) => e.stopPropagation()}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* 드래그 핸들 - 하단 시트일 때만 */}
        {isBottom && (
          <div
            className={`flex justify-center pt-3 pb-2 ${enableSwipe ? 'cursor-grab active:cursor-grabbing' : ''}`}
          >
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
            <div className="flex items-center gap-2 ml-auto">
              {headerAction}
              {showCloseButton && (
                <button
                  onClick={handleClose}
                  className="p-2 -mr-2 rounded-full hover:bg-muted/50 active:bg-muted/80 transition-colors"
                  aria-label="닫기"
                >
                  <X className="w-5 h-5 text-muted-foreground" />
                </button>
              )}
            </div>
          </div>
        )}

        {/* 컨텐츠 */}
        <div className="flex-1 overflow-y-auto overscroll-contain">{children}</div>
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
