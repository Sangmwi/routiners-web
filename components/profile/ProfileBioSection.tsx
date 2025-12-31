'use client';

import SectionHeader from '@/components/ui/SectionHeader';
import EmptyState from '@/components/common/EmptyState';

interface ProfileBioSectionProps {
  bio?: string;
}

export default function ProfileBioSection({ bio }: ProfileBioSectionProps) {
  return (
    <div className="space-y-3">
      <SectionHeader title="소개" />
      {bio ? (
        <p className="text-sm text-card-foreground/90 leading-relaxed whitespace-pre-line">
          {bio}
        </p>
      ) : (
        <EmptyState
          message="소개글이 없습니다"
          size="sm"
        />
      )}
    </div>
  );
}
