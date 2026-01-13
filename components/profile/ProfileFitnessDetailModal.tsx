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

interface ProfileFitnessDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: FitnessProfile;
}

/**
 * 피트니스 프로필 상세 모달
 *
 * 모든 피트니스 프로필 정보를 상세하게 표시
 */
export default function ProfileFitnessDetailModal({
  isOpen,
  onClose,
  profile,
}: ProfileFitnessDetailModalProps) {
  // 정보 항목 렌더링 헬퍼
  const renderInfoItem = (label: string, value: string | undefined | null) => {
    if (!value) return null;
    return (
      <div className="flex justify-between py-2 border-b border-border/30 last:border-b-0">
        <span className="text-sm text-muted-foreground">{label}</span>
        <span className="text-sm font-medium text-foreground">{value}</span>
      </div>
    );
  };

  // 태그 목록 렌더링 헬퍼
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
      title="운동 프로필 상세"
      size="lg"
      position="bottom"
      enableSwipe
    >
      <ModalBody className="space-y-1">
        {/* 기본 정보 */}
        <div className="space-y-1">
          {renderInfoItem(
            '운동 목표',
            profile.fitnessGoal ? FITNESS_GOAL_LABELS[profile.fitnessGoal] : undefined
          )}
          {renderInfoItem(
            '운동 경험',
            profile.experienceLevel
              ? EXPERIENCE_LEVEL_LABELS[profile.experienceLevel]
              : undefined
          )}
          {renderInfoItem(
            '주 운동 횟수',
            profile.preferredDaysPerWeek
              ? `${profile.preferredDaysPerWeek}회`
              : undefined
          )}
          {renderInfoItem(
            '1회 운동 시간',
            profile.sessionDurationMinutes
              ? `${profile.sessionDurationMinutes}분`
              : undefined
          )}
          {renderInfoItem(
            '장비 접근성',
            profile.equipmentAccess
              ? EQUIPMENT_ACCESS_LABELS[profile.equipmentAccess]
              : undefined
          )}
        </div>

        {/* 집중 부위 */}
        {renderTagList('집중 부위', profile.focusAreas, FOCUS_AREA_LABELS)}

        {/* 부상/제한사항 */}
        {renderTagList('부상/제한사항', profile.injuries)}

        {/* 선호 운동 */}
        {renderTagList('선호 운동', profile.preferences)}

        {/* 운동 제한 */}
        {renderTagList('운동 제한', profile.restrictions)}

        {/* 마지막 업데이트 */}
        {profile.updatedAt && (
          <p className="text-xs text-muted-foreground text-center pt-4">
            마지막 업데이트:{' '}
            {new Date(profile.updatedAt).toLocaleDateString('ko-KR', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
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
            window.location.href = '/profile/fitness';
          }}
          className="flex-1"
        >
          수정하기
        </Button>
      </ModalFooter>
    </Modal>
  );
}
