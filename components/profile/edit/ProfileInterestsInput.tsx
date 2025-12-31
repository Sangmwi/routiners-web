'use client';

import { X } from 'lucide-react';
import SectionHeader from '@/components/ui/SectionHeader';

interface ProfileInterestsInputProps {
  value: string[];
  onChange: (value: string[]) => void;
}

const EXERCISE_OPTIONS = [
  '헬스(웨이트리프팅)',
  '러닝',
  '맨몸운동',
  '수영',
  '자전거',
  '요가',
  '필라테스',
  '복싱',
  '태권도',
  '유도',
  '검도',
  '탁구',
  '배드민턴',
  '테니스',
  '농구',
  '축구',
  '야구',
  '배구',
  '등산',
  '클라이밍',
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
