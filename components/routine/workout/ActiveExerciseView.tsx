'use client';

import { BarbellIcon } from '@phosphor-icons/react';
import SetRow from './SetRow';
import SetValuePicker from './SetValuePicker';
import { useSetValuePicker } from '@/hooks/routine/useSetValuePicker';
import type { WorkoutExercise } from '@/lib/types/routine';

// AI가 영어로 생성하는 값 → 한국어 매핑
const CATEGORY_KO: Record<string, string> = {
  compound: '복합',
  isolation: '고립',
  strength: '근력',
  cardio: '유산소',
  flexibility: '유연성',
  core: '코어',
};

const MUSCLE_KO: Record<string, string> = {
  general: '전신',
  chest: '가슴',
  back: '등',
  shoulders: '어깨',
  legs: '하체',
  arms: '팔',
  core: '코어',
  glutes: '둔근',
  hamstrings: '햄스트링',
  quadriceps: '대퇴사두',
  calves: '종아리',
  biceps: '이두',
  triceps: '삼두',
  forearms: '전완',
  abs: '복근',
  'full body': '전신',
};

function toKorean(value: string, map: Record<string, string>): string {
  return map[value.toLowerCase()] ?? value;
}

interface ActiveExerciseViewProps {
  exercise: WorkoutExercise;
  exerciseIndex: number;
  nextSetIndex: number;
  onCompleteSet: (setIndex: number) => void;
  onUndoSet: (setIndex: number) => void;
  onUpdateSetValue: (
    setIndex: number,
    field: 'actualReps' | 'actualWeight',
    value: number | undefined
  ) => void;
}

/**
 * 개별 운동 세트 트래킹 뷰
 *
 * - 운동 이미지 placeholder (TODO: 시범 애니메이션)
 * - 운동 정보 + 세트 목록
 * - SetValuePicker 바텀시트 (모든 세트에서 탭하여 열기)
 */
export default function ActiveExerciseView({
  exercise,
  nextSetIndex,
  onCompleteSet,
  onUndoSet,
  onUpdateSetValue,
}: ActiveExerciseViewProps) {
  const completedSets = exercise.sets.filter((s) => s.completed).length;
  const { pickerSetIndex, pickerSet, openPicker, closePicker } = useSetValuePicker(exercise.sets);

  const handlePickerConfirm = (weight: number, reps: number) => {
    if (pickerSetIndex === null) return;
    onUpdateSetValue(pickerSetIndex, 'actualWeight', weight || undefined);
    onUpdateSetValue(pickerSetIndex, 'actualReps', reps || undefined);
    closePicker();
  };

  return (
    <div className="space-y-5">
      {/* 운동 이미지 placeholder */}
      {/* TODO: 운동 시범 애니메이션 영상 (무한 재생) */}
      <div className="bg-surface-secondary rounded-2xl h-48 flex items-center justify-center">
        <BarbellIcon size={48} weight="duotone" className="text-muted-foreground/30" />
      </div>

      {/* 운동 정보 */}
      <div>
        <h2 className="text-xl font-bold text-foreground">{exercise.name}</h2>
        <div className="flex items-center gap-2 mt-1">
          {exercise.category && (
            <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-surface-accent text-primary">
              {toKorean(exercise.category, CATEGORY_KO)}
            </span>
          )}
          {exercise.targetMuscle && (
            <span className="text-xs text-muted-foreground">
              {toKorean(exercise.targetMuscle, MUSCLE_KO)}
            </span>
          )}
        </div>
        <p className="text-sm text-muted-foreground mt-1.5">
          {exercise.sets.length}세트 • {completedSets}/{exercise.sets.length} 완료
        </p>
      </div>

      {/* 세트 목록 */}
      <div className="space-y-2">
        {exercise.sets.map((set, setIndex) => (
          <SetRow
            key={set.setNumber}
            set={set}
            index={setIndex}
            isActive={setIndex === nextSetIndex}
            onComplete={() => onCompleteSet(setIndex)}
            onUndo={() => onUndoSet(setIndex)}
            onUpdateValue={(field, value) =>
              onUpdateSetValue(setIndex, field, value)
            }
            onTapToEdit={() => openPicker(setIndex)}
          />
        ))}
      </div>

      {/* 메모 */}
      {exercise.notes && (
        <div className="bg-surface-secondary rounded-xl p-3">
          <p className="text-sm text-muted-foreground">{exercise.notes}</p>
        </div>
      )}

      {/* 추가 정보 */}
      {(exercise.tempo || exercise.rir !== undefined || exercise.technique) && (
        <div className="flex flex-wrap gap-2">
          {exercise.tempo && (
            <span className="px-2.5 py-1 text-xs rounded-lg bg-surface-hover text-muted-foreground">
              템포: {exercise.tempo}
            </span>
          )}
          {exercise.rir !== undefined && (
            <span className="px-2.5 py-1 text-xs rounded-lg bg-surface-hover text-muted-foreground">
              RIR: {exercise.rir}
            </span>
          )}
          {exercise.technique && (
            <span className="px-2.5 py-1 text-xs rounded-lg bg-surface-hover text-muted-foreground">
              {exercise.technique}
            </span>
          )}
        </div>
      )}

      {/* SetValuePicker 바텀시트 (단일 인스턴스) */}
      {pickerSet && pickerSetIndex !== null && (
        <SetValuePicker
          isOpen={true}
          onClose={closePicker}
          title={`${pickerSetIndex + 1}세트`}
          weight={pickerSet.actualWeight ?? pickerSet.targetWeight ?? 0}
          reps={pickerSet.actualReps ?? pickerSet.targetReps ?? 10}
          onConfirm={handlePickerConfirm}
        />
      )}
    </div>
  );
}
