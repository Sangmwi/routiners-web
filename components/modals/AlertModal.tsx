'use client';

import Modal, { ModalBody } from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import type { ModalDataMap } from '@/lib/stores/modalStore';
import type { BaseModalProps } from '@/lib/types/modal';

interface AlertModalProps extends BaseModalProps {
  data: ModalDataMap['alert'];
}

export default function AlertModal({
  isOpen,
  onClose,
  onExited,
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
      onExited={onExited}
      showCloseButton={false}
      closeOnBackdrop={false}
      closeOnEsc={false}
      size="sm"
    >
      <ModalBody className="p-6">
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-foreground">{title}</h3>
          <p className="text-sm text-muted-foreground">{message}</p>
          <div className="flex justify-end">
            <Button variant="primary" onClick={handleClose} className="min-w-[180px]">
              {buttonText}
            </Button>
          </div>
        </div>
      </ModalBody>
    </Modal>
  );
}
