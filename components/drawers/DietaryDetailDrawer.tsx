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
 * 그룹화된 정보 표시 + 틴트 태그 스타일
 */
export default function DietaryDetailDrawer({
  isOpen,
  onClose,
  profile,
}: DietaryDetailDrawerProps) {
  const router = useRouter();

  // 기본 정보 아이템
  const infoItems = [
    { label: '식단 목표', value: profile.dietaryGoal ? DIETARY_GOAL_LABELS[profile.dietaryGoal] : null },
    { label: '식단 유형', value: profile.dietType ? DIET_TYPE_LABELS[profile.dietType] : null },
    { label: '하루 식사 횟수', value: profile.mealsPerDay ? `${profile.mealsPerDay}끼` : null },
    { label: '목표 칼로리', value: profile.targetCalories ? `${profile.targetCalories}kcal` : null },
    { label: '목표 단백질', value: profile.targetProtein ? `${profile.targetProtein}g` : null },
    { label: '월 예산', value: profile.budgetPerMonth ? `${profile.budgetPerMonth.toLocaleString()}원` : null },
  ].filter(item => item.value);

  const foodRestrictions = profile.foodRestrictions?.filter(r => r !== 'none');
  const hasRestrictions = foodRestrictions && foodRestrictions.length > 0;
  const hasSources = profile.availableSources && profile.availableSources.length > 0;
  const hasHabits = profile.eatingHabits && profile.eatingHabits.length > 0;
  const hasPreferences = profile.preferences && profile.preferences.length > 0;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="식단 프로필 상세"
      position="bottom"
      enableSwipe
      headerAction={
        profile.updatedAt ? (
          <span className="text-[10px] text-muted-foreground bg-surface-muted px-2 py-0.5 rounded-full">
            {formatKoreanDate(profile.updatedAt)}
          </span>
        ) : undefined
      }
    >
      <ModalBody className="p-4 space-y-3">
        {/* 기본 정보 그룹 */}
        {infoItems.length > 0 && (
          <div className="bg-surface-hover rounded-xl p-3">
            <div className="grid grid-cols-2 gap-x-4 gap-y-3">
              {infoItems.map((item) => (
                <div key={item.label}>
                  <p className="text-xs text-muted-foreground">{item.label}</p>
                  <p className="text-sm font-medium text-foreground">{item.value}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 음식 제한사항 - warning 틴트 */}
        {hasRestrictions && (
          <div className="bg-surface-hover rounded-xl p-3">
            <p className="text-xs font-medium text-muted-foreground mb-2">음식 제한사항</p>
            <div className="flex flex-wrap gap-1.5">
              {foodRestrictions!.map((restriction) => (
                <span
                  key={restriction}
                  className="px-2.5 py-1 text-xs rounded-full bg-warning/10 text-warning font-medium"
                >
                  {FOOD_RESTRICTION_LABELS[restriction] || restriction}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* 이용 가능한 출처 - primary 틴트 */}
        {hasSources && (
          <div className="bg-surface-hover rounded-xl p-3">
            <p className="text-xs font-medium text-muted-foreground mb-2">이용 가능한 출처</p>
            <div className="flex flex-wrap gap-1.5">
              {profile.availableSources!.map((source) => (
                <span
                  key={source}
                  className="px-2.5 py-1 text-xs rounded-full bg-surface-accent text-primary font-medium"
                >
                  {AVAILABLE_SOURCE_LABELS[source] || source}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* 식습관 */}
        {hasHabits && (
          <div className="bg-surface-hover rounded-xl p-3">
            <p className="text-xs font-medium text-muted-foreground mb-2">식습관</p>
            <div className="flex flex-wrap gap-1.5">
              {profile.eatingHabits!.map((habit) => (
                <span
                  key={habit}
                  className="px-2.5 py-1 text-xs rounded-full bg-muted text-foreground"
                >
                  {EATING_HABIT_LABELS[habit] || habit}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* 선호사항 */}
        {hasPreferences && (
          <div className="bg-surface-hover rounded-xl p-3">
            <p className="text-xs font-medium text-muted-foreground mb-2">선호사항</p>
            <div className="flex flex-wrap gap-1.5">
              {profile.preferences!.map((pref) => (
                <span
                  key={pref}
                  className="px-2.5 py-1 text-xs rounded-full bg-muted text-foreground"
                >
                  {pref}
                </span>
              ))}
            </div>
          </div>
        )}
      </ModalBody>

      <ModalFooter>
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
