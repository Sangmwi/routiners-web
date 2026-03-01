import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/utils/supabase/auth';
import { createAdminClient } from '@/utils/supabase/admin';
import { notFound, internalError } from '@/lib/utils/apiResponse';
import {
  DbDietaryProfile,
  transformDbDietaryProfile,
} from '@/lib/types/meal';

/**
 * GET /api/dietary-profile/user/[userId]
 * 특정 사용자의 식단 프로필 조회
 *
 * - showInfoPublic이 true인 경우에만 데이터 반환
 * - 비공개인 경우 { isPrivate: true } 반환
 */
export const GET = withAuth<NextResponse, { userId: string }>(
  async (
    _request: NextRequest,
    { supabase, params }
  ) => {
    const { userId: targetUserId } = await params;

    // 1. 대상 사용자의 공개 설정 확인
    const { data: targetUser, error: userError } = await supabase
      .from('users')
      .select('show_info_public')
      .eq('id', targetUserId)
      .single();

    if (userError || !targetUser) {
      return notFound('사용자를 찾을 수 없습니다.');
    }

    if (!targetUser.show_info_public) {
      return NextResponse.json({ profile: null, isPrivate: true });
    }

    // 2. 식단 프로필 조회 (RLS 우회 — service role)
    const adminClient = createAdminClient();
    const { data, error } = await adminClient
      .from('dietary_profiles')
      .select('*')
      .eq('user_id', targetUserId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ profile: null, isPrivate: false });
      }

      console.error('[Dietary Profile User] Error:', error);
      return internalError('프로필을 불러오는데 실패했습니다.');
    }

    return NextResponse.json({
      profile: transformDbDietaryProfile(data as DbDietaryProfile),
      isPrivate: false,
    });
  }
);
