'use client';

import Modal, { ModalBody } from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import GradientFooter from '@/components/ui/GradientFooter';
import ProfileTagSection from './ProfileTagSection';
import {
  FitnessProfile,
  FITNESS_GOAL_LABELS,
  EXPERIENCE_LEVEL_LABELS,
  EQUIPMENT_ACCESS_LABELS,
  FOCUS_AREA_LABELS,
} from '@/lib/types/fitness';
import { formatKoreanDate } from '@/lib/utils/dateHelpers';
import { useRouter } from 'next/navigation';

interface FitnessDetailSheetProps {
  isOpen: boolean;
  onClose: () => void;
  profile: FitnessProfile;
  readOnly?: boolean;
}

/**
 * 피트니스 프로필 상세 시트
 *
 * 그룹화된 정보 표시 + 틴트 태그 스타일
 */
export default function FitnessDetailSheet({
  isOpen,
  onClose,
  profile,
  readOnly = false,
}: FitnessDetailSheetProps) {
  const router = useRouter();

  // 기본 정보 아이템
  const infoItems = [
    { label: '운동 목표', value: profile.fitnessGoal ? FITNESS_GOAL_LABELS[profile.fitnessGoal] : null },
    { label: '운동 경험', value: profile.experienceLevel ? EXPERIENCE_LEVEL_LABELS[profile.experienceLevel] : null },
    { label: '주 운동 횟수', value: profile.preferredDaysPerWeek ? `${profile.preferredDaysPerWeek}회` : null },
    { label: '1회 운동 시간', value: profile.sessionDurationMinutes ? `${profile.sessionDurationMinutes}분` : null },
    { label: '장비 접근성', value: profile.equipmentAccess ? EQUIPMENT_ACCESS_LABELS[profile.equipmentAccess] : null },
  ].filter(item => item.value);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="운동 프로필 상세"
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
              onClick={() => router.push('/profile/fitness')}
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
          title="집중 부위"
          items={profile.focusAreas}
          labelFn={(a) => FOCUS_AREA_LABELS[a as keyof typeof FOCUS_AREA_LABELS] || a}
          variant="primary"
        />
        <ProfileTagSection
          title="부상/제한사항"
          items={profile.injuries}
          variant="warning"
        />
        <ProfileTagSection
          title="선호 운동"
          items={profile.preferences}
          variant="default"
        />
        <ProfileTagSection
          title="피하고 싶은 운동"
          items={profile.restrictions}
          variant="default"
        />
      </ModalBody>
    </Modal>
  );
}
