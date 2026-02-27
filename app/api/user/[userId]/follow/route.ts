/**
 * User Follow API Route
 *
 * POST /api/user/[userId]/follow - 팔로우/언팔로우 토글
 */

import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/utils/supabase/auth';

/**
 * POST /api/user/[userId]/follow
 * 팔로우 토글 (팔로우 중이면 언팔로우, 아니면 팔로우)
 */
export const POST = withAuth<NextResponse, { userId: string }>(async (_request: NextRequest, { supabase, params }) => {
  const { userId: targetUserId } = await params;

  // 현재 사용자 ID 조회
  const { data: currentUserId } = await supabase.rpc('current_user_id');
  if (!currentUserId) {
    return NextResponse.json(
      { error: '사용자를 찾을 수 없습니다.' },
      { status: 404 }
    );
  }

  // 자기 자신은 팔로우 불가
  if (currentUserId === targetUserId) {
    return NextResponse.json(
      { error: '자기 자신을 팔로우할 수 없습니다.' },
      { status: 400 }
    );
  }

  // 현재 팔로우 상태 확인
  const { data: existingFollow } = await supabase
    .from('user_follows')
    .select('follower_id')
    .eq('follower_id', currentUserId)
    .eq('following_id', targetUserId)
    .maybeSingle();

  let isFollowing: boolean;

  if (existingFollow) {
    // 언팔로우
    const { error } = await supabase
      .from('user_follows')
      .delete()
      .eq('follower_id', currentUserId)
      .eq('following_id', targetUserId);

    if (error) {
      console.error('[POST /api/user/[userId]/follow] Delete error:', error);
      return NextResponse.json(
        { error: '팔로잉 취소에 실패했습니다.' },
        { status: 500 }
      );
    }

    isFollowing = false;
  } else {
    // 팔로우
    const { error } = await supabase
      .from('user_follows')
      .insert({ follower_id: currentUserId, following_id: targetUserId });

    if (error) {
      console.error('[POST /api/user/[userId]/follow] Insert error:', error);
      return NextResponse.json(
        { error: '팔로우에 실패했습니다.' },
        { status: 500 }
      );
    }

    isFollowing = true;
  }

  return NextResponse.json({ isFollowing });
});
