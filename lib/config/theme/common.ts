import {
  SpinnerGapIcon, XIcon, PlusIcon, TrashIcon, CaretDownIcon, CaretUpIcon,
  MagnifyingGlassIcon, WarningCircleIcon, CheckCircleIcon, InfoIcon,
  ArrowClockwiseIcon, HeartIcon, ShareNetworkIcon, CheckIcon, ArrowRightIcon,
  CaretRightIcon, DotsThreeIcon, GearIcon, SignOutIcon, BellIcon
} from '@phosphor-icons/react';
import { ICON_SIZE } from './base';

// 로딩/상태
export const STATUS = {
  loading: { icon: SpinnerGapIcon, className: 'animate-spin' },
  error: { icon: WarningCircleIcon },
  success: { icon: CheckCircleIcon },
  info: { icon: InfoIcon },
  check: { icon: CheckIcon },
} as const;

// 액션
export const ACTION = {
  close: { icon: XIcon },
  add: { icon: PlusIcon },
  delete: { icon: TrashIcon },
  refresh: { icon: ArrowClockwiseIcon },
  search: { icon: MagnifyingGlassIcon },
  more: { icon: DotsThreeIcon },
  settings: { icon: GearIcon },
  logout: { icon: SignOutIcon },
  notification: { icon: BellIcon },
} as const;

// UI 컨트롤
export const CONTROL = {
  expand: { icon: CaretDownIcon },
  collapse: { icon: CaretUpIcon },
  next: { icon: CaretRightIcon },
  arrow: { icon: ArrowRightIcon },
} as const;

// 소셜
export const SOCIAL = {
  like: { icon: HeartIcon },
  share: { icon: ShareNetworkIcon },
} as const;

// 버튼 아이콘 크기
export const BUTTON_ICON = {
  sm: ICON_SIZE.xs,
  md: ICON_SIZE.md,
  lg: ICON_SIZE.lg,
} as const;
