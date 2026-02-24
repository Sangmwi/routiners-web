/**
 * Zustand Stores
 *
 * 전역 상태 관리를 위한 스토어들
 *
 * 사용 가이드:
 * - 서버 상태: React Query 사용 (API 데이터, 캐싱)
 * - 클라이언트 상태: Zustand 사용 (UI 상태, 모달, 앱 설정)
 */

// Modal Store - 모달 관리
export {
  useModalStore,
  selectModals,
  selectCurrentModal,
  selectHasOpenModals,
  selectIsModalOpen,
  useConfirmDialog,
  useAlertDialog,
} from './modalStore';

export type {
  ModalType,
  ModalDataMap,
  ModalInstance,
} from './modalStore';

// Error Store - 에러 토스트 관리
export {
  useErrorStore,
  selectErrorMessage,
  selectHasError,
  useShowError,
  useError,
} from './errorStore';
