'use client';

import { CheckIcon, PencilSimpleIcon } from '@phosphor-icons/react';
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
    <div className="bg-card border border-border rounded-xl p-4 space-y-4">
      {/* 헤더 */}
      <div>
        <h3 className="font-medium text-foreground">{request.title}</h3>
        {request.description && (
          <p className="text-sm text-muted-foreground mt-1">
            {request.description}
          </p>
        )}
      </div>

      {/* 필드 목록 */}
      <div className="space-y-2">
        {request.fields.map((field) => (
          <div
            key={field.key}
            className="flex justify-between items-center py-2 border-b border-border last:border-0"
          >
            <span className="text-sm text-muted-foreground">{field.label}</span>
            <span className="text-sm font-medium text-foreground">
              {field.displayValue}
            </span>
          </div>
        ))}
      </div>

      {/* 버튼 */}
      <div className="flex gap-2">
        <button
          onClick={onEdit}
          disabled={disabled}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4
                     border border-border rounded-lg text-sm font-medium
                     hover:bg-muted transition-colors disabled:opacity-50"
        >
          <PencilSimpleIcon size={16} />
          {request.editText || '수정하기'}
        </button>
        <button
          onClick={onConfirm}
          disabled={disabled}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4
                     bg-primary text-primary-foreground rounded-lg text-sm font-medium
                     hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          <CheckIcon size={16} />
          {request.confirmText || '확인'}
        </button>
      </div>
    </div>
  );
}
