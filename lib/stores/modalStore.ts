/**
 * Modal Store (Zustand)
 *
 * 모달/다이얼로그 전역 상태 관리
 * - 다중 모달 스택 지원
 * - 타입 안전한 모달 데이터
 * - 모달 히스토리 관리
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

// ============================================================================
// Types
// ============================================================================

/**
 * 모달 타입 열거
 *
 * 새 모달 추가 시 여기에 타입 추가
 */
export type ModalType =
  | 'confirm'           // 확인/취소 다이얼로그
  | 'alert'             // 알림 다이얼로그
  | 'imagePreview';     // 이미지 미리보기

/**
 * 모달별 데이터 타입 매핑
 */
export interface ModalDataMap {
  confirm: {
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    onConfirm: () => void | Promise<void>;
    onCancel?: () => void;
    variant?: 'default' | 'danger';
    /** 로딩 중 표시할 메시지 (설정 시 전체 UI가 로딩 상태로 변경) */
    loadingMessage?: string;
  };
  alert: {
    title: string;
    message: string;
    buttonText?: string;
    onClose?: () => void;
  };
  imagePreview: {
    images: string[];
    initialIndex?: number;
  };
}

/**
 * 모달 인스턴스
 */
export interface ModalInstance<T extends ModalType = ModalType> {
  id: string;
  type: T;
  data: ModalDataMap[T];
  isClosing?: boolean;
}

interface ModalState {
  /** 현재 열린 모달 스택 */
  modals: ModalInstance[];
  /** 현재 최상위 모달 */
  currentModal: ModalInstance | null;
}

interface ModalActions {
  /**
   * 모달 열기
   *
   * @example
   * openModal('confirm', {
   *   title: '삭제 확인',
   *   message: '정말 삭제하시겠습니까?',
   *   onConfirm: handleDelete,
   * });
   */
  openModal: <T extends ModalType>(type: T, data: ModalDataMap[T]) => string;

  /**
   * 모달 닫기 시작 (isClosing 마킹 → isOpen이 false로 전환)
   */
  closeModal: (id: string) => void;

  /**
   * 모달 실제 제거 (애니메이션 완료 후 호출)
   */
  removeModal: (id: string) => void;

  /**
   * 최상위 모달 닫기
   */
  closeCurrentModal: () => void;

  /**
   * 모든 모달 닫기
   */
  closeAllModals: () => void;

  /**
   * 모달 데이터 업데이트
   */
  updateModalData: <T extends ModalType>(
    id: string,
    data: Partial<ModalDataMap[T]>
  ) => void;
}

type ModalStore = ModalState & ModalActions;

// ============================================================================
// Utilities
// ============================================================================

function generateModalId(): string {
  return `modal_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

// ============================================================================
// Initial State
// ============================================================================

const initialState: ModalState = {
  modals: [],
  currentModal: null,
};

// ============================================================================
// Store
// ============================================================================

export const useModalStore = create<ModalStore>()(
  devtools(
    (set, get) => ({
      ...initialState,

      openModal: <T extends ModalType>(type: T, data: ModalDataMap[T]) => {
        const id = generateModalId();
        const modal: ModalInstance<T> = { id, type, data };

        set(
          (state) => ({
            modals: [...state.modals, modal as ModalInstance],
            currentModal: modal as ModalInstance,
          }),
          false,
          'openModal'
        );

        return id;
      },

      closeModal: (id) => {
        set(
          (state) => ({
            modals: state.modals.map((m) =>
              m.id === id ? { ...m, isClosing: true } : m
            ),
          }),
          false,
          'closeModal'
        );
      },

      removeModal: (id) => {
        set(
          (state) => {
            const modals = state.modals.filter((m) => m.id !== id);
            return {
              modals,
              currentModal: modals[modals.length - 1] || null,
            };
          },
          false,
          'removeModal'
        );
      },

      closeCurrentModal: () => {
        const { currentModal, closeModal } = get();
        if (currentModal) {
          closeModal(currentModal.id);
        }
      },

      closeAllModals: () => {
        set(initialState, false, 'closeAllModals');
      },

      updateModalData: <T extends ModalType>(
        id: string,
        data: Partial<ModalDataMap[T]>
      ) => {
        set(
          (state) => ({
            modals: state.modals.map((modal) =>
              modal.id === id
                ? { ...modal, data: { ...modal.data, ...data } }
                : modal
            ),
          }),
          false,
          'updateModalData'
        );
      },
    }),
    { name: 'ModalStore' }
  )
);

// ============================================================================
// Selectors
// ============================================================================

export const selectModals = (state: ModalStore) => state.modals;
export const selectCurrentModal = (state: ModalStore) => state.currentModal;
export const selectHasOpenModals = (state: ModalStore) => state.modals.length > 0;

/**
 * 특정 타입의 모달이 열려있는지 확인
 */
export const selectIsModalOpen = (type: ModalType) => (state: ModalStore) =>
  state.modals.some((m) => m.type === type);

// ============================================================================
// Hooks (Convenience)
// ============================================================================

/**
 * 확인 다이얼로그 헬퍼
 */
export function useConfirmDialog() {
  const openModal = useModalStore((state) => state.openModal);

  return (options: Omit<ModalDataMap['confirm'], 'onConfirm'> & {
    onConfirm: () => void | Promise<void>;
  }) => {
    return openModal('confirm', options);
  };
}

/**
 * 알림 다이얼로그 헬퍼
 */
export function useAlertDialog() {
  const openModal = useModalStore((state) => state.openModal);

  return (options: ModalDataMap['alert']) => {
    return openModal('alert', options);
  };
}
