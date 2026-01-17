import type { Icon as PhosphorIcon } from '@phosphor-icons/react';

// Phosphor Weight 타입
export type IconWeight = 'thin' | 'light' | 'regular' | 'bold' | 'fill' | 'duotone';

// 크기 표준
export const ICON_SIZE = {
  xs: 12,    // 뱃지 내 아이콘
  sm: 16,    // 캘린더 미니 아이콘
  md: 20,    // 버튼 아이콘
  lg: 24,    // 네비게이션 아이콘
  xl: 32,    // Empty State
  '2xl': 48, // Hero 섹션
} as const;

// Weight 시맨틱 매핑
export const ICON_WEIGHT = {
  inactive: 'regular',   // 비활성
  active: 'fill',        // 활성
  scheduled: 'duotone',  // 예정
  completed: 'fill',     // 완료
  skipped: 'thin',       // 건너뜀
  emphasis: 'bold',      // 강조
} as const;

// 공통 유틸
export type PhosphorIconComponent = PhosphorIcon;
