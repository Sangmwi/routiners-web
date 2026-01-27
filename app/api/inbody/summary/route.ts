import { NextResponse } from 'next/server';
import { withAuth } from '@/utils/supabase/auth';
import {
  toInBodyRecord,
  DbInBodyRecord,
  InBodySummary,
} from '@/lib/types/inbody';
import { handleSupabaseError } from '@/lib/utils/apiResponse';

/**
 * GET /api/inbody/summary
 * InBody 요약 정보 조회 (프로필 표시용)
 */
export const GET = withAuth(async (_request, { supabase }) => {
  // 최근 2개 기록 조회 (최신 + 이전 기록 비교용)
  const { data, error, count } = await supabase
    .from('inbody_records')
    .select('*', { count: 'exact' })
    .order('measured_at', { ascending: false })
    .limit(2);

  if (error) {
    console.error('[InBody Summary] Error:', error);
    return handleSupabaseError(error);
  }

  const records = (data as DbInBodyRecord[]).map(toInBodyRecord);
  const totalRecords = count || 0;

  const summary: InBodySummary = {
    totalRecords,
  };

  // 최신 기록이 있으면 추가
  if (records.length > 0) {
    summary.latest = records[0];

    // 이전 기록이 있으면 변화량 계산
    if (records.length > 1) {
      const latest = records[0];
      const previous = records[1];

      // 측정일 차이 계산
      const latestDate = new Date(latest.measuredAt);
      const previousDate = new Date(previous.measuredAt);
      const periodDays = Math.round(
        (latestDate.getTime() - previousDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      summary.changes = {
        weight: Number((latest.weight - previous.weight).toFixed(2)),
        skeletalMuscleMass: Number(
          (latest.skeletalMuscleMass - previous.skeletalMuscleMass).toFixed(2)
        ),
        bodyFatPercentage: Number(
          (latest.bodyFatPercentage - previous.bodyFatPercentage).toFixed(1)
        ),
        periodDays,
      };
    }
  }

  return NextResponse.json(summary);
});
