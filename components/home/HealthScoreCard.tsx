'use client';

interface HealthScoreCardProps {
  score: number;
  onViewDetails?: () => void;
}

export default function HealthScoreCard({ score, onViewDetails }: HealthScoreCardProps) {
  return (
    <section className="rounded-2xl bg-white p-6 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <h2 className="text-2xl font-bold text-green-900 mb-2">삼평오 종합 건강 점수</h2>
          <p className="text-sm text-muted-foreground mb-4">
            *인바디 점수, 운동 루틴, 식단 등을 종합적으로 고려한 점수입니다.
          </p>
          {onViewDetails && (
            <button
              onClick={onViewDetails}
              className="flex items-center gap-1 text-sm text-primary hover:text-green-700 transition-colors"
            >
              자세히 보기
              <span>→</span>
            </button>
          )}
        </div>
        <div className="flex-shrink-0">
          <div className="h-28 w-28 rounded-full bg-gray-300 flex items-center justify-center shadow-inner">
            <span className="text-4xl font-bold text-white">{score}</span>
          </div>
        </div>
      </div>
    </section>
  );
}

