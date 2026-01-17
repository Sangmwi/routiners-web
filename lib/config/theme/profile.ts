import {
  UserCircleIcon, ShieldIcon, MedalIcon, MapPinIcon, BriefcaseIcon, BuildingsIcon,
  RulerIcon, ScalesIcon, CalendarIcon, CigaretteIcon, PencilSimpleIcon,
  ChartBarIcon, TrendUpIcon, TrendDownIcon, LockIcon, EyeIcon
} from '@phosphor-icons/react';
import { ICON_SIZE } from './base';

// 군 정보
export const MILITARY = {
  rank: { icon: MedalIcon, label: '계급' },
  unit: { icon: BuildingsIcon, label: '부대' },
  specialty: { icon: BriefcaseIcon, label: '병과' },
  verification: { icon: ShieldIcon, label: '인증' },
} as const;

// 신체 정보
export const BODY_INFO = {
  height: { icon: RulerIcon, label: '신장' },
  weight: { icon: ScalesIcon, label: '체중' },
  age: { icon: CalendarIcon, label: '나이' },
  smoking: { icon: CigaretteIcon, label: '흡연' },
} as const;

// 인바디
export const INBODY = {
  chart: { icon: ChartBarIcon },
  trendUp: { icon: TrendUpIcon },
  trendDown: { icon: TrendDownIcon },
  private: { icon: LockIcon },
  public: { icon: EyeIcon },
} as const;

// 프로필 액션
export const PROFILE_ACTION = {
  edit: { icon: PencilSimpleIcon, size: ICON_SIZE.md },
  location: { icon: MapPinIcon, size: ICON_SIZE.md },
  user: { icon: UserCircleIcon, size: ICON_SIZE.lg },
} as const;
