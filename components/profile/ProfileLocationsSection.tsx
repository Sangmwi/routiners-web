'use client';

import { MapPin } from 'lucide-react';

interface ProfileLocationsSectionProps {
  locations?: string[];
}

export default function ProfileLocationsSection({ locations }: ProfileLocationsSectionProps) {
  return (
    <div className="space-y-3">
      <h2 className="text-xl font-bold text-card-foreground">자주 가는 운동 장소</h2>

      {locations && locations.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {locations.map((location, index) => (
            <div
              key={index}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[14px] bg-card text-xs text-card-foreground border border-border/50"
            >
              <MapPin className="w-3.5 h-3.5 text-muted-foreground" />
              {location}
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground italic">
          등록된 운동 장소가 없습니다
        </p>
      )}
    </div>
  );
}
