'use client';

import { MapPin } from 'lucide-react';
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

      {locations && locations.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {locations.map((location, index) => (
            <Tag key={index} icon={MapPin}>
              {location}
            </Tag>
          ))}
        </div>
      ) : (
        <EmptyState
          message="등록된 운동 장소가 없습니다"
          size="sm"
        />
      )}
    </div>
  );
}
