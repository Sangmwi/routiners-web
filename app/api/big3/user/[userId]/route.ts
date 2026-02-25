import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/utils/supabase/auth';
import { createAdminClient } from '@/utils/supabase/admin';
import type { DbBig3Record, Big3LiftType, Big3LiftSummary, Big3RecordsSummary } from '@/lib/types/big3';
import type { Big3DataPoint } from '@/lib/types/progress';

const LIFT_TYPES: Big3LiftType[] = ['squat', 'bench', 'deadlift'];

/**
 * GET /api/big3/user/[userId]
 * 특정 사용자의 3대운동 요약 정보 조회
 *
 * - show_info_public이 true인 경우에만 데이터 반환
 * - 비공개인 경우 빈 summary + isPrivate: true 반환
 */
export const GET = withAuth(
  async (request: NextRequest, { supabase }) => {
    const url = new URL(request.url);
    const segments = url.pathname.split('/');
    const targetUserId = segments[segments.length - 1];
    const { searchParams } = url;
    const months = Math.min(Math.max(parseInt(searchParams.get('months') || '6', 10), 1), 24);

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
      const summary: Big3RecordsSummary = {
        lifts: [],
        latestTotal: 0,
        totalChange: 0,
        totalRecords: 0,
        isPrivate: true,
      };
      return NextResponse.json(summary);
    }

    // 2. 공개인 경우 데이터 조회 (RLS 우회)
    const adminClient = createAdminClient();

    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months);
    const startDateStr = startDate.toISOString().split('T')[0];

    const { count: totalRecords } = await adminClient
      .from('big3_records')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', targetUserId);

    const lifts: Big3LiftSummary[] = [];

    for (const liftType of LIFT_TYPES) {
      const { data: latestRecords } = await adminClient
        .from('big3_records')
        .select('weight, recorded_at')
        .eq('user_id', targetUserId)
        .eq('lift_type', liftType)
        .order('recorded_at', { ascending: false })
        .limit(2);

      const { data: prRecord } = await adminClient
        .from('big3_records')
        .select('weight, recorded_at')
        .eq('user_id', targetUserId)
        .eq('lift_type', liftType)
        .order('weight', { ascending: false })
        .limit(1);

      const { count: liftCount } = await adminClient
        .from('big3_records')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', targetUserId)
        .eq('lift_type', liftType);

      const latest = latestRecords?.[0];
      const previous = latestRecords?.[1];
      const pr = prRecord?.[0];

      lifts.push({
        liftType,
        allTimePr: pr ? Number(pr.weight) : null,
        allTimePrDate: pr?.recorded_at ?? null,
        latest: latest ? Number(latest.weight) : null,
        latestDate: latest?.recorded_at ?? null,
        change: latest && previous ? Number((Number(latest.weight) - Number(previous.weight)).toFixed(1)) : 0,
        totalRecords: liftCount || 0,
      });
    }

    const latestTotal = lifts.reduce((sum, l) => sum + (l.latest ?? 0), 0);
    const totalChange = lifts.reduce((sum, l) => sum + l.change, 0);

    // 시계열 히스토리
    const { data: historyData } = await adminClient
      .from('big3_records')
      .select('recorded_at, lift_type, weight')
      .eq('user_id', targetUserId)
      .gte('recorded_at', startDateStr)
      .order('recorded_at', { ascending: true });

    const history = buildHistory(historyData || []);

    const summary: Big3RecordsSummary = {
      lifts,
      latestTotal,
      totalChange: Number(totalChange.toFixed(1)),
      totalRecords: totalRecords || 0,
      history,
    };

    return NextResponse.json(summary);
  },
);

function buildHistory(
  records: Pick<DbBig3Record, 'recorded_at' | 'lift_type' | 'weight'>[],
): Big3DataPoint[] {
  const dailyMaxes = new Map<string, { squat: number; bench: number; deadlift: number }>();

  for (const record of records) {
    const date = record.recorded_at;
    const weight = Number(record.weight);
    if (weight <= 0) continue;

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

  return history;
}
