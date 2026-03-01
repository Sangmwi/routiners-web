import type { ExerciseInfo } from '@/lib/data/exercises';
import type { WorkoutExercise, WorkoutSet } from '@/lib/types/routine';

export { REST_OPTIONS } from '@/lib/constants/workout';

export function formatRestSeconds(seconds: number): string {
  if (seconds === 0) return '없음';
  if (seconds < 60) return `${seconds}초`;
  const min = Math.floor(seconds / 60);
  const sec = seconds % 60;
  return sec > 0 ? `${min}분 ${sec}초` : `${min}분`;
}

export function createWorkoutSet(setNumber: number): WorkoutSet {
  return { setNumber, targetReps: 10, targetWeight: 20 };
}

export function catalogToExercise(info: ExerciseInfo): WorkoutExercise {
  return {
    id: crypto.randomUUID(),
    name: info.name,
    category: info.category,
    targetMuscle: info.targetMuscle,
    sets: [createWorkoutSet(1), createWorkoutSet(2), createWorkoutSet(3)],
    restSeconds: 60,
  };
}
