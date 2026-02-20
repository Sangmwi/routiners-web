/**
 * Community Post Like API Route
 *
 * POST /api/community/posts/[id]/like - 좋아요 토글
 */

import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/utils/supabase/auth';

/**
 * POST /api/community/posts/[id]/like
 * 좋아요 토글
 */
export const POST = withAuth<NextResponse, { id: string }>(async (_request: NextRequest, { supabase, params }) => {
  const { id: postId } = await params;

  // 현재 사용자의 public.users.id 조회
  const { data: currentUserId } = await supabase.rpc('current_user_id');
  if (!currentUserId) {
    return NextResponse.json(
      { error: '사용자를 찾을 수 없습니다.' },
      { status: 404 }
    );
  }

  // 게시글 존재 확인
  const { data: post } = await supabase
    .from('community_posts')
    .select('id, likes_count')
    .eq('id', postId)
    .is('deleted_at', null)
    .single();

  if (!post) {
    return NextResponse.json(
      { error: '게시글을 찾을 수 없습니다.' },
      { status: 404 }
    );
  }

  // 현재 좋아요 상태 확인
  const { data: existingLike } = await supabase
    .from('community_likes')
    .select('user_id')
    .eq('user_id', currentUserId)
    .eq('post_id', postId)
    .maybeSingle();

  let isLiked: boolean;
  let likesCount: number;

  if (existingLike) {
    // 좋아요 취소
    const { error } = await supabase
      .from('community_likes')
      .delete()
      .eq('user_id', currentUserId)
      .eq('post_id', postId);

    if (error) {
      console.error('[POST /api/community/posts/[id]/like] Delete error:', error);
      return NextResponse.json(
        { error: '좋아요 취소에 실패했습니다.' },
        { status: 500 }
      );
    }

    isLiked = false;
    likesCount = Math.max(0, post.likes_count - 1);
  } else {
    // 좋아요 추가 (user_id는 DEFAULT current_user_id()가 자동 채움)
    const { error } = await supabase.from('community_likes').insert({
      post_id: postId,
    });

    if (error) {
      console.error('[POST /api/community/posts/[id]/like] Insert error:', error);
      return NextResponse.json(
        { error: '좋아요에 실패했습니다.' },
        { status: 500 }
      );
    }

    isLiked = true;
    likesCount = post.likes_count + 1;
  }

  return NextResponse.json({ isLiked, likesCount });
});
