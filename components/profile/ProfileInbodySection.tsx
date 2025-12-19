'use client';

import { Activity, Scale, Percent } from 'lucide-react';

interface ProfileInbodySectionProps {
  muscleMass?: number;
  bodyFatPercentage?: number;
  weight?: number;
  showInbodyPublic?: boolean;
}

export default function ProfileInbodySection({
  muscleMass,
  bodyFatPercentage,
  weight,
  showInbodyPublic = true,
}: ProfileInbodySectionProps) {
  // Don't show section if user has disabled public display
  if (showInbodyPublic === false) {
    return null;
  }

  const hasAnyData = muscleMass || bodyFatPercentage || weight;

  return (
    <div className="space-y-3">
      <h2 className="text-xl font-bold text-card-foreground">인바디 정보</h2>

      <div className="rounded-[20px] bg-card p-4 shadow-sm border border-border/50">
        <div className="grid grid-cols-3 gap-4">
          {/* Weight */}
          <div className="flex flex-col items-center gap-2">
            <Scale className="w-5 h-5 text-muted-foreground" />
            <div className="text-center">
              <p className="text-xs text-muted-foreground mb-1">체중</p>
              <p className={`text-sm font-semibold ${!weight ? 'text-muted-foreground' : 'text-card-foreground'}`}>
                {weight ? `${weight}kg` : '미입력'}
              </p>
            </div>
          </div>

          {/* Muscle Mass */}
          <div className="flex flex-col items-center gap-2">
            <Activity className="w-5 h-5 text-muted-foreground" />
            <div className="text-center">
              <p className="text-xs text-muted-foreground mb-1">골격근량</p>
              <p className={`text-sm font-semibold ${!muscleMass ? 'text-muted-foreground' : 'text-card-foreground'}`}>
                {muscleMass ? `${muscleMass}kg` : '미입력'}
              </p>
            </div>
          </div>

          {/* Body Fat Percentage */}
          <div className="flex flex-col items-center gap-2">
            <Percent className="w-5 h-5 text-muted-foreground" />
            <div className="text-center">
              <p className="text-xs text-muted-foreground mb-1">체지방률</p>
              <p className={`text-sm font-semibold ${!bodyFatPercentage ? 'text-muted-foreground' : 'text-card-foreground'}`}>
                {bodyFatPercentage ? `${bodyFatPercentage}%` : '미입력'}
              </p>
            </div>
          </div>
        </div>

        {!hasAnyData && (
          <p className="text-center text-sm text-muted-foreground italic mt-2">
            인바디 정보가 없습니다
          </p>
        )}
      </div>
    </div>
  );
}
