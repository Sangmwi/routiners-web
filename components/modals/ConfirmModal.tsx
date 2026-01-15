'use client';

import { useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import Modal, { ModalBody } from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import { useShowError } from '@/lib/stores/errorStore';
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
  const showError = useShowError();

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
      showError('작업 처리에 실패했습니다');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    onCancel?.();
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleCancel}
      showCloseButton={false}
      closeOnBackdrop={!isLoading}
      closeOnEsc={!isLoading}
      size="sm"
    >
      <ModalBody>
        <div className="text-center">
          {/* 아이콘 (위험 작업일 때만) */}
          {variant === 'danger' && (
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
              <AlertTriangle className="h-6 w-6 text-destructive" />
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
              variant={variant === 'danger' ? 'destructive' : 'primary'}
              size="lg"
              onClick={handleConfirm}
              disabled={isLoading}
              className="flex-1"
            >
              {isLoading ? '처리 중...' : confirmText}
            </Button>
          </div>
        </div>
      </ModalBody>
    </Modal>
  );
}
