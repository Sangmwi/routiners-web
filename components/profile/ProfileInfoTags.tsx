'use client';

import { User } from '@/lib/types';
import { CalendarIcon, CigaretteIcon, CigaretteSlashIcon, GenderMaleIcon, GenderFemaleIcon } from '@phosphor-icons/react';
import SectionHeader from '@/components/ui/SectionHeader';
import Tag from '@/components/ui/Tag';

interface ProfileInfoTagsProps {
  user: User;
}

export default function ProfileInfoTags({ user }: ProfileInfoTagsProps) {
  const getDischargeDate = (enlistmentMonth: string) => {
    // 18개월 복무 기준 (실제로는 정확한 날짜 계산 필요)
    const [year, month] = enlistmentMonth.split('-').map(Number);
    const dischargeYear = year + 1;
    const dischargeMonth = month + 6;

    if (dischargeMonth > 12) {
      return `${dischargeYear + 1}년 ${dischargeMonth - 12}월 전역`;
    }
    return `${dischargeYear}년 ${dischargeMonth}월 전역`;
  };

  const getSmokeStatus = (isSmoker?: boolean) => {
    if (isSmoker === undefined) return '미입력';
    return isSmoker ? '흡연' : '비흡연';
  };

  return (
    <div className="space-y-3">
      <SectionHeader title="내 정보" />

      <div className="bg-surface-secondary rounded-2xl p-4 space-y-2">
        <div className="flex flex-wrap gap-2">
          <Tag icon={user.isSmoker ? CigaretteIcon : CigaretteSlashIcon} inactive={user.isSmoker === undefined}>
            {getSmokeStatus(user.isSmoker)}
          </Tag>

          <Tag icon={CalendarIcon} inactive>
            {getDischargeDate(user.enlistmentMonth)}
          </Tag>

          <Tag icon={ user.gender === 'male' ? GenderMaleIcon : GenderFemaleIcon }>
            {user.gender === 'male' ? '남성' : '여성'}
          </Tag>
        </div>
      </div>
    </div>
  );
}
