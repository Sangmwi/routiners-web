/**
 * Timing Constants
 *
 * 프로젝트 전체에서 사용되는 타이밍/지연 관련 상수 모음.
 * 동일한 ms 값이 여러 파일에 분산 정의되는 것을 방지.
 */
export const TIMING = {
  CACHE: {
    /** 기본 staleTime: 5분 (일반 데이터) */
    STALE_DEFAULT: 5 * 60 * 1000,
    /** 활성 세션 staleTime: 30초 */
    STALE_ACTIVE: 30 * 1000,
    /** 검색 결과 staleTime: 1분 */
    STALE_SEARCH: 1 * 60 * 1000,
    /** 짧은 staleTime: 2분 */
    STALE_SHORT: 2 * 60 * 1000,
    /** 중간 staleTime: 3분 */
    STALE_MEDIUM: 3 * 60 * 1000,
    /** GC 유지 시간: 30분 */
    GC: 30 * 60 * 1000,
  },
  SESSION: {
    /** 세션 갱신 쿨다운: 5분 */
    REFRESH_COOLDOWN: 5 * 60 * 1000,
    /** 세션 갱신 임계값: 만료 10분 전 */
    REFRESH_THRESHOLD: 10 * 60 * 1000,
  },
  UI: {
    /** 저장 애니메이션 → 닫힘 지연: 500ms */
    SAVE_ANIMATION: 500,
    /** 저장 완료 후 패널 닫기 지연: 600ms */
    SAVE_AND_CLOSE: 600,
    /** 최소 로딩 표시 시간: 500ms */
    MINIMUM_LOADING: 500,
    /** 바텀시트 닫힘 후 다음 시트 열기 지연: 250ms */
    SHEET_CLOSE: 250,
    /** 닉네임 중복체크 디바운스: 500ms */
    DEBOUNCE_NICKNAME: 500,
    /** 애니메이션 완료 후 처리 지연: 100ms */
    ANIMATION_DELAY: 100,
    /** 스크롤 종료 디바운스: 100ms */
    SCROLL_END_DEBOUNCE: 100,
    /** 포커스/스크롤 딜레이: 300ms */
    FOCUS_DELAY: 300,
    /** 스크롤 위치 복원 지연: 100ms */
    SCROLL_DELAY: 100,
    /** 에러 토스트 자동 해제: 5000ms */
    ERROR_TOAST: 5000,
  },
} as const;
