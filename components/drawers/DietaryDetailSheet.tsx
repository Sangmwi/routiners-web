'use client';

import Modal, { ModalBody } from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import GradientFooter from '@/components/ui/GradientFooter';
import ProfileTagSection from './ProfileTagSection';
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

interface DietaryDetailSheetProps {
  isOpen: boolean;
  onClose: () => void;
  profile: DietaryProfile;
  readOnly?: boolean;
}

/**
 * 식단 프로필 상세 시트
 *
 * 그룹화된 정보 표시 + 틴트 태그 스타일
 */
export default function DietaryDetailSheet({
  isOpen,
  onClose,
  profile,
  readOnly = false,
}: DietaryDetailSheetProps) {
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

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="식단 프로필 상세"
      position="bottom"
      height="auto"
      enableSwipe
      headerAction={
        profile.updatedAt ? (
          <span className="text-[10px] text-muted-foreground bg-surface-muted px-2 py-0.5 rounded-full">
            {formatKoreanDate(profile.updatedAt)}
          </span>
        ) : undefined
      }
      stickyFooter={
        <GradientFooter variant="sheet">
          {readOnly ? (
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1 w-full"
            >
              닫기
            </Button>
          ) : (
            <Button
              variant="primary"
              onClick={() => router.push('/profile/dietary')}
              className="flex-1 w-full"
            >
              수정하기
            </Button>
          )}
        </GradientFooter>
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

        <ProfileTagSection
          title="음식 제한사항"
          items={profile.foodRestrictions?.filter(r => r !== 'none')}
          labelFn={(r) => FOOD_RESTRICTION_LABELS[r as keyof typeof FOOD_RESTRICTION_LABELS] || r}
          variant="warning"
        />
        <ProfileTagSection
          title="이용 가능한 출처"
          items={profile.availableSources}
          labelFn={(s) => AVAILABLE_SOURCE_LABELS[s as keyof typeof AVAILABLE_SOURCE_LABELS] || s}
          variant="primary"
        />
        <ProfileTagSection
          title="식습관"
          items={profile.eatingHabits}
          labelFn={(h) => EATING_HABIT_LABELS[h as keyof typeof EATING_HABIT_LABELS] || h}
          variant="default"
        />
        <ProfileTagSection
          title="선호사항"
          items={profile.preferences}
          variant="default"
        />
      </ModalBody>
    </Modal>
  );
}
