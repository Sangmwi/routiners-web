'use client';

import { type ReactNode } from 'react';
import Button from '@/components/ui/Button';
import GradientFooter from '@/components/ui/GradientFooter';

// ============================================================================
// Types
// ============================================================================

interface SheetFooterActionProps {
  onClick: () => void;
  disabled?: boolean;
  isLoading?: boolean;
  /** 기본 버튼 레이블 */
  label: string;
  /** 로딩 중 레이블 (isLoading=true일 때 표시) */
  pendingLabel?: string;
  /** 버튼 앞 아이콘 (로딩 시 숨김) */
  icon?: ReactNode;
  /** warning = 충돌/덮어쓰기 경고 색상 */
  variant?: 'primary' | 'warning';
  /** Button className 오버라이드 */
  buttonClassName?: string;
}

// ============================================================================
// Component
// ============================================================================

/**
 * 시트/모달 하단 고정 주요 액션 버튼
 *
 * stickyFooter prop에 사용하는 표준 CTA 래퍼.
 * FloatingSaveButton과 동일한 그라디언트 페이드를 적용하되,
 * 항상 보이는 고정 영역용이므로 그림자·애니메이션 없음.
 *
 * @example
 * <Modal stickyFooter={
 *   <SheetFooterAction
 *     label="저장하기"
 *     pendingLabel="저장 중..."
 *     onClick={handleSave}
 *     disabled={items.length === 0}
 *     isLoading={isPending}
 *   />
 * }>
 */
export default function SheetFooterAction({
  onClick,
  disabled = false,
  isLoading = false,
  label,
  pendingLabel,
  icon,
  variant = 'primary',
  buttonClassName = '',
}: SheetFooterActionProps) {
  const displayLabel = isLoading && pendingLabel ? pendingLabel : label;

  const variantClass =
    variant === 'warning'
      ? 'bg-warning text-warning-foreground hover:bg-warning/90'
      : '';

  return (
    <GradientFooter variant="sheet">
      <Button
        type="button"
        variant="primary"
        fullWidth
        onClick={onClick}
        disabled={disabled || isLoading}
        isLoading={isLoading}
        className={`shadow-none hover:shadow-none ${variantClass} ${buttonClassName}`}
      >
        {!isLoading && icon}
        {displayLabel}
      </Button>
    </GradientFooter>
  );
}
