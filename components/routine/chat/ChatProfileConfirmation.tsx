'use client';

import { CheckIcon, PencilSimpleIcon, UserIcon, ProhibitIcon, ArrowRightIcon } from '@phosphor-icons/react';
import type { ProfileConfirmationRequest, ProfileConfirmationStatus } from '@/lib/types/chat';

interface ChatProfileConfirmationProps {
  request: ProfileConfirmationRequest;
  /** 메시지 상태 (Phase 9) */
  status?: ProfileConfirmationStatus;
  onConfirm: () => void;
  onEdit: () => void;
  onCancel: () => void;
  disabled?: boolean;
}

/**
 * 프로필 확인 카드 컴포넌트
 *
 * Phase 19: 칩 + CTA 디자인
 * - pending: [종료] [수정] (outline 칩) + [확인 →] (solid CTA)
 * - confirmed/edited/cancelled: 상태 표시
 */
export function ChatProfileConfirmation({
  request,
  status = 'pending',
  onConfirm,
  onEdit,
  onCancel,
  disabled,
}: ChatProfileConfirmationProps) {
  const isActionable = status === 'pending' && !disabled;

  // 상태별 표시
  const statusDisplay: Record<Exclude<ProfileConfirmationStatus, 'pending'>, { icon: React.ReactNode; text: string; className: string }> = {
    confirmed: {
      icon: <CheckIcon size={14} weight="bold" />,
      text: '확인되었습니다',
      className: 'text-green-600',
    },
    edited: {
      icon: <PencilSimpleIcon size={14} />,
      text: '수정 요청됨',
      className: 'text-amber-600',
    },
    cancelled: {
      icon: <ProhibitIcon size={14} />,
      text: '종료됨',
      className: 'text-muted-foreground',
    },
  };

  return (
    <div className={`rounded-2xl overflow-hidden ${status !== 'pending' ? 'opacity-60' : ''}`}>
      {/* 헤더 */}
      <div className="px-5 pt-5 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 bg-primary/10">
            <UserIcon className="w-5 h-5 text-primary" weight="fill" />
          </div>
          <h3 className="font-semibold text-foreground">
            {request.title}
          </h3>
        </div>
      </div>

      {/* 필드 목록 */}
      <div className="px-5 pb-5 space-y-2">
        {request.fields.map((field) => (
          <div
            key={field.key}
            className="flex justify-between items-center py-3 px-4 bg-muted/25 rounded-xl"
          >
            <span className="text-sm text-muted-foreground">{field.label}</span>
            <span className="text-sm font-medium text-foreground">
              {field.displayValue}
            </span>
          </div>
        ))}
      </div>

      {/* 액션 영역 */}
      <div className="px-5 pb-5">
        {status === 'pending' ? (
          <div className="flex items-center gap-2">
            {/* 종료 - Outline 칩 */}
            <button
              onClick={onCancel}
              disabled={!isActionable}
              className="h-11 px-5 rounded-full text-sm font-medium
                         border border-border/60 text-muted-foreground
                         hover:bg-muted/30 hover:border-border
                         transition-all active:scale-[0.97] disabled:opacity-50"
            >
              종료
            </button>

            {/* 수정 - Outline 칩 */}
            <button
              onClick={onEdit}
              disabled={!isActionable}
              className="h-11 px-5 rounded-full text-sm font-medium
                         border border-border/60 text-muted-foreground
                         hover:bg-muted/30 hover:border-border
                         transition-all active:scale-[0.97] disabled:opacity-50"
            >
              수정
            </button>

            {/* 확인 - Solid CTA (나머지 공간) */}
            <button
              onClick={onConfirm}
              disabled={!isActionable}
              className="flex-1 h-11 rounded-full text-sm font-semibold
                         bg-primary text-primary-foreground
                         hover:bg-primary/90 shadow-sm
                         transition-all active:scale-[0.98] disabled:opacity-50
                         flex items-center justify-center gap-2"
            >
              {request.confirmText || '확인'}
              <ArrowRightIcon size={16} weight="bold" />
            </button>
          </div>
        ) : (
          /* 상태 표시 */
          <div className="flex items-center justify-center h-11 rounded-full bg-muted/20">
            <span className={`text-sm font-medium flex items-center gap-1.5 ${statusDisplay[status as Exclude<ProfileConfirmationStatus, 'pending'>].className}`}>
              {statusDisplay[status as Exclude<ProfileConfirmationStatus, 'pending'>].icon}
              {statusDisplay[status as Exclude<ProfileConfirmationStatus, 'pending'>].text}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
