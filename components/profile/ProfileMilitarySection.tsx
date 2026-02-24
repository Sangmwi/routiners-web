'use client';

import { ShieldIcon, UsersThreeIcon, MedalIcon } from '@phosphor-icons/react';
import { Rank, Specialty } from '@/lib/types';
import SectionHeader from '@/components/ui/SectionHeader';
import InfoCard from '@/components/ui/InfoCard';

interface ProfileMilitarySectionProps {
  rank: Rank;
  unitName: string;
  specialty: Specialty;
  /** false이면 SectionHeader와 카드 컨테이너 없이 콘텐츠만 반환 */
  renderHeader?: boolean;
}

export default function ProfileMilitarySection({
  rank,
  unitName,
  specialty,
  renderHeader = true,
}: ProfileMilitarySectionProps) {
  const content = (
    <div className={renderHeader ? 'bg-surface-secondary rounded-2xl divide-y divide-edge-subtle' : 'divide-y divide-edge-subtle'}>
      <InfoCard
        icon={<ShieldIcon />}
        label="계급"
        value={rank.split('-')[0]}
        variant="flat"
      />
      <InfoCard
        icon={<UsersThreeIcon />}
        label="부대명"
        value={unitName}
        variant="flat"
      />
      <InfoCard
        icon={<MedalIcon />}
        label="병과"
        value={specialty}
        variant="flat"
      />
    </div>
  );

  if (!renderHeader) return content;

  return (
    <div className="space-y-3">
      <SectionHeader title="군 정보" />
      {content}
    </div>
  );
}
