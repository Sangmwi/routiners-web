import { HouseIcon, CalendarIcon, UsersThreeIcon, UserCircleIcon, CaretLeftIcon, CaretRightIcon } from '@phosphor-icons/react';
import { ICON_SIZE, ICON_WEIGHT } from './base';

// 하단 네비게이션
export const BOTTOM_NAV = {
  items: [
    { key: 'home', label: '홈', href: '/', icon: HouseIcon },
    { key: 'routine', label: '루틴', href: '/routine', icon: CalendarIcon },
    { key: 'community', label: '커뮤니티', href: '/community', icon: UsersThreeIcon },
    { key: 'profile', label: '프로필', href: '/profile', icon: UserCircleIcon },
  ],
  style: {
    size: ICON_SIZE.lg,
    activeWeight: ICON_WEIGHT.active,       // fill
    inactiveWeight: ICON_WEIGHT.inactive,   // regular
    activeColor: 'text-foreground',
    inactiveColor: 'text-muted-foreground',
  },
} as const;

// 헤더 네비게이션
export const HEADER_NAV = {
  back: { icon: CaretLeftIcon, size: ICON_SIZE.lg },
  forward: { icon: CaretRightIcon, size: ICON_SIZE.md },
} as const;
