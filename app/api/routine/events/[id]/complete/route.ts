import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/utils/supabase/auth';
import { DbRoutineEvent, toRoutineEvent, type WorkoutData, type WorkoutExercise } from '@/lib/types/routine';
import { isWorkoutData } from '@/lib/types/guards';
import { notFound, handleSupabaseError } from '@/lib/utils/apiResponse';
import { getBig3LiftType } from '@/lib/data/exercises';

/**
 * 운동의 최대 중량 추출 (actualWeight 우선, fallback targetWeight)
 */
function getMaxWeight(exercise: WorkoutExercise): number {
  if (!exercise.sets || exercise.sets.length === 0) return 0;
  return Math.max(
    ...exercise.sets.map((s) => s.actualWeight ?? s.targetWeight ?? 0),
  );
}

/**
 * 최대 중량 세트의 reps 추출
 */
function getRepsAtMaxWeight(exercise: WorkoutExercise): number | null {
  if (!exercise.sets || exercise.sets.length === 0) return null;
  const maxWeight = getMaxWeight(exercise);
  const maxSet = exercise.sets.find(
    (s) => (s.actualWeight ?? s.targetWeight ?? 0) === maxWeight,
  );
  return maxSet?.actualReps ?? maxSet?.targetReps ?? null;
}

/**
 * POST /api/routine/events/[id]/complete
 * 이벤트 완료 처리 + Big3 자동 캡처
 */
export const POST = withAuth<NextResponse, { id: string }>(
  async (_request: NextRequest, { supabase, params }) => {
    const { id } = await params;

    const { data, error } = await supabase
      .from('routine_events')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('status', 'scheduled')
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return notFound('완료할 수 있는 이벤트를 찾을 수 없습니다');
      }
      console.error('[Routine Event Complete] Error:', error);
      return handleSupabaseError(error);
    }

    const event = toRoutineEvent(data as DbRoutineEvent);

    // Big3 자동 캡처: 완료된 워크아웃에서 3대운동 기록 추출
    if (event.type === 'workout' && isWorkoutData(event.data)) {
      const workoutData = event.data as WorkoutData;
      for (const exercise of workoutData.exercises) {
        const liftType = getBig3LiftType(exercise.name);
        if (!liftType) continue;

        const maxWeight = getMaxWeight(exercise);
        if (maxWeight <= 0) continue;

        const reps = getRepsAtMaxWeight(exercise);

        await supabase
          .from('big3_records')
          .upsert(
            {
              recorded_at: event.date,
              lift_type: liftType,
              weight: maxWeight,
              reps,
              source: 'auto',
              routine_event_id: id,
            },
            { onConflict: 'user_id,recorded_at,lift_type,source' },
          )
          .then(({ error: big3Error }) => {
            if (big3Error) {
              console.error('[Big3 Auto-capture] Error:', big3Error);
            }
          });
      }
    }

    return NextResponse.json(event);
  },
);
