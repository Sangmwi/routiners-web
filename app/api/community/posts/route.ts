/**
 * Community Posts API Route
 *
 * GET  /api/community/posts - 게시글 목록 조회
 * POST /api/community/posts - 게시글 작성
 */

import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/utils/supabase/auth';
import {
  toCommunityPost,
  type DbCommunityPost,
} from '@/lib/types/community';

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 50;

/**
 * GET /api/community/posts
 * 게시글 목록 조회
 */
export const GET = withAuth(async (request: NextRequest, { authUser, supabase }) => {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get('category');
  const authorId = searchParams.get('authorId');
  const search = searchParams.get('search');
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10));
  const limit = Math.min(
    MAX_LIMIT,
    Math.max(1, parseInt(searchParams.get('limit') ?? String(DEFAULT_LIMIT), 10))
  );
  const offset = (page - 1) * limit;

  // 기본 쿼리
  let query = supabase
    .from('community_posts')
    .select(
      `
      *,
      author:users!author_id(id, nickname, rank, profile_images)
    `,
      { count: 'exact' }
    )
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  // 필터 적용
  if (category && category !== 'all') {
    query = query.eq('category', category);
  }
  if (authorId) {
    query = query.eq('author_id', authorId);
  }
  if (search) {
    query = query.ilike('content', `%${search}%`);
  }

  const { data: posts, error, count } = await query;

  if (error) {
    console.error('[GET /api/community/posts] Error:', error);
    return NextResponse.json(
      { error: '게시글 목록을 불러오는데 실패했습니다.' },
      { status: 500 }
    );
  }

  if (!posts || posts.length === 0) {
    return NextResponse.json({
      posts: [],
      total: 0,
      page,
      hasMore: false,
    });
  }

  // 좋아요 여부 확인
  const postIds = posts.map((p) => p.id);
  const { data: likes } = await supabase
    .from('community_likes')
    .select('post_id')
    .eq('user_id', authUser.id)
    .in('post_id', postIds);

  const likedPostIds = new Set(likes?.map((l) => l.post_id) ?? []);

  // 응답 변환
  const transformedPosts = posts.map((post) =>
    toCommunityPost(
      post as DbCommunityPost,
      post.author,
      likedPostIds.has(post.id)
    )
  );

  const total = count ?? 0;

  return NextResponse.json({
    posts: transformedPosts,
    total,
    page,
    hasMore: offset + posts.length < total,
  });
});

/**
 * POST /api/community/posts
 * 게시글 작성
 */
export const POST = withAuth(async (request: NextRequest, { authUser, supabase }) => {
  const body = await request.json();
  const { category, content, imageUrls } = body;

  // 유효성 검사
  if (!content || content.trim().length === 0) {
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

  const validCategories = ['general', 'workout', 'meal', 'qna'];
  if (!validCategories.includes(category)) {
    return NextResponse.json(
      { error: '올바른 카테고리를 선택해주세요.' },
      { status: 400 }
    );
  }

  // 게시글 생성
  const { data: post, error } = await supabase
    .from('community_posts')
    .insert({
      author_id: authUser.id,
      category,
      content: content.trim(),
      image_urls: imageUrls ?? [],
    })
    .select(
      `
      *,
      author:users!author_id(id, nickname, rank, profile_images)
    `
    )
    .single();

  if (error) {
    console.error('[POST /api/community/posts] Error:', error);
    return NextResponse.json(
      { error: '게시글 작성에 실패했습니다.' },
      { status: 500 }
    );
  }

  return NextResponse.json(
    toCommunityPost(post as DbCommunityPost, post.author, false)
  );
});
