'use client';

import { Shield, Users, Award } from 'lucide-react';
import { Rank, Specialty } from '@/lib/types';

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
      <h2 className="text-xl font-bold text-card-foreground">군 정보</h2>

      <div className="space-y-2">
        {/* Rank */}
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-card border border-border/50">
          <Shield className="w-4 h-4 text-muted-foreground flex-shrink-0" />
          <div className="flex-1">
            <p className="text-xs text-muted-foreground mb-0.5">계급</p>
            <p className="text-sm text-card-foreground font-medium">{rank.split('-')[0]}</p>
          </div>
        </div>

        {/* Unit */}
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-card border border-border/50">
          <Users className="w-4 h-4 text-muted-foreground flex-shrink-0" />
          <div className="flex-1">
            <p className="text-xs text-muted-foreground mb-0.5">부대명</p>
            <p className="text-sm text-card-foreground font-medium line-clamp-1">{unitName}</p>
          </div>
        </div>

        {/* Specialty */}
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-card border border-border/50">
          <Award className="w-4 h-4 text-muted-foreground flex-shrink-0" />
          <div className="flex-1">
            <p className="text-xs text-muted-foreground mb-0.5">병과</p>
            <p className="text-sm text-card-foreground font-medium">{specialty}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
