import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/utils/supabase/auth';
import { handleSupabaseError } from '@/lib/utils/apiResponse';
import type { DbRoutineEvent, WorkoutData, WorkoutExercise } from '@/lib/types/routine';
import type { Big3DataPoint, Big3Summary, ProgressSummary } from '@/lib/types/progress';
import { isWorkoutData } from '@/lib/types/guards';

/**
 * 3대 운동 정확 매칭 이름
 * exercises.ts 카탈로그 기준: 스쿼트(squat), 벤치프레스(bench-press), 데드리프트(deadlift)
 */
const BIG3_NAMES = {
  squat: '스쿼트',
  bench: '벤치프레스',
  deadlift: '데드리프트',
} as const;

/**
 * 운동의 최대 중량 추출 (actualWeight 우선, fallback targetWeight)
 */
function getMaxWeight(exercise: WorkoutExercise): number {
  if (!exercise.sets || exercise.sets.length === 0) return 0;

  return Math.max(
    ...exercise.sets.map((s) => s.actualWeight ?? s.targetWeight ?? 0)
  );
}

/**
 * GET /api/routine/events/stats/progress
 * 3대 운동 진행 현황 조회
 */
export const GET = withAuth(async (request: NextRequest, { supabase }) => {
  const { searchParams } = new URL(request.url);
  const months = Math.min(Math.max(parseInt(searchParams.get('months') || '6', 10), 1), 24);

  // 기준 날짜 계산
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - months);
  const startDateStr = startDate.toISOString().split('T')[0];

  // 완료된 workout 이벤트 조회
  const { data, error } = await supabase
    .from('routine_events')
    .select('date, data')
    .eq('type', 'workout')
    .eq('status', 'completed')
    .gte('date', startDateStr)
    .order('date', { ascending: true });

  if (error) {
    console.error('[Progress] Error:', error);
    return handleSupabaseError(error);
  }

  const events = data as Pick<DbRoutineEvent, 'date' | 'data'>[];

  // 날짜별 3대 운동 최대 중량 추출
  const dailyMaxes: Map<string, { squat: number; bench: number; deadlift: number }> = new Map();

  for (const event of events) {
    if (!isWorkoutData(event.data)) continue;

    const workoutData = event.data as WorkoutData;
    const date = event.date;

    for (const exercise of workoutData.exercises) {
      const maxWeight = getMaxWeight(exercise);
      if (maxWeight <= 0) continue;

      if (!dailyMaxes.has(date)) {
        dailyMaxes.set(date, { squat: 0, bench: 0, deadlift: 0 });
      }

      const entry = dailyMaxes.get(date)!;

      if (exercise.name === BIG3_NAMES.squat) {
        entry.squat = Math.max(entry.squat, maxWeight);
      } else if (exercise.name === BIG3_NAMES.bench) {
        entry.bench = Math.max(entry.bench, maxWeight);
      } else if (exercise.name === BIG3_NAMES.deadlift) {
        entry.deadlift = Math.max(entry.deadlift, maxWeight);
      }
    }
  }

  // Rolling total 계산: 각 날짜에서 최신 종목별 최대중량 합산
  const history: Big3DataPoint[] = [];
  let rollingSquat = 0;
  let rollingBench = 0;
  let rollingDeadlift = 0;

  for (const [date, maxes] of dailyMaxes) {
    // 해당 날짜에 기록이 있는 종목만 업데이트
    if (maxes.squat > 0) rollingSquat = maxes.squat;
    if (maxes.bench > 0) rollingBench = maxes.bench;
    if (maxes.deadlift > 0) rollingDeadlift = maxes.deadlift;

    // 하나라도 기록이 있는 날짜만 히스토리에 추가
    if (maxes.squat > 0 || maxes.bench > 0 || maxes.deadlift > 0) {
      history.push({
        date,
        squat: rollingSquat || null,
        bench: rollingBench || null,
        deadlift: rollingDeadlift || null,
        total: rollingSquat + rollingBench + rollingDeadlift,
      });
    }
  }

  // 변화량 계산
  let changes: Big3Summary['changes'] = null;
  if (history.length >= 2) {
    const latest = history[history.length - 1];
    const previous = history[history.length - 2];

    changes = {
      squat: (latest.squat ?? 0) - (previous.squat ?? 0),
      bench: (latest.bench ?? 0) - (previous.bench ?? 0),
      deadlift: (latest.deadlift ?? 0) - (previous.deadlift ?? 0),
      total: latest.total - previous.total,
    };
  }

  const big3: Big3Summary = {
    latest: history.length > 0 ? history[history.length - 1] : null,
    history,
    changes,
  };

  const summary: ProgressSummary = { big3 };

  return NextResponse.json(summary);
});
