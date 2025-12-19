'use client';

import { MapPin } from 'lucide-react';

interface ProfileLocationCardProps {
  location: string;
}

export default function ProfileLocationCard({ location }: ProfileLocationCardProps) {
  return (
    <div className="rounded-[20px] bg-card p-4 shadow-sm border border-border/50">
      <div className="flex items-start gap-3">
        <MapPin className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
        <p className="text-xs text-card-foreground leading-5">{location}</p>
      </div>
    </div>
  );
}
