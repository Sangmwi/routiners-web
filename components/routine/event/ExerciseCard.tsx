'use client';

import { useState } from 'react';
import { WorkoutExercise, WorkoutSet } from '@/lib/types/routine';
import { CaretDownIcon, CaretUpIcon, PencilSimpleIcon, CheckIcon } from '@phosphor-icons/react';
import { getEventIcon } from '@/lib/config/eventTheme';
import SetValuePicker from '@/components/routine/workout/SetValuePicker';

interface ExerciseCardProps {
  exercise: WorkoutExercise;
  index: number;
  isCompleted?: boolean;
  /** 편집 가능 여부 (scheduled 상태일 때) */
  editable?: boolean;
  /** 세트 변경 시 콜백 (즉시 저장) */
  onSetsChange?: (exerciseId: string, sets: WorkoutSet[]) => void;
}

/**
 * 개별 운동 카드 컴포넌트
 *
 * - editable=false: 읽기 전용 SetRow 스타일
 * - editable=true: 인터랙티브 SetRow (탭 편집 + 완료 토글, 즉시 저장)
 */
export default function ExerciseCard({
  exercise,
  index,
  isCompleted = false,
  editable = false,
  onSetsChange,
}: ExerciseCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [pickerSetIndex, setPickerSetIndex] = useState<number | null>(null);

  const handlePickerConfirm = (weight: number, reps: number) => {
    if (pickerSetIndex === null) return;
    const newSets = exercise.sets.map((set, idx) =>
      idx === pickerSetIndex
        ? { ...set, actualWeight: weight || undefined, actualReps: reps || undefined }
        : set
    );
    onSetsChange?.(exercise.id, newSets);
    setPickerSetIndex(null);
  };

  const handleSetCompleted = (setIndex: number) => {
    const newSets = exercise.sets.map((set, idx) =>
      idx === setIndex
        ? { ...set, completed: !set.completed }
        : set
    );
    onSetsChange?.(exercise.id, newSets);
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
  const pickerSet = pickerSetIndex !== null ? exercise.sets[pickerSetIndex] : null;

  return (
    <div
      className={`rounded-xl overflow-hidden ${
        isCompleted ? 'bg-primary/5' : 'bg-muted/20'
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
            {exercise.sets[0]?.targetReps ?? '-'}회
            {exercise.sets[0]?.targetWeight ? ` • ${exercise.sets[0].targetWeight}kg` : ''}
          </p>
          <p className={`text-xs mt-0.5 ${actualSummary ? 'text-primary' : 'text-muted-foreground/50'}`}>
            {actualSummary ? `✓ ${actualSummary}` : `0/${exercise.sets.length}세트 완료`}
          </p>
        </div>

        {isExpanded ? (
          <CaretUpIcon size={20} weight="bold" className="text-muted-foreground" />
        ) : (
          <CaretDownIcon size={20} weight="bold" className="text-muted-foreground" />
        )}
      </button>

      {/* 상세 정보 */}
      {isExpanded && (
        <div className="px-4 pb-4 space-y-3">
          {/* 세트 목록 */}
          <div className="space-y-2">
            {editable
              ? exercise.sets.map((set, setIndex) => (
                  <EditSetRow
                    key={set.setNumber}
                    set={set}
                    onToggleComplete={() => handleSetCompleted(setIndex)}
                    onTapEdit={() => setPickerSetIndex(setIndex)}
                  />
                ))
              : exercise.sets.map((set) => (
                  <ReadSetRow key={set.setNumber} set={set} />
                ))}
          </div>

          {/* 메모 */}
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

      {/* SetValuePicker */}
      {pickerSet && pickerSetIndex !== null && (
        <SetValuePicker
          isOpen={true}
          onClose={() => setPickerSetIndex(null)}
          title={`${pickerSet.setNumber}세트`}
          weight={pickerSet.actualWeight ?? pickerSet.targetWeight ?? 0}
          reps={pickerSet.actualReps ?? pickerSet.targetReps ?? 10}
          onConfirm={handlePickerConfirm}
        />
      )}
    </div>
  );
}

// ============================================================================
// Sub-components
// ============================================================================

/** 읽기 전용 세트 행 */
function ReadSetRow({ set }: { set: WorkoutSet }) {
  const displayWeight = set.actualWeight ?? set.targetWeight ?? 0;
  const displayReps = set.actualReps ?? set.targetReps;
  const hasActual = !!(set.actualWeight || set.actualReps);

  if (set.completed || hasActual) {
    return (
      <div className="flex items-center gap-3 rounded-xl bg-primary/10 px-4 py-3">
        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
          <CheckIcon size={16} weight="bold" className="text-primary-foreground" />
        </div>
        <span className="text-sm font-medium text-foreground">
          {set.setNumber}세트
        </span>
        <span className="text-sm text-primary">
          {displayWeight}kg × {displayReps}회
        </span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 rounded-xl bg-muted/20 px-4 py-3">
      <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
        <span className="text-xs font-bold text-muted-foreground">{set.setNumber}</span>
      </div>
      <span className="text-sm text-muted-foreground">
        {displayWeight}kg × {displayReps}회
      </span>
    </div>
  );
}

/** 편집 가능 세트 행 */
function EditSetRow({
  set,
  onToggleComplete,
  onTapEdit,
}: {
  set: WorkoutSet;
  onToggleComplete: () => void;
  onTapEdit: () => void;
}) {
  const displayWeight = set.actualWeight ?? set.targetWeight ?? 0;
  const displayReps = set.actualReps ?? set.targetReps;

  return (
    <div className="flex items-center gap-3 rounded-xl bg-muted/30 px-4 py-3">
      <span className="text-xs text-foreground shrink-0">
        {set.setNumber} 세트
      </span>

      <button
        onClick={onTapEdit}
        className="flex-1 h-10 px-3 flex items-center justify-center gap-2 text-sm font-medium bg-background border border-border rounded-lg active:bg-muted/50 transition-colors"
      >
        <span className="tabular-nums">{displayWeight}kg</span>
        <span className="text-muted-foreground">×</span>
        <span className="tabular-nums">{displayReps}회</span>
        <PencilSimpleIcon size={14} className="text-muted-foreground ml-1" />
      </button>

      <button
        onClick={onToggleComplete}
        className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${
          set.completed
            ? 'bg-primary text-primary-foreground'
            : 'bg-muted text-muted-foreground'
        }`}
        aria-label="세트 완료"
      >
        <CheckIcon size={18} weight="bold" />
      </button>
    </div>
  );
}
