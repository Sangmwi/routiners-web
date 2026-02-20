/**
 * Community Comments API Route
 *
 * GET  /api/community/posts/[id]/comments - 댓글 목록 조회
 * POST /api/community/posts/[id]/comments - 댓글 작성
 */

import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/utils/supabase/auth';
import {
  toCommunityComment,
  type DbCommunityComment,
  type CommunityComment,
} from '@/lib/types/community';

/**
 * GET /api/community/posts/[id]/comments
 * 댓글 목록 조회
 */
export const GET = withAuth<NextResponse, { id: string }>(async (_request: NextRequest, { supabase, params }) => {
  const { id: postId } = await params;

  // 게시글 존재 확인
  const { data: post } = await supabase
    .from('community_posts')
    .select('id')
    .eq('id', postId)
    .is('deleted_at', null)
    .single();

  if (!post) {
    return NextResponse.json(
      { error: '게시글을 찾을 수 없습니다.' },
      { status: 404 }
    );
  }

  // 댓글 조회 (부모 댓글만 - parent_id가 null인 것)
  const { data: comments, error, count } = await supabase
    .from('community_comments')
    .select(
      `
      *,
      author:users!author_id(id, nickname, rank, profile_images)
    `,
      { count: 'exact' }
    )
    .eq('post_id', postId)
    .is('deleted_at', null)
    .is('parent_id', null)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('[GET /api/community/posts/[id]/comments] Error:', error);
    return NextResponse.json(
      { error: '댓글을 불러오는데 실패했습니다.' },
      { status: 500 }
    );
  }

  if (!comments || comments.length === 0) {
    return NextResponse.json({
      comments: [],
      total: 0,
    });
  }

  // 대댓글 조회
  const parentIds = comments.map((c) => c.id);
  const { data: replies } = await supabase
    .from('community_comments')
    .select(
      `
      *,
      author:users!author_id(id, nickname, rank, profile_images)
    `
    )
    .in('parent_id', parentIds)
    .is('deleted_at', null)
    .order('created_at', { ascending: true });

  // 대댓글 매핑
  const repliesMap = new Map<string, CommunityComment[]>();
  if (replies) {
    for (const reply of replies) {
      const parentId = reply.parent_id;
      if (!repliesMap.has(parentId)) {
        repliesMap.set(parentId, []);
      }
      repliesMap.get(parentId)!.push(toCommunityComment(reply as DbCommunityComment, reply.author));
    }
  }

  // 응답 변환
  const transformedComments = comments.map((comment) => {
    const transformed = toCommunityComment(comment as DbCommunityComment, comment.author);
    transformed.replies = repliesMap.get(comment.id) ?? [];
    return transformed;
  });

  const totalWithReplies = (count ?? 0) + (replies?.length ?? 0);

  return NextResponse.json({
    comments: transformedComments,
    total: totalWithReplies,
  });
});

/**
 * POST /api/community/posts/[id]/comments
 * 댓글 작성
 */
export const POST = withAuth<NextResponse, { id: string }>(async (request: NextRequest, { supabase, params }) => {
  const { id: postId } = await params;

  // 게시글 존재 확인
  const { data: post } = await supabase
    .from('community_posts')
    .select('id')
    .eq('id', postId)
    .is('deleted_at', null)
    .single();

  if (!post) {
    return NextResponse.json(
      { error: '게시글을 찾을 수 없습니다.' },
      { status: 404 }
    );
  }

  const body = await request.json();
  const { content, parentId } = body;

  // 유효성 검사
  if (!content || content.trim().length === 0) {
    return NextResponse.json(
      { error: '댓글 내용을 입력해주세요.' },
      { status: 400 }
    );
  }

  if (content.length > 500) {
    return NextResponse.json(
      { error: '댓글은 500자를 초과할 수 없습니다.' },
      { status: 400 }
    );
  }

  // 부모 댓글 확인 (대댓글인 경우)
  if (parentId) {
    const { data: parentComment } = await supabase
      .from('community_comments')
      .select('id')
      .eq('id', parentId)
      .eq('post_id', postId)
      .is('deleted_at', null)
      .single();

    if (!parentComment) {
      return NextResponse.json(
        { error: '부모 댓글을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }
  }

  // 댓글 생성 (author_id는 DEFAULT current_user_id()가 자동 채움)
  const { data: comment, error } = await supabase
    .from('community_comments')
    .insert({
      post_id: postId,
      content: content.trim(),
      parent_id: parentId ?? null,
    })
    .select(
      `
      *,
      author:users!author_id(id, nickname, rank, profile_images)
    `
    )
    .single();

  if (error) {
    console.error('[POST /api/community/posts/[id]/comments] Error:', error);
    return NextResponse.json(
      { error: '댓글 작성에 실패했습니다.' },
      { status: 500 }
    );
  }

  return NextResponse.json(toCommunityComment(comment as DbCommunityComment, comment.author));
});
