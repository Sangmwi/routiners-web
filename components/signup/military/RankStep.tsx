'use client';

import { useState } from 'react';
import { Medal } from 'lucide-react';
import Button from '@/components/ui/Button';
import { SelectionCard, SelectionCardGroup } from '@/components/ui/SelectionCard';
import type { Rank } from '@/lib/types/user';

interface RankStepProps {
  selectedRank: Rank | null;
  enlistmentDate?: string; // YYYY-MM format
  onNext: (rank: Rank) => void;
}

const RANK_OPTIONS: { value: Rank; label: string; monthRange: string }[] = [
  { value: '이병', label: '이병', monthRange: '0~6개월' },
  { value: '일병', label: '일병', monthRange: '6~12개월' },
  { value: '상병', label: '상병', monthRange: '12~18개월' },
  { value: '병장', label: '병장', monthRange: '18개월 이상' },
];

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

    if (monthsDiff >= 18) return '병장';
    if (monthsDiff >= 12) return '상병';
    if (monthsDiff >= 6) return '일병';
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
    <div className="space-y-6">
      {/* Question */}
      <div className="space-y-2">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
            <Medal className="w-6 h-6 text-primary" />
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
          {RANK_OPTIONS.map((option) => (
            <SelectionCard
              key={option.value}
              label={option.label}
              description={option.monthRange}
              selected={rank === option.value}
              onClick={() => setRank(option.value)}
              icon={
                recommendedRank === option.value ? (
                  <span className="text-xs font-bold">추천</span>
                ) : (
                  <Medal className="w-5 h-5" />
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

      {/* Next button */}
      <div className="pt-4">
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
