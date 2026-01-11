'use client';

import { Loader2 } from 'lucide-react';

interface ChatProgressIndicatorProps {
  /** 진행률 (0-100) */
  progress: number;
  /** 현재 단계 설명 */
  stage: string;
  /** 타입: workout (루틴) 또는 meal (식단) */
  variant: 'workout' | 'meal';
}

const VARIANT_STYLES = {
  workout: {
    iconBg: 'bg-primary text-primary-foreground',
    progressBar: 'bg-primary',
    text: '루틴',
  },
  meal: {
    iconBg: 'bg-lime-500 text-white',
    progressBar: 'bg-lime-500',
    text: '식단',
  },
} as const;

/**
 * 채팅 내 진행률 표시 컴포넌트
 *
 * 루틴/식단 생성 진행 상황을 프로그레스 바로 표시
 */
export function ChatProgressIndicator({
  progress,
  stage,
  variant,
}: ChatProgressIndicatorProps) {
  const styles = VARIANT_STYLES[variant];

  return (
    <div className="flex gap-3 items-start my-4">
      <div
        className={`shrink-0 w-8 h-8 rounded-full ${styles.iconBg} flex items-center justify-center`}
      >
        <Loader2 className="w-4 h-4 animate-spin" />
      </div>
      <div className="flex-1 bg-card border border-border rounded-2xl rounded-tl-md px-4 py-3">
        <p className="text-sm font-medium text-foreground mb-2">
          {styles.text} 생성 중... {progress}%
        </p>
        <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
          <div
            className={`${styles.progressBar} h-full rounded-full transition-all duration-300 ease-out`}
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="text-xs text-muted-foreground mt-2">{stage}</p>
      </div>
    </div>
  );
}
