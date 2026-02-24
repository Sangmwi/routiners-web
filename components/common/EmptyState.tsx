'use client';

import { ReactNode } from 'react';
import type { Icon } from '@phosphor-icons/react';
import Button from '@/components/ui/Button';

// ============================================================
// Types
// ============================================================

interface EmptyStateAction {
  /** 버튼 라벨 */
  label: string;
  /** 클릭 핸들러 */
  onClick: () => void;
}

interface EmptyStateProps {
  /** 아이콘 - PhosphorIcon 또는 ReactNode */
  icon?: Icon | ReactNode;
  /** 메인 메시지/제목 */
  message: string;
  /** 안내/힌트 문구 (부가 설명) */
  hint?: string;
  /** CTA 버튼 */
  action?: EmptyStateAction;
  /** 상태 타입 (스타일 변형) */
  variant?: 'default' | 'private' | 'error';
  /** 패딩 크기 */
  size?: 'sm' | 'md' | 'lg';
  /** 아이콘 배경 표시 여부 */
  showIconBackground?: boolean;
  /** 추가 클래스 */
  className?: string;
}

// ============================================================
// Component
// ============================================================

/**
 * 빈 상태 공통 컴포넌트
 *
 * @example
 * // 기본 사용 (PhosphorIcon)
 * <EmptyState
 *   icon={Scales}
 *   message="아직 등록된 인바디 기록이 없어요"
 *   hint="탭하여 인바디 기록을 추가해보세요"
 * />
 *
 * // 비공개 상태
 * <EmptyState
 *   icon={Lock}
 *   message="인바디 정보가 비공개 상태입니다"
 *   variant="private"
 * />
 *
 * // 액션 버튼 포함
 * <EmptyState
 *   icon={<Plus size={32} />}
 *   message="등록된 기록이 없습니다"
 *   action={{ label: "기록 추가", onClick: handleAdd }}
 * />
 *
 * // 아이콘 배경 포함 (기존 스타일)
 * <EmptyState
 *   icon={Tray}
 *   message="게시글이 없습니다"
 *   hint="첫 게시글을 작성해보세요"
 *   showIconBackground
 *   action={{ label: "게시글 작성", onClick: handleCreate }}
 * />
 */
export default function EmptyState({
  icon,
  message,
  hint,
  action,
  variant = 'default',
  size = 'md',
  showIconBackground = false,
  className = '',
}: EmptyStateProps) {
  // 사이즈별 패딩
  const paddingStyles = {
    sm: 'py-4',
    md: 'py-6',
    lg: 'py-16',
  };

  // variant별 아이콘 색상
  const iconColorStyles = {
    default: 'text-muted-foreground',
    private: 'text-muted-foreground',
    error: 'text-destructive',
  };

  // variant별 메시지 색상
  const messageColorStyles = {
    default: 'text-muted-foreground',
    private: 'text-muted-foreground',
    error: 'text-destructive',
  };

  // 아이콘 렌더링 (LucideIcon vs ReactNode)
  const renderIcon = () => {
    if (!icon) return null;

    // PhosphorIcon은 forwardRef를 사용하므로 $$typeof와 render 속성을 가진 객체
    // typeof === 'function' 또는 $$typeof 속성 존재 여부로 체크
    const isPhosphorIcon =
      typeof icon === 'function' ||
      (typeof icon === 'object' && icon !== null && '$$typeof' in icon);

    if (showIconBackground) {
      // 배경 있는 스타일 (기존 common/EmptyState 스타일)
      return (
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
          {isPhosphorIcon ? (
            // PhosphorIcon 컴포넌트
            (() => {
              const IconComponent = icon as Icon;
              return <IconComponent size={32} className={iconColorStyles[variant]} />;
            })()
          ) : (
            // ReactNode
            <div className={`w-8 h-8 ${iconColorStyles[variant]} [&>svg]:w-full [&>svg]:h-full`}>
              {icon}
            </div>
          )}
        </div>
      );
    }

    // 배경 없는 스타일
    return (
      <div className={`w-8 h-8 mb-3 ${iconColorStyles[variant]} [&>svg]:w-full [&>svg]:h-full`}>
        {isPhosphorIcon ? (
          (() => {
            const IconComponent = icon as Icon;
            return <IconComponent size={32} />;
          })()
        ) : (
          icon
        )}
      </div>
    );
  };

  return (
    <div
      className={`flex flex-col items-center justify-center text-center ${paddingStyles[size]} ${className}`}
    >
      {/* 아이콘 */}
      {renderIcon()}

      {/* 메인 메시지 */}
      <p className={`text-sm ${messageColorStyles[variant]}`}>{message}</p>

      {/* 힌트 */}
      {hint && (
        <p className="text-xs text-hint-strong mt-1">{hint}</p>
      )}

      {/* 액션 버튼 */}
      {action && (
        showIconBackground ? (
          // 배경 있는 스타일일 때는 Button 컴포넌트 사용
          <Button
            variant="primary"
            size="md"
            onClick={action.onClick}
            className="mt-6"
          >
            {action.label}
          </Button>
        ) : (
          // 배경 없는 스타일일 때는 텍스트 버튼
          <button
            type="button"
            onClick={action.onClick}
            className="mt-4 px-4 py-2 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
          >
            {action.label}
          </button>
        )
      )}
    </div>
  );
}
