'use client';

interface RestTimerProps {
  remaining: number;
  total: number;
  onSkip: () => void;
}

/**
 * 세트 간 휴식 카운트다운 타이머
 */
export default function RestTimer({ remaining, total, onSkip }: RestTimerProps) {
  const minutes = Math.floor(remaining / 60);
  const seconds = remaining % 60;
  const progress = total > 0 ? remaining / total : 0;

  return (
    <div className="flex flex-col items-center gap-3 py-4">
      {/* 프로그레스 바 */}
      <div className="w-full h-1.5 bg-muted/30 rounded-full overflow-hidden">
        <div
          className="h-full bg-primary rounded-full transition-all duration-1000 ease-linear"
          style={{ width: `${progress * 100}%` }}
        />
      </div>

      {/* 시간 표시 */}
      <div className="text-center">
        <p className="text-xs text-muted-foreground mb-1">휴식 시간</p>
        <p className="text-3xl font-bold text-foreground tabular-nums">
          {minutes > 0 ? `${minutes}:${String(seconds).padStart(2, '0')}` : `${seconds}초`}
        </p>
      </div>

      {/* 건너뛰기 */}
      <button
        onClick={onSkip}
        className="text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        건너뛰기
      </button>
    </div>
  );
}
