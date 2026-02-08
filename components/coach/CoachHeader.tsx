'use client';

import { ListIcon, RobotIcon, BarbellIcon, HeartIcon, BrainIcon, LightningIcon } from '@phosphor-icons/react';
import { useRouter } from 'next/navigation';
import { DEFAULT_COACH_PERSONA, type CoachPersona } from '@/lib/constants/aiChat';
import HeaderShell, { HeaderBackButton } from '@/components/layouts/shared/HeaderShell';

interface CoachHeaderProps {
  /** 메뉴 버튼 클릭 */
  onMenuClick: () => void;
  /** 코치 페르소나 (기본값: DEFAULT_COACH_PERSONA) */
  persona?: CoachPersona;
}

/**
 * 페르소나 아이콘 타입에 따른 아이콘 컴포넌트 반환
 */
function PersonaIcon({ iconType, size = 16 }: { iconType: CoachPersona['iconType']; size?: number }) {
  const iconProps = { size, weight: 'fill' as const, className: 'text-primary-foreground' };

  switch (iconType) {
    case 'barbell':
      return <BarbellIcon {...iconProps} />;
    case 'heart':
      return <HeartIcon {...iconProps} />;
    case 'brain':
      return <BrainIcon {...iconProps} />;
    case 'lightning':
      return <LightningIcon {...iconProps} />;
    case 'robot':
    default:
      return <RobotIcon {...iconProps} />;
  }
}

/**
 * 코치 채팅 페이지 헤더
 *
 * - 뒤로가기 버튼
 * - 코치 페르소나 이름 + 아이콘
 * - 메뉴 버튼 (채팅 목록 열기)
 */
export default function CoachHeader({
  onMenuClick,
  persona = DEFAULT_COACH_PERSONA,
}: CoachHeaderProps) {
  const router = useRouter();

  return (
    <HeaderShell sticky={false} className="shrink-0">
      {/* 뒤로가기 */}
      <HeaderBackButton onClick={() => router.push('/routine')} />

      {/* 타이틀: 페르소나 아이콘 + 이름 */}
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-full flex items-center justify-center bg-primary">
          <PersonaIcon iconType={persona.iconType} size={14} />
        </div>
        <h1 className="text-lg font-bold text-foreground">{persona.name}</h1>
      </div>

      {/* 메뉴 버튼 */}
      <button
        type="button"
        onClick={onMenuClick}
        className="p-1 -mr-1 hover:bg-muted/50 rounded-lg transition-colors"
        aria-label="채팅 목록"
      >
        <ListIcon size={24} className="text-foreground" />
      </button>
    </HeaderShell>
  );
}
