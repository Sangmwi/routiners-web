'use client';

import { RobotIcon, SparkleIcon } from '@phosphor-icons/react';
import AppLink from '@/components/common/AppLink';
import type { CounselorConversation } from '@/lib/types/counselor';

interface CounselorButtonProps {
  /** 활성 상담 대화 */
  activeConversation?: CounselorConversation | null;
}

/**
 * AI 상담 접근용 플로팅 버튼
 *
 * 클릭 시 바로 상담 대화방으로 이동
 * - 활성 대화 있음 → 해당 대화로 바로 이동
 * - 활성 대화 없음 → 상담 페이지로 이동 (대화는 첫 메시지 시 lazy 생성)
 */
export default function CounselorButton({
  activeConversation,
}: CounselorButtonProps) {
  const hasActiveConversation = !!activeConversation;
  const hasActivePurpose = !!activeConversation?.metadata?.activePurpose;

  // 활성 대화가 있으면 해당 대화로, 없으면 상담 페이지로 이동
  const href = activeConversation
    ? `/routine/counselor?id=${activeConversation.id}`
    : '/routine/counselor';

  return (
    <AppLink
      href={href}
      className="fixed bottom-(--fab-bottom) right-3 z-40 w-12 h-12 rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/30 flex items-center justify-center hover:shadow-xl hover:scale-105 active:scale-95 transition-all"
      aria-label="AI 상담"
    >
      <RobotIcon size={22} weight="fill" />

      {/* 활성 목적 인디케이터 */}
      {hasActivePurpose && (
        <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-amber-500 flex items-center justify-center">
          <SparkleIcon size={12} weight="fill" className="text-white" />
        </span>
      )}

      {/* 활성 대화 인디케이터 (목적 없을 때) */}
      {hasActiveConversation && !hasActivePurpose && (
        <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-success" />
      )}
    </AppLink>
  );
}
