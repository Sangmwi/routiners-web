import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/utils/supabase/auth';
import { createAdminClient } from '@/utils/supabase/admin';
import type { Big3DataPoint, Big3Summary, ProgressSummary } from '@/lib/types/progress';
import type { Big3LiftType } from '@/lib/types/big3';

/**
 * GET /api/routine/events/stats/progress/user/[userId]
 * 특정 사용자의 3대 운동 진행 현황 조회 (big3_records 테이블 기반)
 */
export const GET = withAuth(
  async (request: NextRequest, { supabase }) => {
    const url = new URL(request.url);
    const targetUserId = url.pathname.split('/').pop();

    if (!targetUserId) {
      return NextResponse.json(
        { error: '사용자 ID가 필요합니다.', code: 'MISSING_USER_ID' },
        { status: 400 },
      );
    }

    // 1. 공개 설정 확인
    const { data: targetUser, error: userError } = await supabase
      .from('users')
      .select('show_info_public')
      .eq('id', targetUserId)
      .single();

    if (userError || !targetUser) {
      return NextResponse.json(
        { error: '사용자를 찾을 수 없습니다.', code: 'USER_NOT_FOUND' },
        { status: 404 },
      );
    }

    if (!targetUser.show_info_public) {
      const summary: ProgressSummary & { isPrivate: boolean } = {
        big3: { latest: null, history: [], changes: null },
        isPrivate: true,
      };
      return NextResponse.json(summary);
    }

    // 2. big3_records 조회
    const { searchParams } = new URL(request.url);
    const months = Math.min(Math.max(parseInt(searchParams.get('months') || '6', 10), 1), 24);

    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months);
    const startDateStr = startDate.toISOString().split('T')[0];

    const adminClient = createAdminClient();
    const { data, error } = await adminClient
      .from('big3_records')
      .select('recorded_at, lift_type, weight')
      .eq('user_id', targetUserId)
      .gte('recorded_at', startDateStr)
      .order('recorded_at', { ascending: true });

    if (error) {
      console.error('[Progress User] Error:', error);
      return NextResponse.json(
        { error: '기록을 불러오는데 실패했습니다.', code: 'DATABASE_ERROR' },
        { status: 500 },
      );
    }

    const records = (data ?? []) as { recorded_at: string; lift_type: Big3LiftType; weight: number }[];

    const { history, changes } = buildHistoryAndChanges(records);

    const big3: Big3Summary = {
      latest: history.length > 0 ? history[history.length - 1] : null,
      history,
      changes,
    };

    const summary: ProgressSummary & { isPrivate: boolean } = { big3, isPrivate: false };
    return NextResponse.json(summary);
  },
);

function buildHistoryAndChanges(
  records: { recorded_at: string; lift_type: Big3LiftType; weight: number }[],
): { history: Big3DataPoint[]; changes: Big3Summary['changes'] } {
  const dailyMaxes = new Map<string, { squat: number; bench: number; deadlift: number }>();

  for (const record of records) {
    const weight = Number(record.weight);
    if (weight <= 0) continue;

    const date = record.recorded_at;
    if (!dailyMaxes.has(date)) {
      dailyMaxes.set(date, { squat: 0, bench: 0, deadlift: 0 });
    }

    const entry = dailyMaxes.get(date)!;
    entry[record.lift_type] = Math.max(entry[record.lift_type], weight);
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

  return { history, changes };
}
