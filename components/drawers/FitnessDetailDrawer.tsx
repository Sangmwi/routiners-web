'use client';

import Modal, { ModalBody, ModalFooter } from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import {
  FitnessProfile,
  FITNESS_GOAL_LABELS,
  EXPERIENCE_LEVEL_LABELS,
  EQUIPMENT_ACCESS_LABELS,
  FOCUS_AREA_LABELS,
} from '@/lib/types/fitness';
import { formatKoreanDate } from '@/lib/utils/dateHelpers';
import { useRouter } from 'next/navigation';
import { BarbellIcon } from '@phosphor-icons/react';

interface FitnessDetailDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  profile: FitnessProfile;
}

/**
 * 피트니스 프로필 상세 드로어
 *
 * 그룹화된 정보 표시 + 틴트 태그 스타일
 */
export default function FitnessDetailDrawer({
  isOpen,
  onClose,
  profile,
}: FitnessDetailDrawerProps) {
  const router = useRouter();

  // 기본 정보 아이템
  const infoItems = [
    { label: '운동 목표', value: profile.fitnessGoal ? FITNESS_GOAL_LABELS[profile.fitnessGoal] : null },
    { label: '운동 경험', value: profile.experienceLevel ? EXPERIENCE_LEVEL_LABELS[profile.experienceLevel] : null },
    { label: '주 운동 횟수', value: profile.preferredDaysPerWeek ? `${profile.preferredDaysPerWeek}회` : null },
    { label: '1회 운동 시간', value: profile.sessionDurationMinutes ? `${profile.sessionDurationMinutes}분` : null },
    { label: '장비 접근성', value: profile.equipmentAccess ? EQUIPMENT_ACCESS_LABELS[profile.equipmentAccess] : null },
  ].filter(item => item.value);

  const focusAreas = profile.focusAreas?.length ? profile.focusAreas : null;
  const injuries = profile.injuries?.length ? profile.injuries : null;
  const preferences = profile.preferences?.length ? profile.preferences : null;
  const restrictions = profile.restrictions?.length ? profile.restrictions : null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="운동 프로필 상세"
      position="bottom"
      enableSwipe
      headerAction={
        profile.updatedAt ? (
          <span className="text-[10px] text-muted-foreground bg-muted/50 px-2 py-0.5 rounded-full">
            {formatKoreanDate(profile.updatedAt)}
          </span>
        ) : undefined
      }
    >
      <ModalBody className="p-4 space-y-3">
        {/* 기본 정보 그룹 */}
        {infoItems.length > 0 && (
          <div className="bg-muted/30 rounded-xl p-3">
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

        {/* 집중 부위 - primary 틴트 */}
        {focusAreas && (
          <div className="bg-muted/30 rounded-xl p-3">
            <p className="text-xs font-medium text-muted-foreground mb-2">집중 부위</p>
            <div className="flex flex-wrap gap-1.5">
              {focusAreas.map((area) => (
                <span
                  key={area}
                  className="px-2.5 py-1 text-xs rounded-full bg-primary/10 text-primary font-medium"
                >
                  {FOCUS_AREA_LABELS[area] || area}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* 부상/제한사항 - warning 틴트 */}
        {injuries && (
          <div className="bg-muted/30 rounded-xl p-3">
            <p className="text-xs font-medium text-muted-foreground mb-2">부상/제한사항</p>
            <div className="flex flex-wrap gap-1.5">
              {injuries.map((injury) => (
                <span
                  key={injury}
                  className="px-2.5 py-1 text-xs rounded-full bg-amber-500/10 text-amber-400 font-medium"
                >
                  {injury}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* 선호 운동 */}
        {preferences && (
          <div className="bg-muted/30 rounded-xl p-3">
            <p className="text-xs font-medium text-muted-foreground mb-2">선호 운동</p>
            <div className="flex flex-wrap gap-1.5">
              {preferences.map((pref) => (
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

        {/* 운동 제한 */}
        {restrictions && (
          <div className="bg-muted/30 rounded-xl p-3">
            <p className="text-xs font-medium text-muted-foreground mb-2">피하고 싶은 운동</p>
            <div className="flex flex-wrap gap-1.5">
              {restrictions.map((rest) => (
                <span
                  key={rest}
                  className="px-2.5 py-1 text-xs rounded-full bg-muted text-foreground"
                >
                  {rest}
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
            router.push('/profile/fitness');
          }}
          className="flex-1"
        >
          수정하기
        </Button>
      </ModalFooter>
    </Modal>
  );
}
