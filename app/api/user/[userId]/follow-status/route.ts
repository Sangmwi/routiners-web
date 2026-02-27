/**
 * User Follow Status API Route
 *
 * GET /api/user/[userId]/follow-status - 팔로우 상태 조회
 */

import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/utils/supabase/auth';

/**
 * GET /api/user/[userId]/follow-status
 * 현재 로그인 사용자가 해당 userId를 팔로우 중인지 확인
 */
export const GET = withAuth<NextResponse, { userId: string }>(async (_request: NextRequest, { supabase, params }) => {
  const { userId: targetUserId } = await params;

  // 현재 사용자 ID 조회
  const { data: currentUserId } = await supabase.rpc('current_user_id');
  if (!currentUserId) {
    return NextResponse.json({ isFollowing: false });
  }

  // 자기 자신은 항상 false
  if (currentUserId === targetUserId) {
    return NextResponse.json({ isFollowing: false });
  }

  const { data } = await supabase
    .from('user_follows')
    .select('follower_id')
    .eq('follower_id', currentUserId)
    .eq('following_id', targetUserId)
    .maybeSingle();

  return NextResponse.json({ isFollowing: !!data });
});
