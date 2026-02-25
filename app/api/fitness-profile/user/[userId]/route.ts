import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/utils/supabase/auth';
import { createAdminClient } from '@/utils/supabase/admin';
import {
  DbFitnessProfile,
  transformDbFitnessProfile,
} from '@/lib/types/fitness';

/**
 * GET /api/fitness-profile/user/[userId]
 * 특정 사용자의 피트니스 프로필 조회
 *
 * - showInfoPublic이 true인 경우에만 데이터 반환
 * - 비공개인 경우 { isPrivate: true } 반환
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
      return NextResponse.json({ profile: null, isPrivate: true });
    }

    // 2. 피트니스 프로필 조회 (RLS 우회 — service role)
    const adminClient = createAdminClient();
    const { data, error } = await adminClient
      .from('fitness_profiles')
      .select('*')
      .eq('user_id', targetUserId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ profile: null, isPrivate: false });
      }

      console.error('[Fitness Profile User] Error:', error);
      return NextResponse.json(
        { error: '프로필을 불러오는데 실패했습니다.', code: 'DATABASE_ERROR' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      profile: transformDbFitnessProfile(data as DbFitnessProfile),
      isPrivate: false,
    });
  }
);
