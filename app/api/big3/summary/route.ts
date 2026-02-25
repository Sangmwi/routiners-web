import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/utils/supabase/auth';
import type { DbBig3Record, Big3LiftType, Big3LiftSummary, Big3RecordsSummary } from '@/lib/types/big3';
import type { Big3DataPoint } from '@/lib/types/progress';
import { handleSupabaseError } from '@/lib/utils/apiResponse';

const LIFT_TYPES: Big3LiftType[] = ['squat', 'bench', 'deadlift'];

/**
 * GET /api/big3/summary
 * 3대운동 요약 정보 (종목별 최신/PR/변화량 + 시계열 히스토리)
 */
export const GET = withAuth(async (request: NextRequest, { supabase }) => {
  const { searchParams } = new URL(request.url);
  const months = Math.min(Math.max(parseInt(searchParams.get('months') || '6', 10), 1), 24);

  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - months);
  const startDateStr = startDate.toISOString().split('T')[0];

  // 전체 기록 수 조회
  const { count: totalRecords } = await supabase
    .from('big3_records')
    .select('*', { count: 'exact', head: true });

  // 종목별 요약 생성
  const lifts: Big3LiftSummary[] = [];

  for (const liftType of LIFT_TYPES) {
    // 최신 2건 (변화량 계산용)
    const { data: latestRecords } = await supabase
      .from('big3_records')
      .select('weight, recorded_at')
      .eq('lift_type', liftType)
      .order('recorded_at', { ascending: false })
      .limit(2);

    // 역대 PR
    const { data: prRecord } = await supabase
      .from('big3_records')
      .select('weight, recorded_at')
      .eq('lift_type', liftType)
      .order('weight', { ascending: false })
      .limit(1);

    // 종목별 총 기록 수
    const { count: liftCount } = await supabase
      .from('big3_records')
      .select('*', { count: 'exact', head: true })
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

  // 합계 계산
  const latestTotal = lifts.reduce((sum, l) => sum + (l.latest ?? 0), 0);
  const totalChange = lifts.reduce((sum, l) => sum + l.change, 0);

  // 시계열 히스토리 생성 (Progress API 호환용)
  const { data: historyData } = await supabase
    .from('big3_records')
    .select('recorded_at, lift_type, weight')
    .gte('recorded_at', startDateStr)
    .order('recorded_at', { ascending: true });

  const history = buildHistory((historyData as Pick<DbBig3Record, 'recorded_at' | 'lift_type' | 'weight'>[]) || []);

  const summary: Big3RecordsSummary = {
    lifts,
    latestTotal,
    totalChange: Number(totalChange.toFixed(1)),
    totalRecords: totalRecords || 0,
    history,
  };

  return NextResponse.json(summary);
});

/**
 * big3_records → Big3DataPoint[] 시계열 히스토리 생성
 * (기존 Progress API의 rolling total 로직 재현)
 */
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
