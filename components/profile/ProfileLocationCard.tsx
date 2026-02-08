'use client';

import { MapPinIcon } from '@phosphor-icons/react';

interface ProfileLocationCardProps {
  location: string;
}

export default function ProfileLocationCard({ location }: ProfileLocationCardProps) {
  return (
    <div className="flex items-center gap-2 px-1">
      <MapPinIcon size={16} className="text-muted-foreground flex-shrink-0" />
      <p className="text-sm text-muted-foreground">{location}</p>
    </div>
  );
}
