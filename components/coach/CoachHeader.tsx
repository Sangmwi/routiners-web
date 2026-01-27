'use client';

import { ArrowLeftIcon, ListIcon } from '@phosphor-icons/react';
import { useRouter } from 'next/navigation';

interface CoachHeaderProps {
  /** 메뉴 버튼 클릭 */
  onMenuClick: () => void;
  /** 현재 활성 목적 여부 */
  hasActivePurpose?: boolean;
}

/**
 * 코치 채팅 페이지 헤더
 *
 * - 뒤로가기 버튼
 * - 타이틀
 * - 메뉴 버튼 (채팅 목록 열기)
 */
export default function CoachHeader({
  onMenuClick,
  hasActivePurpose,
}: CoachHeaderProps) {
  const router = useRouter();

  const handleBack = () => {
    router.push('/routine');
  };

  return (
    <header className="shrink-0 flex items-center justify-between px-4 py-3 border-b border-border bg-background">
      {/* 뒤로가기 */}
      <button
        onClick={handleBack}
        className="p-2 -ml-2 rounded-full hover:bg-muted/50 active:bg-muted transition-colors"
        aria-label="뒤로가기"
      >
        <ArrowLeftIcon size={24} className="text-foreground" />
      </button>

      {/* 타이틀 */}
      <div className="flex items-center gap-2">
        <h1 className="text-lg font-semibold text-foreground">코치</h1>
        {hasActivePurpose && (
          <span className="px-2 py-0.5 text-xs rounded-full bg-primary/10 text-primary font-medium">
            진행 중
          </span>
        )}
      </div>

      {/* 메뉴 버튼 */}
      <button
        onClick={onMenuClick}
        className="p-2 -mr-2 rounded-full hover:bg-muted/50 active:bg-muted transition-colors"
        aria-label="채팅 목록"
      >
        <ListIcon size={24} className="text-foreground" />
      </button>
    </header>
  );
}
