'use client';

import { MapPinIcon } from '@phosphor-icons/react';
import SectionHeader from '@/components/ui/SectionHeader';
import Tag from '@/components/ui/Tag';
import EmptyState from '@/components/common/EmptyState';

interface ProfileLocationsSectionProps {
  locations?: string[];
}

export default function ProfileLocationsSection({ locations }: ProfileLocationsSectionProps) {
  return (
    <div className="space-y-3">
      <SectionHeader title="자주 가는 운동 장소" />

      <div className="bg-muted/20 rounded-2xl p-4">
        {locations && locations.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {locations.map((location, index) => (
              <Tag key={index} icon={MapPinIcon}>
                {location}
              </Tag>
            ))}
          </div>
        ) : (
          <EmptyState
            message="등록된 운동 장소가 없어요"
            size="sm"
          />
        )}
      </div>
    </div>
  );
}
