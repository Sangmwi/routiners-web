'use client';

import SectionHeader from '@/components/ui/SectionHeader';
import Tag from '@/components/ui/Tag';
import EmptyState from '@/components/common/EmptyState';

interface ProfileInterestsTagsProps {
  interests?: string[];
}

export default function ProfileInterestsTags({ interests }: ProfileInterestsTagsProps) {
  return (
    <div className="space-y-3">
      <SectionHeader title="관심 종목" />

      <div className="bg-muted/20 rounded-2xl p-4">
        {interests && interests.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {interests.map((interest, index) => (
              <Tag key={index} variant="muted">
                {interest}
              </Tag>
            ))}
          </div>
        ) : (
          <EmptyState
            message="관심 종목이 없어요"
            size="sm"
          />
        )}
      </div>
    </div>
  );
}
