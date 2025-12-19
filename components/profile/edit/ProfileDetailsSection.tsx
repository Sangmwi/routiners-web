'use client';

import { useState } from 'react';
import { User } from '@/lib/types';
import { ChevronRight } from 'lucide-react';

interface ProfileDetailsSectionProps {
  user: User;
}

export default function ProfileDetailsSection({ user }: ProfileDetailsSectionProps) {
  const [rank, setRank] = useState(user.rank);
  const [unit, setUnit] = useState(user.unitName);
  const [specialty, setSpecialty] = useState(user.specialty);
  const [height, setHeight] = useState(user.height?.toString() || '');
  const [weight, setWeight] = useState(user.weight?.toString() || '');
  const [gender, setGender] = useState(user.gender);
  const [isSmoker, setIsSmoker] = useState(user.isSmoker);

  const handleFieldClick = (field: string) => {
    // TODO: Open modal or navigate to detail edit page
    console.log('Edit field:', field);
  };

  return (
    <section className="space-y-4">
      <h2 className="text-xl font-bold text-card-foreground">My details</h2>

      <div className="space-y-2">
        {/* Rank */}
        <button
          onClick={() => handleFieldClick('rank')}
          className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-card hover:bg-muted/30 transition-colors border border-border/50"
        >
          <div className="flex items-center gap-3">
            <span className="text-muted-foreground text-sm">계급</span>
            <span className="text-sm text-card-foreground">{rank.split('-')[0]}</span>
          </div>
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
        </button>

        {/* Unit */}
        <button
          onClick={() => handleFieldClick('unit')}
          className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-card hover:bg-muted/30 transition-colors border border-border/50"
        >
          <div className="flex items-center gap-3">
            <span className="text-muted-foreground text-sm">부대명</span>
            <span className="text-sm text-card-foreground line-clamp-1">{unit}</span>
          </div>
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
        </button>

        {/* Specialty */}
        <button
          onClick={() => handleFieldClick('specialty')}
          className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-card hover:bg-muted/30 transition-colors border border-border/50"
        >
          <div className="flex items-center gap-3">
            <span className="text-muted-foreground text-sm">분야별</span>
            <span className="text-sm text-card-foreground">{specialty}</span>
          </div>
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
        </button>

        {/* Age */}
        <button
          onClick={() => handleFieldClick('age')}
          className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-card hover:bg-muted/30 transition-colors border border-border/50"
        >
          <div className="flex items-center gap-3">
            <span className="text-muted-foreground text-sm">나이</span>
            <span className="text-sm text-muted-foreground">설정</span>
          </div>
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
        </button>

        {/* Gender */}
        <button
          onClick={() => handleFieldClick('gender')}
          className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-card hover:bg-muted/30 transition-colors border border-border/50"
        >
          <div className="flex items-center gap-3">
            <span className="text-muted-foreground text-sm">성별</span>
            <span className="text-sm text-card-foreground">{gender === 'male' ? '남성' : '여성'}</span>
          </div>
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
        </button>

        {/* Smoking */}
        <button
          onClick={() => handleFieldClick('smoking')}
          className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-card hover:bg-muted/30 transition-colors border border-border/50"
        >
          <div className="flex items-center gap-3">
            <span className="text-muted-foreground text-sm">흡연여부</span>
            <span className="text-sm text-card-foreground">
              {isSmoker === undefined ? '설정' : isSmoker ? '흡연' : '비흡연'}
            </span>
          </div>
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
        </button>

        {/* Discharge Date */}
        <button
          onClick={() => handleFieldClick('discharge')}
          className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-card hover:bg-muted/30 transition-colors border border-border/50"
        >
          <div className="flex items-center gap-3">
            <span className="text-muted-foreground text-sm">소속/제대</span>
            <span className="text-sm text-muted-foreground">설정</span>
          </div>
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
        </button>

        {/* Height */}
        <button
          onClick={() => handleFieldClick('height')}
          className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-card hover:bg-muted/30 transition-colors border border-border/50"
        >
          <div className="flex items-center gap-3">
            <span className="text-muted-foreground text-sm">신장</span>
            <span className="text-sm text-card-foreground">
              {height ? `${height}cm` : '설정'}
            </span>
          </div>
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
        </button>

        {/* Weight */}
        <button
          onClick={() => handleFieldClick('weight')}
          className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-card hover:bg-muted/30 transition-colors border border-border/50"
        >
          <div className="flex items-center gap-3">
            <span className="text-muted-foreground text-sm">분야별</span>
            <span className="text-sm text-card-foreground">
              {weight ? `${weight}kg` : '설정'}
            </span>
          </div>
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
        </button>
      </div>

      {/* Exercise Location */}
      <div className="pt-4 space-y-3">
        <h3 className="text-base font-semibold text-card-foreground">주 운동 장소 입력</h3>
        <p className="text-xs text-muted-foreground">
          평소에 자주 가는 헬스장, 운동 장소 등을 입력해주세요!
        </p>
        <textarea
          placeholder="주 운동 장소를 입력하세요..."
          className="w-full h-24 px-4 py-3 rounded-xl bg-muted/30 border border-border text-sm text-card-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
        />
      </div>

      {/* Exercise Routine Time */}
      <div className="pt-2 space-y-3">
        <h3 className="text-base font-semibold text-card-foreground">운동 루틴 시간</h3>
        <p className="text-xs text-muted-foreground">
          평소에 운동하는 시간을 입력해주세요!
        </p>
        <div className="flex gap-2">
          <input
            type="time"
            className="flex-1 px-4 py-3 rounded-xl bg-muted/30 border border-border text-sm text-card-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
          />
          <span className="flex items-center text-muted-foreground">~</span>
          <input
            type="time"
            className="flex-1 px-4 py-3 rounded-xl bg-muted/30 border border-border text-sm text-card-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
          />
        </div>
      </div>
    </section>
  );
}
