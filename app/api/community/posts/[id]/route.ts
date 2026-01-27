/**
 * Community Post Detail API Route
 *
 * GET    /api/community/posts/[id] - 게시글 상세 조회
 * PATCH  /api/community/posts/[id] - 게시글 수정
 * DELETE /api/community/posts/[id] - 게시글 삭제 (soft delete)
 */

import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/utils/supabase/auth';
import { toCommunityPost, type DbCommunityPost } from '@/lib/types/community';

/**
 * GET /api/community/posts/[id]
 * 게시글 상세 조회
 */
export const GET = withAuth<NextResponse, { id: string }>(async (request: NextRequest, { authUser, supabase, params }) => {
  const { id } = await params;

  const { data: post, error } = await supabase
    .from('community_posts')
    .select(
      `
      *,
      author:users!author_id(id, nickname, rank, profile_images)
    `
    )
    .eq('id', id)
    .is('deleted_at', null)
    .single();

  if (error || !post) {
    return NextResponse.json(
      { error: '게시글을 찾을 수 없습니다.' },
      { status: 404 }
    );
  }

  // 좋아요 여부 확인
  const { data: like } = await supabase
    .from('community_likes')
    .select('post_id')
    .eq('user_id', authUser.id)
    .eq('post_id', id)
    .maybeSingle();

  return NextResponse.json(
    toCommunityPost(post as DbCommunityPost, post.author, !!like)
  );
});

/**
 * PATCH /api/community/posts/[id]
 * 게시글 수정
 */
export const PATCH = withAuth<NextResponse, { id: string }>(async (request: NextRequest, { authUser, supabase, params }) => {
  const { id } = await params;

  // 게시글 소유자 확인
  const { data: existing } = await supabase
    .from('community_posts')
    .select('author_id')
    .eq('id', id)
    .is('deleted_at', null)
    .single();

  if (!existing) {
    return NextResponse.json(
      { error: '게시글을 찾을 수 없습니다.' },
      { status: 404 }
    );
  }

  if (existing.author_id !== authUser.id) {
    return NextResponse.json(
      { error: '본인의 게시글만 수정할 수 있습니다.' },
      { status: 403 }
    );
  }

  const body = await request.json();
  const { content, imageUrls } = body;

  // 유효성 검사
  if (content !== undefined) {
    if (content.trim().length === 0) {
      return NextResponse.json(
        { error: '내용을 입력해주세요.' },
        { status: 400 }
      );
    }
    if (content.length > 2000) {
      return NextResponse.json(
        { error: '내용은 2000자를 초과할 수 없습니다.' },
        { status: 400 }
      );
    }
  }

  // 업데이트할 필드 구성
  const updateData: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (content !== undefined) {
    updateData.content = content.trim();
  }
  if (imageUrls !== undefined) {
    updateData.image_urls = imageUrls;
  }

  const { data: post, error } = await supabase
    .from('community_posts')
    .update(updateData)
    .eq('id', id)
    .select(
      `
      *,
      author:users!author_id(id, nickname, rank, profile_images)
    `
    )
    .single();

  if (error) {
    console.error('[PATCH /api/community/posts/[id]] Error:', error);
    return NextResponse.json(
      { error: '게시글 수정에 실패했습니다.' },
      { status: 500 }
    );
  }

  // 좋아요 여부 확인
  const { data: like } = await supabase
    .from('community_likes')
    .select('post_id')
    .eq('user_id', authUser.id)
    .eq('post_id', id)
    .maybeSingle();

  return NextResponse.json(
    toCommunityPost(post as DbCommunityPost, post.author, !!like)
  );
});

/**
 * DELETE /api/community/posts/[id]
 * 게시글 삭제 (soft delete)
 */
export const DELETE = withAuth<NextResponse, { id: string }>(async (request: NextRequest, { authUser, supabase, params }) => {
  const { id } = await params;

  // 게시글 소유자 확인
  const { data: existing } = await supabase
    .from('community_posts')
    .select('author_id')
    .eq('id', id)
    .is('deleted_at', null)
    .single();

  if (!existing) {
    return NextResponse.json(
      { error: '게시글을 찾을 수 없습니다.' },
      { status: 404 }
    );
  }

  if (existing.author_id !== authUser.id) {
    return NextResponse.json(
      { error: '본인의 게시글만 삭제할 수 있습니다.' },
      { status: 403 }
    );
  }

  // Soft delete
  const { error } = await supabase
    .from('community_posts')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id);

  if (error) {
    console.error('[DELETE /api/community/posts/[id]] Error:', error);
    return NextResponse.json(
      { error: '게시글 삭제에 실패했습니다.' },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
});
