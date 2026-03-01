/**
 * Community Post Detail API Route
 *
 * GET    /api/community/posts/[id] - 게시글 상세 조회
 * PATCH  /api/community/posts/[id] - 게시글 수정
 * DELETE /api/community/posts/[id] - 게시글 삭제 (soft delete)
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { withAuth } from '@/utils/supabase/auth';
import { createClient } from '@/utils/supabase/server';
import { toCommunityPost, type DbCommunityPost } from '@/lib/types/community';
import { badRequest, forbidden, internalError, notFound, validateRequest } from '@/lib/utils/apiResponse';

// ============================================================================
// Schemas
// ============================================================================

const UpdatePostSchema = z.object({
  content: z.string().trim().min(1, '내용을 입력해주세요.').max(2000, '내용은 2000자를 초과할 수 없습니다.').optional(),
  imageUrls: z.array(z.string().url()).optional(),
});

// ============================================================================
// Helpers
// ============================================================================

type SupabaseInRoute = Awaited<ReturnType<typeof createClient>>;

type AssertOwnerResult =
  | { ok: true; currentUserId: string }
  | { ok: false; response: NextResponse };

async function assertPostOwner(
  supabase: SupabaseInRoute,
  id: string,
): Promise<AssertOwnerResult> {
  const { data: currentUserId } = await supabase.rpc('current_user_id');
  if (!currentUserId) {
    return { ok: false, response: notFound('사용자를 찾을 수 없습니다.') };
  }

  const { data: existing } = await supabase
    .from('community_posts')
    .select('author_id')
    .eq('id', id)
    .is('deleted_at', null)
    .single();

  if (!existing) {
    return { ok: false, response: notFound('게시글을 찾을 수 없습니다.') };
  }

  if (existing.author_id !== currentUserId) {
    return { ok: false, response: forbidden('본인의 게시글만 접근할 수 있습니다.') };
  }

  return { ok: true, currentUserId };
}

/**
 * GET /api/community/posts/[id]
 * 게시글 상세 조회
 */
export const GET = withAuth<NextResponse, { id: string }>(async (_request: NextRequest, { supabase, params }) => {
  const { id } = await params;

  const { data: post, error } = await supabase
    .from('community_posts')
    .select(
      `
      *,
      author:users!author_id(id, nickname, rank, profile_photo_url)
    `
    )
    .eq('id', id)
    .is('deleted_at', null)
    .single();

  if (error || !post) {
    return notFound('게시글을 찾을 수 없습니다.');
  }

  // 현재 사용자의 public.users.id 조회
  const { data: currentUserId } = await supabase.rpc('current_user_id');

  // 좋아요 여부 확인
  const { data: like } = currentUserId
    ? await supabase
        .from('community_likes')
        .select('post_id')
        .eq('user_id', currentUserId)
        .eq('post_id', id)
        .maybeSingle()
    : { data: null };

  return NextResponse.json(
    toCommunityPost(post as DbCommunityPost, post.author, !!like)
  );
});

/**
 * PATCH /api/community/posts/[id]
 * 게시글 수정
 */
export const PATCH = withAuth<NextResponse, { id: string }>(async (request: NextRequest, { supabase, params }) => {
  const { id } = await params;

  const ownerCheck = await assertPostOwner(supabase, id);
  if (!ownerCheck.ok) return ownerCheck.response;
  const { currentUserId } = ownerCheck;

  const result = await validateRequest(request, UpdatePostSchema);
  if (!result.success) return result.response;
  const { content, imageUrls } = result.data;

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
      author:users!author_id(id, nickname, rank, profile_photo_url)
    `
    )
    .single();

  if (error) {
    console.error('[PATCH /api/community/posts/[id]] Error:', error);
    return internalError('게시글 수정에 실패했습니다.');
  }

  // 좋아요 여부 확인
  const { data: like } = await supabase
    .from('community_likes')
    .select('post_id')
    .eq('user_id', currentUserId)
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
export const DELETE = withAuth<NextResponse, { id: string }>(async (_request: NextRequest, { supabase, params }) => {
  const { id } = await params;

  const ownerCheck = await assertPostOwner(supabase, id);
  if (!ownerCheck.ok) return ownerCheck.response;

  // Soft delete
  const { error } = await supabase
    .from('community_posts')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id);

  if (error) {
    console.error('[DELETE /api/community/posts/[id]] Error:', error);
    return internalError('게시글 삭제에 실패했습니다.');
  }

  return NextResponse.json({ success: true });
});
