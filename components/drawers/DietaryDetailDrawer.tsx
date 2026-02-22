'use client';

import Modal, { ModalBody, ModalFooter } from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import {
  DietaryProfile,
  DIETARY_GOAL_LABELS,
  DIET_TYPE_LABELS,
  FOOD_RESTRICTION_LABELS,
  AVAILABLE_SOURCE_LABELS,
  EATING_HABIT_LABELS,
} from '@/lib/types/meal';
import { formatKoreanDate } from '@/lib/utils/dateHelpers';
import { useRouter } from 'next/navigation';

interface DietaryDetailDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  profile: DietaryProfile;
}

/**
 * 식단 프로필 상세 드로어
 *
 * FitnessDetailDrawer와 동일 패턴
 */
export default function DietaryDetailDrawer({
  isOpen,
  onClose,
  profile,
}: DietaryDetailDrawerProps) {
  const router = useRouter();

  const renderInfoItem = (label: string, value: string | undefined | null) => {
    if (!value) return null;
    return (
      <div className="flex justify-between py-2 border-b border-border/30 last:border-b-0">
        <span className="text-sm text-muted-foreground">{label}</span>
        <span className="text-sm font-medium text-foreground">{value}</span>
      </div>
    );
  };

  const renderTagList = (
    label: string,
    items: string[] | undefined,
    labelMap?: Record<string, string>
  ) => {
    if (!items || items.length === 0) return null;

    return (
      <div className="py-3 border-b border-border/30 last:border-b-0">
        <span className="text-sm text-muted-foreground block mb-2">{label}</span>
        <div className="flex flex-wrap gap-2">
          {items.map((item, index) => (
            <span
              key={index}
              className="px-2.5 py-1 text-xs rounded-full bg-muted text-foreground"
            >
              {labelMap ? labelMap[item] || item : item}
            </span>
          ))}
        </div>
      </div>
    );
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="식단 프로필 상세"
      size="lg"
      position="bottom"
      enableSwipe
    >
      <ModalBody className="p-4 space-y-1">
        {/* 기본 정보 */}
        <div className="space-y-1">
          {renderInfoItem(
            '식단 목표',
            profile.dietaryGoal ? DIETARY_GOAL_LABELS[profile.dietaryGoal] : undefined
          )}
          {renderInfoItem(
            '식단 유형',
            profile.dietType ? DIET_TYPE_LABELS[profile.dietType] : undefined
          )}
          {renderInfoItem(
            '하루 식사 횟수',
            profile.mealsPerDay ? `${profile.mealsPerDay}끼` : undefined
          )}
          {renderInfoItem(
            '목표 칼로리',
            profile.targetCalories ? `${profile.targetCalories}kcal` : undefined
          )}
          {renderInfoItem(
            '목표 단백질',
            profile.targetProtein ? `${profile.targetProtein}g` : undefined
          )}
          {renderInfoItem(
            '월 예산',
            profile.budgetPerMonth ? `${profile.budgetPerMonth.toLocaleString()}원` : undefined
          )}
        </div>

        {/* 음식 제한사항 */}
        {renderTagList(
          '음식 제한사항',
          profile.foodRestrictions?.filter(r => r !== 'none'),
          FOOD_RESTRICTION_LABELS
        )}

        {/* 이용 가능한 식단 출처 */}
        {renderTagList(
          '이용 가능한 출처',
          profile.availableSources,
          AVAILABLE_SOURCE_LABELS
        )}

        {/* 식습관 */}
        {renderTagList(
          '식습관',
          profile.eatingHabits,
          EATING_HABIT_LABELS
        )}

        {/* 선호사항 */}
        {profile.preferences && profile.preferences.length > 0 && (
          <div className="py-3 border-b border-border/30 last:border-b-0">
            <span className="text-sm text-muted-foreground block mb-2">선호사항</span>
            <p className="text-sm text-foreground">{profile.preferences.join(', ')}</p>
          </div>
        )}

        {/* 마지막 업데이트 */}
        {profile.updatedAt && (
          <p className="text-xs text-muted-foreground text-center pt-4">
            마지막 업데이트: {formatKoreanDate(profile.updatedAt)}
          </p>
        )}
      </ModalBody>

      <ModalFooter>
        <Button variant="outline" onClick={onClose} className="flex-1">
          닫기
        </Button>
        <Button
          variant="primary"
          onClick={() => {
            onClose();
            router.push('/profile/dietary');
          }}
          className="flex-1"
        >
          수정하기
        </Button>
      </ModalFooter>
    </Modal>
  );
}
