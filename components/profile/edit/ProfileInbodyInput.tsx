'use client';

import { useState } from 'react';

interface ProfileInbodyInputProps {
  defaultMuscleMass?: number;
  defaultBodyFatPercentage?: number;
  defaultShowInbodyPublic?: boolean;
}

export default function ProfileInbodyInput({
  defaultMuscleMass,
  defaultBodyFatPercentage,
  defaultShowInbodyPublic = true,
}: ProfileInbodyInputProps) {
  const [muscleMass, setMuscleMass] = useState(defaultMuscleMass?.toString() || '');
  const [bodyFatPercentage, setBodyFatPercentage] = useState(defaultBodyFatPercentage?.toString() || '');
  const [showInbodyPublic, setShowInbodyPublic] = useState(defaultShowInbodyPublic);

  return (
    <section className="space-y-3">
      <h2 className="text-xl font-bold text-card-foreground">인바디 정보</h2>
      <p className="text-xs text-muted-foreground">
        인바디 정보를 입력하면 더 정확한 운동 파트너 매칭을 받을 수 있어요!
      </p>

      <div className="space-y-3">
        {/* Muscle Mass */}
        <div className="space-y-2">
          <label className="text-sm text-card-foreground font-medium">골격근량 (kg)</label>
          <input
            type="number"
            step="0.1"
            value={muscleMass}
            onChange={(e) => setMuscleMass(e.target.value)}
            placeholder="예: 35.2"
            className="w-full px-4 py-3 rounded-xl bg-muted/30 border border-border text-sm text-card-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
          />
        </div>

        {/* Body Fat Percentage */}
        <div className="space-y-2">
          <label className="text-sm text-card-foreground font-medium">체지방률 (%)</label>
          <input
            type="number"
            step="0.1"
            value={bodyFatPercentage}
            onChange={(e) => setBodyFatPercentage(e.target.value)}
            placeholder="예: 15.5"
            className="w-full px-4 py-3 rounded-xl bg-muted/30 border border-border text-sm text-card-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
          />
        </div>

        {/* Public Display Toggle */}
        <div className="flex items-center justify-between px-4 py-3 rounded-xl bg-muted/30 border border-border">
          <div className="flex-1">
            <p className="text-sm text-card-foreground font-medium">인바디 정보 공개</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              다른 사용자에게 인바디 정보를 공개합니다
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowInbodyPublic(!showInbodyPublic)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              showInbodyPublic ? 'bg-primary' : 'bg-muted'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                showInbodyPublic ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
      </div>
    </section>
  );
}
