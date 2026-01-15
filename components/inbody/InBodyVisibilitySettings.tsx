'use client';

import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import FormToggle from '@/components/ui/FormToggle';
import { useCurrentUserProfile, useUpdateProfile } from '@/hooks/profile/useProfile';

// ============================================================
// Types
// ============================================================

interface InBodyVisibilitySettingsProps {
  /** 컴포넌트 스타일 변형 */
  variant?: 'default' | 'card';
  /** 저장 성공 시 콜백 */
  onSaveSuccess?: () => void;
  /** 저장 실패 시 콜백 */
  onSaveError?: (error: Error) => void;
}

// ============================================================
// Main Component
// ============================================================

/**
 * InBody 공개 설정 컴포넌트
 *
 * @description
 * - 인바디 정보의 공개 여부를 토글
 * - 변경 시 자동 저장 (debounce 적용)
 * - 프로필 편집과 독립적으로 동작
 *
 * @example
 * ```tsx
 * <InBodyVisibilitySettings
 *   variant="card"
 *   onSaveSuccess={() => toast.success('설정이 저장되었습니다')}
 * />
 * ```
 */
export default function InBodyVisibilitySettings({
  variant = 'default',
  onSaveSuccess,
  onSaveError,
}: InBodyVisibilitySettingsProps) {
  const { data: user, isLoading: isUserLoading } = useCurrentUserProfile();
  const updateProfile = useUpdateProfile();

  // Local state for immediate UI feedback
  const [isPublic, setIsPublic] = useState<boolean>(true);

  // Sync with server state
  useEffect(() => {
    if (user?.showInbodyPublic !== undefined) {
      setIsPublic(user.showInbodyPublic);
    }
  }, [user?.showInbodyPublic]);

  const handleToggle = (newValue: boolean) => {
    // Optimistic update
    setIsPublic(newValue);

    updateProfile.mutate(
      { showInbodyPublic: newValue },
      {
        onSuccess: () => onSaveSuccess?.(),
        onError: (error) => {
          // Rollback on error
          setIsPublic(!newValue);
          onSaveError?.(error instanceof Error ? error : new Error('저장에 실패했습니다'));
        },
      }
    );
  };

  const isSaving = updateProfile.isPending;

  if (isUserLoading) {
    return (
      <div className="flex items-center justify-center py-4">
        <Loader2 className="w-5 h-5 text-primary animate-spin" />
      </div>
    );
  }

  const content = (
    <div className="relative">
      <FormToggle
        label="인바디 정보 공개"
        description="다른 사용자에게 인바디 정보를 공개합니다"
        checked={isPublic}
        onChange={handleToggle}
        disabled={isSaving}
      />
      {isSaving && (
        <div className="absolute right-12 top-1/2 -translate-y-1/2">
          <Loader2 className="w-4 h-4 text-primary animate-spin" />
        </div>
      )}
    </div>
  );

  if (variant === 'card') {
    return (
      <div className="bg-card rounded-xl p-4 border border-border/50">
        <h3 className="text-sm font-medium text-card-foreground mb-3">공개 설정</h3>
        {content}
      </div>
    );
  }

  return content;
}
