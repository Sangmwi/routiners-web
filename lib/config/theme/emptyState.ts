import type { Icon } from '@phosphor-icons/react';
import {
  ScalesIcon, BarbellIcon, BowlFoodIcon, LockIcon,
  CalendarBlankIcon, CalendarIcon, UsersThreeIcon,
  UserFocusIcon, ImageSquareIcon,
} from '@phosphor-icons/react';

// ── 타입 ──────────────────────────────────────────────

interface EmptyStatePreset {
  icon: Icon;
  message: string;
  hint?: string;
  variant?: 'default' | 'private' | 'error';
}

// ── 프리셋 레지스트리 ─────────────────────────────────

export const EMPTY_STATE = {
  inbody: {
    noRecord: {
      icon: ScalesIcon,
      message: '인바디 기록이 없어요',
      hint: '체중, 골격근량, 체지방률을 기록해보세요',
    },
    private: {
      icon: LockIcon,
      message: '인바디 정보가 비공개예요',
      hint: '프로필 편집에서 정보 공개를 설정할 수 있어요',
      variant: 'private' as const,
    },
  },

  big3: {
    noRecord: {
      icon: BarbellIcon,
      message: '3대 운동 기록이 없어요',
      hint: '운동 기록에서 자동으로 반영돼요',
    },
  },

  workout: {
    noRecord: {
      icon: BarbellIcon,
      message: '운동 기록이 없어요',
      hint: '이 기간에 기록된 운동이 없어요',
    },
    noDetail: {
      icon: BarbellIcon,
      message: '상세 운동 정보가 없어요',
    },
    noProfile: {
      icon: BarbellIcon,
      message: '운동 프로필이 없어요',
      hint: 'AI 트레이너와 대화하거나 직접 등록해보세요',
    },
  },

  meal: {
    noRecord: {
      icon: BowlFoodIcon,
      message: '식단 기록이 없어요',
      hint: '이 기간에 기록된 식단이 없어요',
    },
    noDetail: {
      icon: BowlFoodIcon,
      message: '상세 식단 정보가 없어요',
    },
    noProfile: {
      icon: BowlFoodIcon,
      message: '식단 프로필이 없어요',
      hint: 'AI 상담사와 대화하거나 직접 등록해보세요',
    },
  },

  routine: {
    noRoutine: {
      icon: CalendarBlankIcon,
      message: '아직 등록된 루틴이 없어요',
      hint: 'AI 코치와 대화하면 맞춤 루틴을 만들어줘요',
    },
    emptyWeek: {
      icon: CalendarBlankIcon,
      message: '이번 주에는 예정된 루틴이 없어요',
    },
    noEvent: {
      icon: CalendarIcon,
    },
  },

  community: {
    noFollowing: {
      icon: UsersThreeIcon,
      message: '팔로우한 사용자의 글이 여기에 표시돼요',
      hint: '관심있는 사용자를 팔로우해보세요',
    },
    searchPending: {
      icon: UserFocusIcon,
      message: '사용자 검색 기능 준비 중이에요',
      hint: '곧 다른 회원을 찾고 팔로우할 수 있어요',
    },
    noActivity: {
      icon: ImageSquareIcon,
      message: '아직 활동이 없어요',
    },
  },
} as const satisfies Record<string, Record<string, Partial<EmptyStatePreset>>>;

export type EmptyStateDomain = keyof typeof EMPTY_STATE;
