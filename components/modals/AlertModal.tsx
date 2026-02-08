'use client';

import { InfoIcon } from '@/components/ui/icons';
import Modal, { ModalBody } from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import type { ModalDataMap } from '@/lib/stores/modalStore';

// ============================================================================
// Types
// ============================================================================

interface AlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: ModalDataMap['alert'];
}

// ============================================================================
// Component
// ============================================================================

/**
 * 알림 다이얼로그 모달
 *
 * 사용자에게 정보를 알리는 단순 모달
 */
export default function AlertModal({
  isOpen,
  onClose,
  data,
}: AlertModalProps) {
  const { title, message, buttonText = '확인', onClose: onCloseCallback } = data;

  const handleClose = () => {
    onCloseCallback?.();
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      showCloseButton={false}
      closeOnBackdrop={false}
      closeOnEsc={false}
      size="sm"
    >
      <ModalBody className="p-6">
        <div className="text-center">
          {/* 아이콘 */}
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <InfoIcon size="lg" className="text-primary" />
          </div>

          {/* 제목 */}
          <h3 className="text-lg font-semibold text-foreground">{title}</h3>

          {/* 메시지 */}
          <p className="mt-2 text-sm text-muted-foreground">{message}</p>

          {/* 버튼 */}
          <Button
            variant="primary"
            size="lg"
            onClick={handleClose}
            className="mt-6 w-full"
          >
            {buttonText}
          </Button>
        </div>
      </ModalBody>
    </Modal>
  );
}
