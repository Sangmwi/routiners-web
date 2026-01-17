'use client';

import { useState } from 'react';
import { WorkoutExercise, WorkoutSet } from '@/lib/types/routine';
import { CaretDownIcon, CaretUpIcon, PencilSimpleIcon, CheckIcon, XIcon } from '@phosphor-icons/react';
import { getEventIcon } from '@/lib/config/eventTheme';

interface ExerciseCardProps {
  exercise: WorkoutExercise;
  index: number;
  isCompleted?: boolean;
  /** 편집 모드 활성화 (이벤트가 scheduled 상태일 때만) */
  editable?: boolean;
  /** 세트 변경 시 콜백 */
  onSetsChange?: (exerciseId: string, sets: WorkoutSet[]) => void;
}

/**
 * 개별 운동 카드 컴포넌트
 *
 * - 읽기 모드: 운동 정보 표시
 * - 편집 모드: 실제 수행 횟수/중량 입력 가능
 */
export default function ExerciseCard({
  exercise,
  index,
  isCompleted = false,
  editable = false,
  onSetsChange,
}: ExerciseCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedSets, setEditedSets] = useState<WorkoutSet[]>(exercise.sets);

  // 편집 모드 시작
  const handleStartEdit = () => {
    setEditedSets(exercise.sets);
    setIsEditing(true);
  };

  // 편집 취소
  const handleCancelEdit = () => {
    setEditedSets(exercise.sets);
    setIsEditing(false);
  };

  // 편집 저장
  const handleSaveEdit = () => {
    onSetsChange?.(exercise.id, editedSets);
    setIsEditing(false);
  };

  // 세트 값 변경
  const handleSetChange = (setIndex: number, field: 'actualReps' | 'actualWeight', value: string) => {
    const numValue = value === '' ? undefined : parseInt(value, 10);
    setEditedSets(prev => prev.map((set, idx) =>
      idx === setIndex
        ? { ...set, [field]: isNaN(numValue as number) ? undefined : numValue }
        : set
    ));
  };

  // 세트 완료 토글
  const handleSetCompleted = (setIndex: number) => {
    setEditedSets(prev => prev.map((set, idx) =>
      idx === setIndex
        ? { ...set, completed: !set.completed }
        : set
    ));
  };

  // 실제 수행 데이터 요약
  const getActualSummary = () => {
    const completedSets = exercise.sets.filter(s => s.completed || s.actualReps);
    if (completedSets.length === 0) return null;

    const totalActualReps = completedSets.reduce((sum, s) => sum + (s.actualReps ?? 0), 0);
    const avgWeight = completedSets.length > 0
      ? Math.round(completedSets.reduce((sum, s) => sum + (s.actualWeight ?? s.targetWeight ?? 0), 0) / completedSets.length)
      : 0;

    return `${completedSets.length}/${exercise.sets.length}세트 완료 • ${totalActualReps}회 • ${avgWeight}kg`;
  };

  const actualSummary = getActualSummary();

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
          {/* 실제 수행 요약 */}
          {actualSummary && (
            <p className="text-xs text-primary mt-0.5">
              ✓ {actualSummary}
            </p>
          )}
        </div>

        {isExpanded ? (
          <CaretUpIcon size={20} weight="bold" className="text-muted-foreground" />
        ) : (
          <CaretDownIcon size={20} weight="bold" className="text-muted-foreground" />
        )}
      </button>

      {/* 상세 정보 */}
      {isExpanded && (
        <div className="px-4 pb-4 space-y-4">
          {/* 편집 버튼 */}
          {editable && !isEditing && (
            <button
              onClick={handleStartEdit}
              className="flex items-center gap-1.5 text-sm text-primary hover:text-primary/80 transition-colors"
            >
              <PencilSimpleIcon size={16} weight="bold" />
              <span>수행 기록 입력</span>
            </button>
          )}

          {/* 세트 목록 */}
          <div className="bg-muted/50 rounded-lg p-3 space-y-2">
            {isEditing ? (
              // 편집 모드
              <>
                <div className="grid grid-cols-5 gap-2 text-xs text-muted-foreground font-medium">
                  <span>세트</span>
                  <span className="text-center">목표</span>
                  <span className="text-center">실제 횟수</span>
                  <span className="text-center">실제 중량</span>
                  <span className="text-center">완료</span>
                </div>
                {editedSets.map((set, setIndex) => (
                  <div
                    key={set.setNumber}
                    className="grid grid-cols-5 gap-2 text-sm items-center"
                  >
                    <span className="font-medium text-foreground">
                      {set.setNumber}세트
                    </span>
                    <span className="text-center text-muted-foreground text-xs">
                      {set.targetReps}회/{set.targetWeight ?? '-'}kg
                    </span>
                    <input
                      type="number"
                      inputMode="numeric"
                      placeholder={String(set.targetReps)}
                      value={set.actualReps ?? ''}
                      onChange={(e) => handleSetChange(setIndex, 'actualReps', e.target.value)}
                      className="w-full h-8 px-2 text-center text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                    <input
                      type="number"
                      inputMode="decimal"
                      placeholder={String(set.targetWeight ?? 0)}
                      value={set.actualWeight ?? ''}
                      onChange={(e) => handleSetChange(setIndex, 'actualWeight', e.target.value)}
                      className="w-full h-8 px-2 text-center text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                    <button
                      onClick={() => handleSetCompleted(setIndex)}
                      className={`w-8 h-8 mx-auto rounded-lg flex items-center justify-center transition-colors ${
                        set.completed
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted text-muted-foreground hover:bg-muted/80'
                      }`}
                    >
                      <CheckIcon size={16} weight="bold" />
                    </button>
                  </div>
                ))}
                {/* 편집 액션 버튼 */}
                <div className="flex gap-2 pt-2">
                  <button
                    onClick={handleCancelEdit}
                    className="flex-1 h-10 flex items-center justify-center gap-1.5 text-sm text-muted-foreground bg-muted rounded-lg hover:bg-muted/80 transition-colors"
                  >
                    <XIcon size={16} weight="bold" />
                    <span>취소</span>
                  </button>
                  <button
                    onClick={handleSaveEdit}
                    className="flex-1 h-10 flex items-center justify-center gap-1.5 text-sm text-primary-foreground bg-primary rounded-lg hover:bg-primary/90 transition-colors"
                  >
                    <CheckIcon size={16} weight="bold" />
                    <span>저장</span>
                  </button>
                </div>
              </>
            ) : (
              // 읽기 모드
              <>
                <div className="grid grid-cols-5 gap-2 text-xs text-muted-foreground font-medium">
                  <span>세트</span>
                  <span className="text-center">목표</span>
                  <span className="text-center">실제</span>
                  <span className="text-center">중량</span>
                  <span className="text-center">휴식</span>
                </div>
                {exercise.sets.map((set) => (
                  <div
                    key={set.setNumber}
                    className={`grid grid-cols-5 gap-2 text-sm ${
                      set.completed ? 'text-primary' : ''
                    }`}
                  >
                    <span className={`font-medium ${set.completed ? 'text-primary' : 'text-foreground'}`}>
                      {set.setNumber}세트
                      {set.completed && ' ✓'}
                    </span>
                    <span className="text-center text-muted-foreground">
                      {set.targetReps}회
                    </span>
                    <span className={`text-center ${set.actualReps ? 'text-primary font-medium' : 'text-muted-foreground'}`}>
                      {set.actualReps ?? '-'}회
                    </span>
                    <span className={`text-center ${set.actualWeight ? 'text-primary font-medium' : 'text-foreground'}`}>
                      {set.actualWeight ?? set.targetWeight ?? '-'}kg
                    </span>
                    <span className="text-center text-muted-foreground">
                      {set.restSeconds ? `${set.restSeconds}초` : '-'}
                    </span>
                  </div>
                ))}
              </>
            )}
          </div>

          {/* 추가 정보 */}
          {exercise.notes && !isEditing && (
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
