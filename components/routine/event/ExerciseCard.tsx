'use client';

import { useState, type HTMLAttributes } from 'react';
import { WorkoutExercise, WorkoutSet } from '@/lib/types/routine';
import { CaretDownIcon, CaretUpIcon, PencilSimpleIcon, CheckIcon, DotsSixVerticalIcon, TrashIcon } from '@phosphor-icons/react';
import { getEventIcon } from '@/lib/config/eventTheme';
import SetValuePicker from '@/components/routine/workout/SetValuePicker';
import { useSetValuePicker } from '@/hooks/routine/useSetValuePicker';

interface ExerciseCardProps {
  exercise: WorkoutExercise;
  index: number;
  isCompleted?: boolean;
  /** 편집 가능 여부 (scheduled 상태일 때) */
  editable?: boolean;
  /** 세트 변경 시 콜백 (즉시 저장) */
  onSetsChange?: (exerciseId: string, sets: WorkoutSet[]) => void;
  /** 구조 편집 모드 (드래그/삭제 가능) */
  editMode?: boolean;
  /** 삭제 콜백 */
  onDelete?: () => void;
  /** 삭제 가능 여부 (운동 1개일 때 false) */
  canDelete?: boolean;
  /** @dnd-kit 드래그 핸들 props */
  dragHandleProps?: HTMLAttributes<HTMLDivElement>;
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
  editMode = false,
  onDelete,
  canDelete = true,
  dragHandleProps,
}: ExerciseCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const { pickerSetIndex, pickerSet, openPicker, closePicker } = useSetValuePicker(exercise.sets);

  const handlePickerConfirm = (weight: number, reps: number) => {
    if (pickerSetIndex === null) return;
    const newSets = exercise.sets.map((set, idx) =>
      idx === pickerSetIndex
        ? { ...set, actualWeight: weight || undefined, actualReps: reps || undefined }
        : set
    );
    onSetsChange?.(exercise.id, newSets);
    closePicker();
  };

  const handleSetCompleted = (setIndex: number) => {
    const newSets = exercise.sets.map((set, idx) =>
      idx === setIndex
        ? { ...set, completed: !set.completed }
        : set
    );
    onSetsChange?.(exercise.id, newSets);
  };

  // 세트 요약 (actual > target 우선, 범위 표시)
  const completedSetCount = exercise.sets.filter(s => s.completed).length;

  const setsSummary = (() => {
    const reps = exercise.sets.map(s => s.actualReps ?? s.targetReps);
    const weights = exercise.sets.map(s => s.actualWeight ?? s.targetWeight ?? 0);

    const minReps = Math.min(...reps);
    const maxReps = Math.max(...reps);
    const minWeight = Math.min(...weights);
    const maxWeight = Math.max(...weights);

    const repsStr = minReps === maxReps ? `${minReps}회` : `${minReps}~${maxReps}회`;
    const weightStr = maxWeight > 0
      ? (minWeight === maxWeight ? `${maxWeight}kg` : `${minWeight}~${maxWeight}kg`)
      : '';

    return `${exercise.sets.length}세트 • ${repsStr}${weightStr ? ` • ${weightStr}` : ''}`;
  })();

  return (
    <div
      className={`rounded-xl overflow-hidden ${
        isCompleted ? 'bg-primary/5' : 'bg-muted/20'
      }`}
    >
      {/* 헤더: 3칸 고정 레이아웃 [left w-10] [center flex-1] [right w-10] */}
      <div className="flex items-center gap-2 p-4">
        {/* Left: 드래그 핸들 (편집) / 번호 배지 (일반) */}
        {editMode && dragHandleProps ? (
          <div
            {...dragHandleProps}
            className="w-10 h-10 flex items-center justify-center shrink-0 touch-none cursor-grab active:cursor-grabbing"
          >
            <DotsSixVerticalIcon size={20} weight="bold" className="text-muted-foreground" />
          </div>
        ) : (
          <div className="w-10 h-10 flex items-center justify-center shrink-0">
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold ${
                isCompleted
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              {index + 1}
            </div>
          </div>
        )}

        {/* Center: 운동 정보 (탭으로 확장/축소) */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex-1 text-left min-w-0"
        >
          <h3 className="font-semibold text-foreground truncate">{exercise.name}</h3>
          <p className="text-sm text-muted-foreground">
            {setsSummary}
          </p>
          <p className={`text-xs mt-0.5 ${completedSetCount > 0 ? 'text-primary' : 'text-muted-foreground/50'}`}>
            {completedSetCount > 0
              ? `✓ ${completedSetCount}/${exercise.sets.length}세트 완료`
              : `0/${exercise.sets.length}세트 완료`}
          </p>
        </button>

        {/* Right: 삭제 (편집) / 펼침 표시 (일반) */}
        {editMode && onDelete ? (
          <button
            type="button"
            onClick={onDelete}
            disabled={!canDelete}
            className="w-10 h-10 flex items-center justify-center shrink-0 text-muted-foreground/50 hover:text-destructive disabled:opacity-30 transition-colors"
            aria-label="운동 삭제"
          >
            <TrashIcon size={18} />
          </button>
        ) : (
          <div className="w-10 h-10 flex items-center justify-center shrink-0">
            {isExpanded ? (
              <CaretUpIcon size={20} weight="bold" className="text-muted-foreground" />
            ) : (
              <CaretDownIcon size={20} weight="bold" className="text-muted-foreground" />
            )}
          </div>
        )}
      </div>

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
                    onTapEdit={() => openPicker(setIndex)}
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
          onClose={closePicker}
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
