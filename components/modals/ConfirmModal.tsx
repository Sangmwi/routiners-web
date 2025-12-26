'use client';

import { useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import ModalBase from './ModalBase';
import Button from '@/components/ui/Button';
import type { ModalDataMap } from '@/lib/stores/modalStore';

// ============================================================================
// Types
// ============================================================================

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: ModalDataMap['confirm'];
}

// ============================================================================
// Component
// ============================================================================

/**
 * 확인 다이얼로그 모달
 *
 * 사용자에게 확인/취소를 요청하는 모달
 * 위험한 작업(삭제 등)에는 variant="danger" 사용
 */
export default function ConfirmModal({
  isOpen,
  onClose,
  data,
}: ConfirmModalProps) {
  const [isLoading, setIsLoading] = useState(false);

  const {
    title,
    message,
    confirmText = '확인',
    cancelText = '취소',
    onConfirm,
    onCancel,
    variant = 'default',
  } = data;

  const handleConfirm = async () => {
    setIsLoading(true);
    try {
      await onConfirm();
      onClose();
    } catch (error) {
      console.error('Confirm action failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    onCancel?.();
    onClose();
  };

  return (
    <ModalBase
      isOpen={isOpen}
      onClose={handleCancel}
      showCloseButton={false}
      closeOnBackdrop={!isLoading}
      closeOnEscape={!isLoading}
      size="sm"
    >
      <div className="text-center">
        {/* 아이콘 (위험 작업일 때만) */}
        {variant === 'danger' && (
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
            <AlertTriangle className="h-6 w-6 text-red-600" />
          </div>
        )}

        {/* 제목 */}
        <h3 className="text-lg font-semibold text-foreground">{title}</h3>

        {/* 메시지 */}
        <p className="mt-2 text-sm text-muted-foreground">{message}</p>

        {/* 버튼 */}
        <div className="mt-6 flex gap-3">
          <Button
            variant="outline"
            size="lg"
            onClick={handleCancel}
            disabled={isLoading}
            className="flex-1"
          >
            {cancelText}
          </Button>
          <Button
            variant={variant === 'danger' ? 'primary' : 'primary'}
            size="lg"
            onClick={handleConfirm}
            disabled={isLoading}
            className={`flex-1 ${variant === 'danger' ? 'bg-red-600 hover:bg-red-700' : ''}`}
          >
            {isLoading ? '처리 중...' : confirmText}
          </Button>
        </div>
      </div>
    </ModalBase>
  );
}
