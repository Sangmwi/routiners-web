'use client';

import { useState } from 'react';
import { WorkoutExercise } from '@/lib/types/routine';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { getEventIcon } from '@/lib/config/eventTheme';

interface ExerciseCardProps {
  exercise: WorkoutExercise;
  index: number;
  isCompleted?: boolean;
}

/**
 * 개별 운동 카드 컴포넌트
 */
export default function ExerciseCard({
  exercise,
  index,
  isCompleted = false,
}: ExerciseCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div
      className={`rounded-xl overflow-hidden ${
        isCompleted ? 'bg-primary/5' : 'bg-muted/30'
      }`}
    >
      {/* 헤더 */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center gap-3 p-4"
      >
        <div
          className={`w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold ${
            isCompleted
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted text-muted-foreground'
          }`}
        >
          {index + 1}
        </div>

        <div className="flex-1 text-left">
          <h3 className="font-semibold text-foreground">{exercise.name}</h3>
          <p className="text-sm text-muted-foreground">
            {exercise.sets.length}세트 •{' '}
            {exercise.sets[0]?.targetReps ?? '-'}회 •{' '}
            {exercise.sets[0]?.targetWeight ?? '-'}kg
          </p>
        </div>

        {isExpanded ? (
          <ChevronUp className="w-5 h-5 text-muted-foreground" />
        ) : (
          <ChevronDown className="w-5 h-5 text-muted-foreground" />
        )}
      </button>

      {/* 상세 정보 */}
      {isExpanded && (
        <div className="px-4 pb-4 space-y-4">
          {/* 세트 목록 */}
          <div className="bg-muted/50 rounded-lg p-3 space-y-2">
            <div className="grid grid-cols-4 gap-2 text-xs text-muted-foreground font-medium">
              <span>세트</span>
              <span className="text-center">목표</span>
              <span className="text-center">중량</span>
              <span className="text-center">휴식</span>
            </div>
            {exercise.sets.map((set, setIndex) => (
              <div
                key={set.setNumber}
                className="grid grid-cols-4 gap-2 text-sm"
              >
                <span className="font-medium text-foreground">
                  {set.setNumber}세트
                </span>
                <span className="text-center text-foreground">
                  {set.targetReps}회
                </span>
                <span className="text-center text-foreground">
                  {set.targetWeight ?? '-'}kg
                </span>
                <span className="text-center text-muted-foreground">
                  {set.restSeconds ? `${set.restSeconds}초` : '-'}
                </span>
              </div>
            ))}
          </div>

          {/* 추가 정보 */}
          {exercise.notes && (
            <div className="flex items-start gap-2 text-sm">
              {(() => {
                const Icon = getEventIcon('workout');
                return <Icon className="w-4 h-4 text-primary shrink-0 mt-0.5" />;
              })()}
              <p className="text-muted-foreground">{exercise.notes}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
