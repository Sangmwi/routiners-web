'use client';

import { CheckIcon, PencilSimpleIcon, UserIcon } from '@phosphor-icons/react';
import type { ProfileConfirmationRequest, ProfileConfirmationStatus } from '@/lib/types/chat';

interface ChatProfileConfirmationProps {
  request: ProfileConfirmationRequest;
  /** 메시지 상태 (Phase 9) */
  status?: ProfileConfirmationStatus;
  onConfirm: () => void;
  onEdit: () => void;
  disabled?: boolean;
}

/**
 * 프로필 확인 카드 컴포넌트
 *
 * Phase 10: status에 따라 버튼 자리에 상태 텍스트 표시
 * - pending: 수정/확인 버튼
 * - confirmed: "확인되었습니다" 중앙 정렬
 * - edited: "수정 요청됨" 중앙 정렬
 */
export function ChatProfileConfirmation({
  request,
  status = 'pending',
  onConfirm,
  onEdit,
  disabled,
}: ChatProfileConfirmationProps) {
  const isActionable = status === 'pending' && !disabled;

  return (
    <div className={`rounded-2xl overflow-hidden bg-linear-to-b from-primary/5 to-transparent ${status !== 'pending' ? 'opacity-75' : ''
      }`}>
      {/* 헤더 */}
      <div className="p-5 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-primary/10">
            <UserIcon className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-foreground text-lg leading-tight">
              {request.title}
            </h3>
            {request.description && (
              <p className="text-sm text-muted-foreground mt-1.5">
                {request.description}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* 필드 목록 */}
      <div className="px-5 pb-4 space-y-1.5">
        {request.fields.map((field) => (
          <div
            key={field.key}
            className="flex justify-between items-center py-2.5 px-3.5 bg-muted/30 rounded-xl"
          >
            <span className="text-sm text-muted-foreground">{field.label}</span>
            <span className="text-sm font-medium text-foreground">
              {field.displayValue}
            </span>
          </div>
        ))}
      </div>

      {/* 액션 영역: 버튼 OR 상태 표시 */}
      <div className="p-3 bg-primary/5">
        {status === 'pending' ? (
          /* 액션 버튼 */
          <div className="flex gap-2">
            {/* 수정 */}
            <button
              onClick={onEdit}
              disabled={!isActionable}
              className="flex-1 flex items-center justify-center gap-1.5 h-11 rounded-xl text-sm font-medium
                         bg-muted/40 hover:bg-muted/60 transition-colors active:scale-[0.98] disabled:opacity-50"
            >
              <PencilSimpleIcon size={16} />
              수정
            </button>
            {/* 확인 */}
            <button
              onClick={onConfirm}
              disabled={!isActionable}
              className="flex-1 flex items-center justify-center gap-1.5 h-11 rounded-xl text-sm font-medium
                         bg-primary text-primary-foreground hover:bg-primary/90 transition-all active:scale-[0.98] disabled:opacity-50"
            >
              <CheckIcon size={16} />
              {request.confirmText || '확인'}
            </button>
          </div>
        ) : (
          /* 상태 표시 (중앙 정렬) */
          <div className="flex items-center justify-center h-11">
            <span className={`text-xs font-medium flex items-center gap-1.5 ${status === 'confirmed' ? 'text-green-600' : 'text-amber-600'
              }`}>
              {status === 'confirmed' ? (
                <>
                  <CheckIcon size={14} weight="bold" />
                  확인되었습니다
                </>
              ) : (
                <>
                  <PencilSimpleIcon size={14} />
                  수정 요청됨
                </>
              )}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
