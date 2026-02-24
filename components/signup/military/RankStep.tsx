'use client';

import { useState } from 'react';
import { MedalIcon } from '@phosphor-icons/react';
import Button from '@/components/ui/Button';
import { SelectionCard, SelectionCardGroup } from '@/components/ui/SelectionCard';
import { RANKS, RANK_LABELS, type Rank } from '@/lib/types/user';

interface RankStepProps {
  selectedRank: Rank | null;
  enlistmentDate?: string; // YYYY-MM format
  onNext: (rank: Rank) => void;
}

// 가입 전용: 계급별 복무 기간 (RANKS 순서와 동일)
const RANK_MONTH_RANGES: Record<Rank, string> = {
  '이병': '0~2개월',
  '일병': '2~8개월',
  '상병': '8~14개월',
  '병장': '14개월 이상',
};

/**
 * RankStep
 *
 * 계급 선택 (토스식)
 * - 4개 선택지 카드
 * - 입대일 기반 유효성 힌트
 */
export function RankStep({
  selectedRank,
  enlistmentDate,
  onNext,
}: RankStepProps) {
  const [rank, setRank] = useState<Rank | null>(selectedRank);

  // 입대일 기준 권장 계급 계산
  const getRecommendedRank = (): Rank | null => {
    if (!enlistmentDate) return null;

    const [year, month] = enlistmentDate.split('-').map(Number);
    const enlistment = new Date(year, month - 1);
    const now = new Date();
    const monthsDiff = (now.getFullYear() - enlistment.getFullYear()) * 12 +
      (now.getMonth() - enlistment.getMonth());

    if (monthsDiff >= 14) return '병장';
    if (monthsDiff >= 8) return '상병';
    if (monthsDiff >= 2) return '일병';
    return '이병';
  };

  const recommendedRank = getRecommendedRank();
  const isValid = rank !== null;

  const handleNext = () => {
    if (rank) {
      onNext(rank);
    }
  };

  return (
    <div className="flex flex-col h-full w-full">
      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="space-y-6">
          {/* Question */}
          <div className="space-y-2">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-surface-accent flex items-center justify-center">
                <MedalIcon size={24} className="text-primary" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-foreground">
              현재 계급이 무엇인가요?
            </h2>
            <p className="text-muted-foreground">
              현재 본인의 계급을 선택해 주세요
            </p>
          </div>

          {/* Selection Cards */}
          <div>
            <SelectionCardGroup gap="md">
              {RANKS.map((r) => (
                <SelectionCard
                  key={r}
                  label={RANK_LABELS[r]}
                  description={RANK_MONTH_RANGES[r]}
                  selected={rank === r}
                  onClick={() => setRank(r)}
                  icon={
                    recommendedRank === r ? (
                      <span className="text-xs font-bold">추천</span>
                    ) : (
                      <MedalIcon size={20} />
                    )
                  }
                />
              ))}
            </SelectionCardGroup>

            {/* Recommendation hint */}
            {recommendedRank && (
              <p className="mt-4 text-xs text-muted-foreground text-center">
                입대일 기준 예상 계급:{' '}
                <span className="font-semibold text-primary">{recommendedRank}</span>
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Fixed Footer */}
      <div className="shrink-0 pt-6 pb-safe">
        <Button
          variant="primary"
          size="lg"
          fullWidth
          onClick={handleNext}
          disabled={!isValid}
        >
          다음
        </Button>
      </div>
    </div>
  );
}
