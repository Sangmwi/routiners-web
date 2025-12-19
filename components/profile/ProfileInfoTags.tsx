'use client';

import { User } from '@/lib/types';
import { Ruler, Weight, Baby, Calendar, Cigarette } from 'lucide-react';

interface ProfileInfoTagsProps {
  user: User;
}

export default function ProfileInfoTags({ user }: ProfileInfoTagsProps) {
  const getDischargeDate = (enlistmentMonth: string) => {
    // 18개월 복무 기준 (실제로는 정확한 날짜 계산 필요)
    const [year, month] = enlistmentMonth.split('-').map(Number);
    const dischargeYear = year + 1;
    const dischargeMonth = month + 6;

    if (dischargeMonth > 12) {
      return `${dischargeYear + 1}년 ${dischargeMonth - 12}월 전역`;
    }
    return `${dischargeYear}년 ${dischargeMonth}월 전역`;
  };

  const getSmokeStatus = (isSmoker?: boolean) => {
    if (isSmoker === undefined) return '미입력';
    return isSmoker ? '흡연' : '전자담배';
  };

  return (
    <div className="space-y-3">
      <h2 className="text-xl font-bold text-card-foreground">내 정보</h2>

      <div className="flex flex-wrap gap-2">
        {/* Height */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[14px] bg-card text-xs text-card-foreground border border-border/50">
          <Ruler className="w-4 h-4 text-muted-foreground" />
          <span className={!user.height ? 'text-muted-foreground' : ''}>
            {user.height ? `${user.height}cm` : '미입력'}
          </span>
        </div>

        {/* Smoking Status */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[14px] bg-card text-xs text-card-foreground border border-border/50">
          <Cigarette className="w-4 h-4 text-muted-foreground" />
          <span className={user.isSmoker === undefined ? 'text-muted-foreground' : ''}>
            {getSmokeStatus(user.isSmoker)}
          </span>
        </div>

        {/* Discharge Date */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[14px] bg-card text-xs text-muted-foreground border border-border/50">
          <Calendar className="w-4 h-4" />
          <span>{getDischargeDate(user.enlistmentMonth)}</span>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {/* Weight */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[14px] bg-card text-xs text-card-foreground border border-border/50">
          <Weight className="w-4 h-4 text-muted-foreground" />
          <span className={!user.weight ? 'text-muted-foreground' : ''}>
            {user.weight ? `${user.weight}kg` : '미입력'}
          </span>
        </div>

        {/* Gender */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[14px] bg-card text-xs text-card-foreground border border-border/50">
          <Baby className="w-4 h-4 text-muted-foreground" />
          <span>{user.gender === 'male' ? '남성' : '여성'}</span>
        </div>
      </div>
    </div>
  );
}
