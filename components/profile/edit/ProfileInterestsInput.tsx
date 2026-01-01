'use client';

import { X } from 'lucide-react';
import SectionHeader from '@/components/ui/SectionHeader';

interface ProfileInterestsInputProps {
  value: string[];
  onChange: (value: string[]) => void;
}

const EXERCISE_OPTIONS = [
  // 가슴
  '벤치프레스',
  '인클라인 벤치프레스',
  '딥스',
  '케이블 크로스오버',
  '체스트 프레스 머신',

  // 등
  '데드리프트',
  '풀업',
  '랫풀다운',
  '바벨로우',
  '시티드 로우',

  // 어깨
  '숄더프레스',
  '사이드 레터럴 레이즈',
  '페이스풀',

  // 하체
  '스쿼트',
  '레그프레스',
  '레그컬',
  '레그익스텐션',
  '런지',
  '힙쓰러스트',

  // 팔
  '바벨컬',
  '트라이셉스 익스텐션',
  '해머컬',

  // 유산소/기타
  '러닝',
  '사이클',
  '로잉머신',
  '맨몸운동',
  '스트레칭',
];

export default function ProfileInterestsInput({ value, onChange }: ProfileInterestsInputProps) {
  const handleToggleInterest = (interest: string) => {
    if (value.includes(interest)) {
      onChange(value.filter((i) => i !== interest));
    } else {
      onChange([...value, interest]);
    }
  };

  return (
    <section className="space-y-3">
      <SectionHeader
        title="관심 운동 종목"
        description="관심있는 운동 종목을 선택하세요!"
      />

      {/* Selected Interests */}
      {value.length > 0 && (
        <div className="flex flex-wrap gap-2 p-3 rounded-xl bg-muted/30 border border-border">
          {value.map((interest, index) => (
            <div
              key={index}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[14px] bg-primary text-primary-foreground text-xs"
            >
              <span>{interest}</span>
              <button
                type="button"
                onClick={() => handleToggleInterest(interest)}
                className="hover:opacity-80 transition-opacity"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Exercise Options */}
      <div className="flex flex-wrap gap-2">
        {EXERCISE_OPTIONS.map((exercise) => {
          const isSelected = value.includes(exercise);
          return (
            <button
              key={exercise}
              type="button"
              onClick={() => handleToggleInterest(exercise)}
              className={`px-3 py-1.5 rounded-[14px] text-xs transition-colors ${
                isSelected
                  ? 'bg-primary/10 text-primary border-2 border-primary'
                  : 'bg-muted text-card-foreground border border-border/50 hover:border-primary/50'
              }`}
            >
              {exercise}
            </button>
          );
        })}
      </div>
    </section>
  );
}
