'use client';

import { LoadingSpinner } from '@/components/ui/icons';

interface LoadingOverlayProps {
  message?: string;
  variant?: 'default' | 'destructive';
}

/**
 * 콘텐츠 위에 반투명 오버레이 + 중앙 스피너를 표시하는 컴포넌트
 *
 * @description
 * 부모 요소에 `relative`가 필요합니다.
 * 저장/삭제 등 비동기 작업 중 기존 콘텐츠를 유지하면서 로딩 상태를 표시할 때 사용.
 *
 * @example
 * ```tsx
 * <div className="relative">
 *   {isProcessing && <LoadingOverlay message="저장 중..." />}
 *   <MyContent />
 * </div>
 * ```
 */
export default function LoadingOverlay({
  message = '처리 중...',
  variant = 'default',
}: LoadingOverlayProps) {
  return (
    <div className="absolute inset-0 bg-surface-glass backdrop-blur-[1px] flex items-center justify-center z-10 rounded-xl">
      <div className="flex flex-col items-center gap-3">
        <LoadingSpinner
          size="xl"
          variant={variant === 'destructive' ? 'destructive' : 'primary'}
        />
        <p className="text-sm font-medium text-foreground">{message}</p>
      </div>
    </div>
  );
}
