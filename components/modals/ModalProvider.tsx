'use client';

import { useModalStore } from '@/lib/stores';
import ConfirmModal from './ConfirmModal';
import AlertModal from './AlertModal';
import ImagePreviewModal from './ImagePreviewModal';
import type { ModalInstance, ModalDataMap } from '@/lib/stores/modalStore';

// ============================================================================
// Modal Renderer
// ============================================================================

/**
 * 모달 타입에 따라 적절한 컴포넌트 렌더링
 */
function renderModal(modal: ModalInstance, onClose: () => void) {
  const commonProps = {
    isOpen: true,
    onClose,
  };

  switch (modal.type) {
    case 'confirm':
      return (
        <ConfirmModal
          key={modal.id}
          {...commonProps}
          data={modal.data as ModalDataMap['confirm']}
        />
      );

    case 'alert':
      return (
        <AlertModal
          key={modal.id}
          {...commonProps}
          data={modal.data as ModalDataMap['alert']}
        />
      );

    case 'imagePreview':
      return (
        <ImagePreviewModal
          key={modal.id}
          {...commonProps}
          data={modal.data as ModalDataMap['imagePreview']}
        />
      );

    // TODO: 추가 모달 타입들
    case 'profileEdit':
    case 'unitSearch':
    case 'tagSelect':
    case 'rankSelect':
    case 'specialtySelect':
      // 아직 구현되지 않은 모달은 null 반환
      console.warn(`Modal type "${modal.type}" is not implemented yet`);
      return null;

    default:
      console.warn(`Unknown modal type: ${(modal as ModalInstance).type}`);
      return null;
  }
}

// ============================================================================
// Provider Component
// ============================================================================

/**
 * 전역 모달 렌더러
 *
 * ModalStore의 상태를 구독하여 열린 모달들을 렌더링
 * RootLayout에 배치하여 전역에서 모달 사용 가능
 *
 * @example
 * // layout.tsx
 * <QueryProvider>
 *   <ErrorBoundary>
 *     <ModalProvider />
 *     {children}
 *   </ErrorBoundary>
 * </QueryProvider>
 *
 * // 사용처
 * const openModal = useModalStore(state => state.openModal);
 * openModal('confirm', { title: '삭제', message: '정말 삭제할까요?', onConfirm: handleDelete });
 */
export default function ModalProvider() {
  const modals = useModalStore((state) => state.modals);
  const closeModal = useModalStore((state) => state.closeModal);

  if (modals.length === 0) return null;

  return (
    <>
      {modals.map((modal) =>
        renderModal(modal, () => closeModal(modal.id))
      )}
    </>
  );
}
