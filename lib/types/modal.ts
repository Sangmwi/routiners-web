/**
 * 모달/드로어 공통 Props
 *
 * 모든 모달 컴포넌트가 상속하는 기본 인터페이스
 */
export interface BaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** 닫기 애니메이션 완료 후 호출 (ModalProvider에서 실제 제거 등) */
  onExited?: () => void;
}
