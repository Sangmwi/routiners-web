import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/utils/supabase/auth';
import { createAdminClient } from '@/utils/supabase/admin';
import {
  toInBodyRecord,
  DbInBodyRecord,
  InBodySummary,
} from '@/lib/types/inbody';

/**
 * GET /api/inbody/user/[userId]
 * 특정 사용자의 InBody 요약 정보 조회
 *
 * - 해당 사용자의 showInfoPublic이 true인 경우에만 데이터 반환
 * - 비공개인 경우 빈 summary 반환
 */
export const GET = withAuth(
  async (
    request: NextRequest,
    { supabase }
  ) => {
    // URL에서 userId 추출 (기존 패턴 따름)
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

    // 비공개인 경우 빈 summary 반환
    if (!targetUser.show_info_public) {
      const summary: InBodySummary = {
        totalRecords: 0,
        isPrivate: true,
      };
      return NextResponse.json(summary);
    }

    // 2. 공개인 경우 인바디 데이터 조회 (RLS 우회 — service role)
    const adminClient = createAdminClient();
    const { data, error, count } = await adminClient
      .from('inbody_records')
      .select('*', { count: 'exact' })
      .eq('user_id', targetUserId)
      .order('measured_at', { ascending: false })
      .limit(2);

    if (error) {
      console.error('[InBody User Summary] Error:', error);
      return NextResponse.json(
        { error: '기록을 불러오는데 실패했습니다.', code: 'DATABASE_ERROR' },
        { status: 500 }
      );
    }

    const records = (data as DbInBodyRecord[]).map(toInBodyRecord);
    const totalRecords = count || 0;

    const summary: InBodySummary = {
      totalRecords,
      isPrivate: false,
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
  }
);
