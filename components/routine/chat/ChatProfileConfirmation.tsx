'use client';

import { CheckIcon, PencilSimpleIcon, UserIcon } from '@phosphor-icons/react';
import { ProfileConfirmationRequest } from '@/lib/types/chat';

interface ChatProfileConfirmationProps {
  request: ProfileConfirmationRequest;
  onConfirm: () => void;
  onEdit: () => void;
  disabled?: boolean;
}

export function ChatProfileConfirmation({
  request,
  onConfirm,
  onEdit,
  disabled,
}: ChatProfileConfirmationProps) {
  return (
    <div className="my-4 mx-1">
      <div className="rounded-2xl overflow-hidden bg-linear-to-b from-primary/5 to-transparent">
        {/* 헤더 */}
        <div className="p-5 pb-4">
          <div className="flex items-start gap-3">
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

        {/* 버튼 */}
        <div className="p-3 bg-primary/5">
          <div className="flex gap-2">
            <button
              onClick={onEdit}
              disabled={disabled}
              className="flex-1 flex items-center justify-center gap-1.5 h-11 rounded-xl text-sm font-medium
                         bg-muted/40 hover:bg-muted/60 transition-colors active:scale-[0.98] disabled:opacity-50"
            >
              <PencilSimpleIcon size={16} />
              {request.editText || '수정하기'}
            </button>
            <button
              onClick={onConfirm}
              disabled={disabled}
              className="flex-1 flex items-center justify-center gap-1.5 h-11 rounded-xl text-sm font-medium
                         bg-primary text-primary-foreground hover:bg-primary/90 transition-all active:scale-[0.98] disabled:opacity-50"
            >
              <CheckIcon size={16} />
              {request.confirmText || '확인'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
