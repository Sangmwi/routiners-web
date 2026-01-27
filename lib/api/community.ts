/**
 * Community Client API Layer
 *
 * 클라이언트 컴포넌트용 커뮤니티 API 함수
 * - ApiClient를 통한 표준화된 에러 처리 (ApiError)
 * - React Query에서 queryFn으로 사용
 */

import { api } from './client';
import type {
  CommunityPost,
  CommunityComment,
  PostFilters,
  PostListResponse,
  CommentListResponse,
  CreatePostRequest,
  UpdatePostRequest,
  CreateCommentRequest,
} from '@/lib/types/community';

const BASE_URL = '/api/community';

// ============================================================================
// Helpers
// ============================================================================

/**
 * PostFilters → URLSearchParams 문자열 변환
 */
function buildPostQueryString(filters: PostFilters): string {
  const params = new URLSearchParams();

  if (filters.category && filters.category !== 'all') {
    params.set('category', filters.category);
  }
  if (filters.authorId) {
    params.set('authorId', filters.authorId);
  }
  if (filters.search) {
    params.set('search', filters.search);
  }
  if (filters.page) {
    params.set('page', String(filters.page));
  }
  if (filters.limit) {
    params.set('limit', String(filters.limit));
  }

  const qs = params.toString();
  return qs ? `?${qs}` : '';
}

// ============================================================================
// Posts API
// ============================================================================

/**
 * 게시글 목록 조회
 */
export async function fetchCommunityPosts(
  filters: PostFilters = {}
): Promise<PostListResponse> {
  return api.getOrThrow<PostListResponse>(
    `${BASE_URL}/posts${buildPostQueryString(filters)}`
  );
}

/**
 * 게시글 상세 조회
 */
export async function fetchCommunityPost(postId: string): Promise<CommunityPost> {
  return api.getOrThrow<CommunityPost>(`${BASE_URL}/posts/${postId}`);
}

/**
 * 게시글 작성
 */
export async function createCommunityPost(
  data: CreatePostRequest
): Promise<CommunityPost> {
  return api.post<CommunityPost>(`${BASE_URL}/posts`, data);
}

/**
 * 게시글 수정
 */
export async function updateCommunityPost(
  postId: string,
  data: UpdatePostRequest
): Promise<CommunityPost> {
  return api.patch<CommunityPost>(`${BASE_URL}/posts/${postId}`, data);
}

/**
 * 게시글 삭제 (soft delete)
 */
export async function deleteCommunityPost(postId: string): Promise<void> {
  await api.delete(`${BASE_URL}/posts/${postId}`);
}

/**
 * 좋아요 토글
 */
export async function togglePostLike(
  postId: string
): Promise<{ isLiked: boolean; likesCount: number }> {
  return api.post<{ isLiked: boolean; likesCount: number }>(
    `${BASE_URL}/posts/${postId}/like`
  );
}

// ============================================================================
// Comments API
// ============================================================================

/**
 * 댓글 목록 조회
 */
export async function fetchPostComments(
  postId: string
): Promise<CommentListResponse> {
  return api.getOrThrow<CommentListResponse>(
    `${BASE_URL}/posts/${postId}/comments`
  );
}

/**
 * 댓글 작성
 */
export async function createComment(
  postId: string,
  data: CreateCommentRequest
): Promise<CommunityComment> {
  return api.post<CommunityComment>(
    `${BASE_URL}/posts/${postId}/comments`,
    data
  );
}

/**
 * 댓글 삭제
 */
export async function deleteComment(
  postId: string,
  commentId: string
): Promise<void> {
  await api.delete(
    `${BASE_URL}/posts/${postId}/comments/${commentId}`
  );
}

// ============================================================================
// Image Upload API
// ============================================================================

/**
 * 이미지 업로드
 */
export async function uploadPostImages(files: File[]): Promise<string[]> {
  const formData = new FormData();
  files.forEach((file) => {
    formData.append('files', file);
  });

  const data = await api.post<{ urls: string[] }>(
    `${BASE_URL}/upload`,
    formData
  );
  return data.urls;
}
