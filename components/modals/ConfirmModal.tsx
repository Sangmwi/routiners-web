'use client';

import { useState } from 'react';
import { ErrorIcon, LoadingSpinner } from '@/components/ui/icons';
import Modal, { ModalBody } from '@/components/ui/Modal';
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
    loadingMessage,
  } = data;

  const handleConfirm = async () => {
    setIsLoading(true);
    try {
      await onConfirm();
      onClose();
    } catch (error) {
      console.error('Confirm action failed:', error);
      showError('작업 처리에 실패했어요');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    onCancel?.();
    onClose();
  };

  // 로딩 메시지가 있고 로딩 중일 때 전체 UI를 로딩 상태로 변경
  const showLoadingUI = isLoading && loadingMessage;

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleCancel}
      showCloseButton={false}
      closeOnBackdrop={false}
      closeOnEsc={false}
      size="sm"
    >
      <ModalBody className="p-6">
        {showLoadingUI ? (
          // 로딩 UI
          <div className="text-center py-4">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center">
              <LoadingSpinner size="xl" />
            </div>
            <p className="text-sm text-muted-foreground">{loadingMessage}</p>
          </div>
        ) : (
          // 기본 확인 UI
          <div className="space-y-4">
            {/* 아이콘 (위험 작업일 때만) */}
            {variant === 'danger' && (
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                <ErrorIcon size="lg" className="text-foreground" />
              </div>
            )}

            {/* 제목 */}
            <h3 className="text-lg font-bold text-foreground">{title}</h3>

            {/* 메시지 */}
            <p className="text-sm text-muted-foreground">{message}</p>

            {/* 버튼 */}
            <div className="flex gap-3">
              <button
                onClick={handleCancel}
                disabled={isLoading}
                className="flex-1 py-3 rounded-xl font-medium bg-muted/50 text-foreground disabled:opacity-50"
              >
                {cancelText}
              </button>
              <button
                onClick={handleConfirm}
                disabled={isLoading}
                className={`flex-1 py-3 rounded-xl font-medium disabled:opacity-50 ${
                  variant === 'danger'
                    ? 'bg-destructive text-destructive-foreground'
                    : 'bg-primary text-primary-foreground'
                }`}
              >
                {isLoading ? '처리 중...' : confirmText}
              </button>
            </div>
          </div>
        )}
      </ModalBody>
    </Modal>
  );
}
