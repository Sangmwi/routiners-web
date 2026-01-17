'use client';

import { RobotIcon, SparkleIcon } from '@phosphor-icons/react';

/**
 * AI 페이지 히어로 섹션
 * AI 트레이너의 주요 기능을 소개
 */
export default function AIHeroSection() {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-card p-8 border border-border/50">
      {/* 배경 장식 */}
      <div className="absolute top-0 right-0 -mt-4 -mr-4 h-24 w-24 rounded-full bg-primary/10 blur-2xl" />
      <div className="absolute bottom-0 left-0 -mb-4 -ml-4 h-32 w-32 rounded-full bg-primary/5 blur-2xl" />

      <div className="relative flex flex-col items-center gap-4 text-center">
        {/* 아이콘 */}
        <div className="flex items-center justify-center rounded-full bg-primary/10 p-4 border-2 border-primary/30">
          <RobotIcon size={48} className="text-primary" weight="fill" />
        </div>

        {/* 타이틀 */}
        <div>
          <div className="flex items-center justify-center gap-2 mb-2">
            <h1 className="text-3xl font-bold text-foreground">AI 트레이너</h1>
            <SparkleIcon size={24} className="text-primary animate-pulse" weight="fill" />
          </div>
          <p className="text-muted-foreground">
            AI가 당신의 운동을 실시간으로 분석하고 코칭해줍니다
          </p>
        </div>

        {/* 기능 뱃지 */}
        <div className="flex flex-wrap items-center justify-center gap-2 mt-2">
          <span className="rounded-full bg-card px-3 py-1 text-xs font-medium text-primary border border-primary/20">
            자세 교정
          </span>
          <span className="rounded-full bg-card px-3 py-1 text-xs font-medium text-primary border border-primary/20">
            실시간 피드백
          </span>
          <span className="rounded-full bg-card px-3 py-1 text-xs font-medium text-primary border border-primary/20">
            맞춤 운동 추천
          </span>
        </div>
      </div>
    </div>
  );
}
