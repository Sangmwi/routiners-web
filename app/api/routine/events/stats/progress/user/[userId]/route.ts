import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/utils/supabase/auth';
import { createAdminClient } from '@/utils/supabase/admin';
import { handleSupabaseError } from '@/lib/utils/apiResponse';
import type { DbRoutineEvent, WorkoutData, WorkoutExercise } from '@/lib/types/routine';
import type { Big3DataPoint, Big3Summary, ProgressSummary } from '@/lib/types/progress';
import { isWorkoutData } from '@/lib/types/guards';

const BIG3_NAMES = {
  squat: '스쿼트',
  bench: '벤치프레스',
  deadlift: '데드리프트',
} as const;

function getMaxWeight(exercise: WorkoutExercise): number {
  if (!exercise.sets || exercise.sets.length === 0) return 0;
  return Math.max(
    ...exercise.sets.map((s) => s.actualWeight ?? s.targetWeight ?? 0)
  );
}

/**
 * GET /api/routine/events/stats/progress/user/[userId]
 * 특정 사용자의 3대 운동 진행 현황 조회
 *
 * - showInfoPublic이 true인 경우에만 데이터 반환
 * - 비공개인 경우 빈 summary 반환
 */
export const GET = withAuth(
  async (
    request: NextRequest,
    { supabase }
  ) => {
    const url = new URL(request.url);
    const targetUserId = url.pathname.split('/').pop();

    if (!targetUserId) {
      return NextResponse.json(
        { error: '사용자 ID가 필요합니다.', code: 'MISSING_USER_ID' },
        { status: 400 }
      );
    }

    // 1. 대상 사용자의 공개 설정 확인
    const { data: targetUser, error: userError } = await supabase
      .from('users')
      .select('show_info_public')
      .eq('id', targetUserId)
      .single();

    if (userError || !targetUser) {
      return NextResponse.json(
        { error: '사용자를 찾을 수 없습니다.', code: 'USER_NOT_FOUND' },
        { status: 404 }
      );
    }

    if (!targetUser.show_info_public) {
      const summary: ProgressSummary & { isPrivate: boolean } = {
        big3: { latest: null, history: [], changes: null },
        isPrivate: true,
      };
      return NextResponse.json(summary);
    }

    // 2. 진행 현황 조회
    const { searchParams } = new URL(request.url);
    const months = Math.min(Math.max(parseInt(searchParams.get('months') || '6', 10), 1), 24);

    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months);
    const startDateStr = startDate.toISOString().split('T')[0];

    // RLS 우회 — service role
    const adminClient = createAdminClient();
    const { data, error } = await adminClient
      .from('routine_events')
      .select('date, data')
      .eq('user_id', targetUserId)
      .eq('type', 'workout')
      .eq('status', 'completed')
      .gte('date', startDateStr)
      .order('date', { ascending: true });

    if (error) {
      console.error('[Progress User] Error:', error);
      return handleSupabaseError(error);
    }

    const events = data as Pick<DbRoutineEvent, 'date' | 'data'>[];

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

    const history: Big3DataPoint[] = [];
    let rollingSquat = 0;
    let rollingBench = 0;
    let rollingDeadlift = 0;

    for (const [date, maxes] of dailyMaxes) {
      if (maxes.squat > 0) rollingSquat = maxes.squat;
      if (maxes.bench > 0) rollingBench = maxes.bench;
      if (maxes.deadlift > 0) rollingDeadlift = maxes.deadlift;

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

    const summary: ProgressSummary & { isPrivate: boolean } = { big3, isPrivate: false };

    return NextResponse.json(summary);
  }
);
