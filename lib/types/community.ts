/**
 * Community Types
 *
 * 커뮤니티 게시판 관련 타입 정의
 * snake_case (DB) ↔ camelCase (Domain) 변환
 */

import { z } from 'zod';

// ============================================================================
// Database Types (snake_case)
// ============================================================================

export interface DbCommunityPost {
  id: string;
  author_id: string;
  category: string;
  content: string;
  image_urls: string[];
  likes_count: number;
  comments_count: number;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface DbCommunityComment {
  id: string;
  post_id: string;
  author_id: string;
  content: string;
  parent_id: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface DbCommunityLike {
  user_id: string;
  post_id: string;
  created_at: string;
}

// ============================================================================
// Domain Types (camelCase)
// ============================================================================

export interface PostAuthor {
  id: string;
  nickname: string;
  rank: string;
  profileImage?: string;
}

export interface CommunityPost {
  id: string;
  authorId: string;
  author?: PostAuthor;
  category: PostCategory;
  content: string;
  imageUrls: string[];
  likesCount: number;
  commentsCount: number;
  createdAt: string;
  updatedAt: string;
  isLiked?: boolean;
}

export interface CommunityComment {
  id: string;
  postId: string;
  authorId: string;
  author?: PostAuthor;
  content: string;
  parentId: string | null;
  createdAt: string;
  updatedAt: string;
  replies?: CommunityComment[];
}

// ============================================================================
// Constants
// ============================================================================

export const POST_CATEGORIES = [
  { id: 'general', label: '자유게시판' },
  { id: 'workout', label: '운동 인증' },
  { id: 'meal', label: '식단 공유' },
  { id: 'qna', label: '질문/답변' },
] as const;

export type PostCategory = (typeof POST_CATEGORIES)[number]['id'];

// ============================================================================
// Type Transformers
// ============================================================================

interface DbAuthorJoin {
  id: string;
  nickname: string;
  rank: string;
  profile_photo_url?: string | null;
}

/**
 * DB Author Join → PostAuthor 변환
 */
export function toPostAuthor(dbAuthor: DbAuthorJoin): PostAuthor {
  return {
    id: dbAuthor.id,
    nickname: dbAuthor.nickname,
    rank: dbAuthor.rank,
    profileImage: dbAuthor.profile_photo_url ?? undefined,
  };
}

/**
 * DbCommunityPost → CommunityPost 변환
 */
export function toCommunityPost(
  dbPost: DbCommunityPost,
  author?: DbAuthorJoin | null,
  isLiked?: boolean
): CommunityPost {
  return {
    id: dbPost.id,
    authorId: dbPost.author_id,
    author: author ? toPostAuthor(author) : undefined,
    category: dbPost.category as PostCategory,
    content: dbPost.content,
    imageUrls: dbPost.image_urls ?? [],
    likesCount: dbPost.likes_count,
    commentsCount: dbPost.comments_count,
    createdAt: dbPost.created_at,
    updatedAt: dbPost.updated_at,
    isLiked,
  };
}

/**
 * DbCommunityComment → CommunityComment 변환
 */
export function toCommunityComment(
  dbComment: DbCommunityComment,
  author?: DbAuthorJoin | null
): CommunityComment {
  return {
    id: dbComment.id,
    postId: dbComment.post_id,
    authorId: dbComment.author_id,
    author: author ? toPostAuthor(author) : undefined,
    content: dbComment.content,
    parentId: dbComment.parent_id,
    createdAt: dbComment.created_at,
    updatedAt: dbComment.updated_at,
  };
}

// ============================================================================
// API Request/Response Types
// ============================================================================

export interface CreatePostRequest {
  category: PostCategory;
  content: string;
  imageUrls?: string[];
}

export interface UpdatePostRequest {
  content?: string;
  imageUrls?: string[];
}

export interface CreateCommentRequest {
  content: string;
  parentId?: string;
}

export interface PostFilters {
  category?: PostCategory | 'all';
  authorId?: string;
  search?: string;
  dateRange?: 'all' | 'today' | 'week' | 'month';
  page?: number;
  limit?: number;
}

export interface PostListResponse {
  posts: CommunityPost[];
  total: number;
  page: number;
  hasMore: boolean;
}

export interface CommentListResponse {
  comments: CommunityComment[];
  total: number;
}

// ============================================================================
// Time Helpers
// ============================================================================

/**
 * ISO 날짜를 한국어 상대시간으로 변환
 * @example "1시간 전", "2일 전"
 */
export function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return '방금 전';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}분 전`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}시간 전`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}일 전`;

  return date.toLocaleDateString('ko-KR', {
    month: 'short',
    day: 'numeric',
  });
}

// ============================================================================
// Form Validation (클라이언트 사이드 Zod 스키마)
// ============================================================================

export const POST_CONTENT_MAX = 2000;
export const POST_CONTENT_MIN = 1;

/**
 * 게시글 폼 검증 스키마
 * - submit 시점에 실행
 * - PostWriteContent의 MAX_CONTENT_LENGTH와 동일값 사용
 */
export const PostFormSchema = z.object({
  content: z
    .string()
    .min(POST_CONTENT_MIN, '내용을 입력해주세요')
    .max(POST_CONTENT_MAX, `내용은 ${POST_CONTENT_MAX}자 이하로 입력해주세요`),
  category: z.enum(['general', 'workout', 'meal', 'qna'], {
    required_error: '카테고리를 선택해주세요',
  }),
});

/** 게시글 폼 필드별 에러 메시지 타입 */
export type PostFormErrors = Partial<Record<'content' | 'category', string>>;
