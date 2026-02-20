/**
 * Community Comment Detail API Route
 *
 * DELETE /api/community/posts/[id]/comments/[commentId] - 댓글 삭제
 */

import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/utils/supabase/auth';

/**
 * DELETE /api/community/posts/[id]/comments/[commentId]
 * 댓글 삭제 (soft delete)
 */
export const DELETE = withAuth<NextResponse, { id: string; commentId: string }>(async (_request: NextRequest, { supabase, params }) => {
  const { id: postId, commentId } = await params;

  // 현재 사용자의 public.users.id 조회
  const { data: currentUserId } = await supabase.rpc('current_user_id');
  if (!currentUserId) {
    return NextResponse.json(
      { error: '사용자를 찾을 수 없습니다.' },
      { status: 404 }
    );
  }

  // 댓글 존재 및 소유자 확인
  const { data: comment } = await supabase
    .from('community_comments')
    .select('id, author_id, post_id')
    .eq('id', commentId)
    .eq('post_id', postId)
    .is('deleted_at', null)
    .single();

  if (!comment) {
    return NextResponse.json(
      { error: '댓글을 찾을 수 없습니다.' },
      { status: 404 }
    );
  }

  if (comment.author_id !== currentUserId) {
    return NextResponse.json(
      { error: '본인의 댓글만 삭제할 수 있습니다.' },
      { status: 403 }
    );
  }

  // Soft delete
  const { error } = await supabase
    .from('community_comments')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', commentId);

  if (error) {
    console.error('[DELETE /api/community/posts/[id]/comments/[commentId]] Error:', error);
    return NextResponse.json(
      { error: '댓글 삭제에 실패했습니다.' },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
});
