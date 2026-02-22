'use client';

import { ReactNode } from 'react';
import { CheckCircleIcon } from '@phosphor-icons/react';
import { LoadingSpinner } from '@/components/ui/icons';
import Button from '@/components/ui/Button';

interface FloatingSaveButtonProps {
  /** 변경사항 존재 여부 - true일 때만 버튼 표시 */
  visible: boolean;
  /** 저장 핸들러 */
  onSave: () => void;
  /** 저장 진행 중 */
  isPending?: boolean;
  /** 저장 성공 상태 */
  showSuccess?: boolean;
  /** 기본 텍스트 */
  label?: string;
  /** 로딩 텍스트 */
  pendingLabel?: string;
  /** 성공 텍스트 */
  successLabel?: string;
  /** 추가 비활성화 조건 */
  disabled?: boolean;
  /** 버튼 앞에 추가할 아이콘/요소 */
  icon?: ReactNode;
}

/**
 * 플로팅 저장 버튼
 *
 * 변경사항이 있을 때만 하단에서 떠오르는 저장 버튼.
 * 저장 중 → 저장 완료 상태 전환 애니메이션 포함.
 *
 * @example
 * <FloatingSaveButton
 *   visible={hasChanges}
 *   onSave={handleSave}
 *   isPending={mutation.isPending}
 *   showSuccess={showSuccess}
 * />
 */
export default function FloatingSaveButton({
  visible,
  onSave,
  isPending = false,
  showSuccess = false,
  label = '저장하기',
  pendingLabel = '저장 중...',
  successLabel = '저장 완료',
  disabled = false,
  icon,
}: FloatingSaveButtonProps) {
  if (!visible) return null;

  return (
    <div className="fixed bottom-6 left-4 right-4 z-20 max-w-md mx-auto animate-float-up">
      <Button
        onClick={onSave}
        className={`w-full shadow-lg ${
          showSuccess
            ? 'bg-emerald-500 hover:bg-emerald-500'
            : 'shadow-primary/30'
        }`}
        disabled={isPending || showSuccess || disabled}
      >
        {showSuccess ? (
          <>
            <CheckCircleIcon size={18} weight="fill" className="mr-2" />
            {successLabel}
          </>
        ) : isPending ? (
          <>
            <LoadingSpinner size="sm" variant="current" className="mr-2" />
            {pendingLabel}
          </>
        ) : (
          <>
            {icon && <span className="mr-2">{icon}</span>}
            {label}
          </>
        )}
      </Button>
    </div>
  );
}
