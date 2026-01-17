'use client';

import { ShieldIcon, UsersThreeIcon, MedalIcon } from '@phosphor-icons/react';
import { Rank, Specialty } from '@/lib/types';
import SectionHeader from '@/components/ui/SectionHeader';
import InfoCard from '@/components/ui/InfoCard';

interface ProfileMilitarySectionProps {
  rank: Rank;
  unitName: string;
  specialty: Specialty;
}

export default function ProfileMilitarySection({
  rank,
  unitName,
  specialty,
}: ProfileMilitarySectionProps) {
  return (
    <div className="space-y-3">
      <SectionHeader title="군 정보" />

      <div className="space-y-2">
        <InfoCard
          icon={<ShieldIcon />}
          label="계급"
          value={rank.split('-')[0]}
        />
        <InfoCard
          icon={<UsersThreeIcon />}
          label="부대명"
          value={unitName}
        />
        <InfoCard
          icon={<MedalIcon />}
          label="병과"
          value={specialty}
        />
      </div>
    </div>
  );
}
