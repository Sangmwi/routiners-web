'use client';

import ScoreFlag from '@/assets/icons/score-flag.svg';
import ViewMoreButton from '@/components/ui/ViewMoreButton';

interface HealthScoreCardProps {
  score: number;
  onViewDetails?: () => void;
}

export default function HealthScoreCard({ score, onViewDetails }: HealthScoreCardProps) {
  return (
    <section className="rounded-2xl bg-card p-6 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <h2 className="text-xl font-bold text-card-foreground mb-2">종합 건강 점수</h2>
          <p className="text-xs text-card-foreground/70 mb-4">
            인바디 점수, 운동 루틴, 식단 등을 종합적으로 산출한 점수입니다.
          </p>
          {onViewDetails && (
            <ViewMoreButton onClick={onViewDetails}>
              자세히 보기
            </ViewMoreButton>
          )}
        </div>
        <div className="flex-shrink-0 relative -translate-y-1 translate-x-1">
          <ScoreFlag className="h-24 fill-primary/90" />
          <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-2/3 text-3xl font-bold text-white">
            {score}
          </span>
        </div>
      </div>
    </section>
  );
}

