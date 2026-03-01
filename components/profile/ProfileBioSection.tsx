'use client';

import SectionHeader from '@/components/ui/SectionHeader';
import EmptyState from '@/components/common/EmptyState';
import Surface from '@/components/ui/Surface';

interface ProfileBioSectionProps {
  bio?: string;
}

export default function ProfileBioSection({ bio }: ProfileBioSectionProps) {
  return (
    <div className="space-y-3">
      <SectionHeader title="소개" />
      <Surface rounded="2xl">
        {bio ? (
          <p className="text-sm text-foreground/90 leading-relaxed whitespace-pre-line">
            {bio}
          </p>
        ) : (
          <EmptyState
            message="소개글이 없어요"
            size="sm"
          />
        )}
      </Surface>
    </div>
  );
}
