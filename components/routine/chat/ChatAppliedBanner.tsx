'use client';

import { Check } from 'lucide-react';

interface ChatAppliedBannerProps {
  /** 타입: workout (루틴) 또는 meal (식단) */
  type: 'workout' | 'meal';
  /** 생성된 이벤트 수 */
  eventsCreated: number;
  /** 시작 날짜 */
  startDate: string;
}

/**
 * 적용 완료 인라인 메시지
 * 
 * 채팅 내에서 간결하게 표시되는 시스템 메시지 스타일
 */
export function ChatAppliedBanner({
  type,
}: ChatAppliedBannerProps) {
  const isMeal = type === 'meal';

  return (
    <div className="flex justify-center py-4">
      <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs bg-primary/10 text-primary">
        <Check className="w-3.5 h-3.5" />
        <span>{isMeal ? '식단이 캘린더에 추가됨' : '루틴이 캘린더에 추가됨'}</span>
      </div>
    </div>
  );
}
