/**
 * Community Mutation Hooks
 *
 * 커뮤니티 데이터 변경용 React Query 훅
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/constants/queryKeys';
import {
  createCommunityPost,
  updateCommunityPost,
  deleteCommunityPost,
  togglePostLike,
  createComment,
  deleteComment,
  uploadPostImages,
} from '@/lib/api/community';
import type {
  CreatePostRequest,
  UpdatePostRequest,
  CreateCommentRequest,
  CommunityPost,
  PostListResponse,
} from '@/lib/types/community';
import type { InfiniteData } from '@tanstack/react-query';

/**
 * 게시글 작성
 */
export function useCreatePost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreatePostRequest) => createCommunityPost(data),
    onSuccess: () => {
      // 게시글 목록 캐시 무효화
      queryClient.invalidateQueries({
        queryKey: queryKeys.post.lists(),
      });
    },
  });
}

/**
 * 게시글 수정
 */
export function useUpdatePost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      postId,
      data,
    }: {
      postId: string;
      data: UpdatePostRequest;
    }) => updateCommunityPost(postId, data),
    onSuccess: (updatedPost, { postId }) => {
      // 해당 게시글 캐시 업데이트
      queryClient.setQueryData(queryKeys.post.detail(postId), updatedPost);
      // 목록 캐시 무효화
      queryClient.invalidateQueries({
        queryKey: queryKeys.post.lists(),
      });
    },
  });
}

/**
 * 게시글 삭제
 */
export function useDeletePost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (postId: string) => deleteCommunityPost(postId),
    onSuccess: (_, postId) => {
      // 해당 게시글 캐시 제거
      queryClient.removeQueries({
        queryKey: queryKeys.post.detail(postId),
      });
      // 목록 캐시 무효화
      queryClient.invalidateQueries({
        queryKey: queryKeys.post.lists(),
      });
    },
  });
}

/**
 * list 캐시 내 특정 게시글의 좋아요 상태를 업데이트하는 헬퍼
 */
function updatePostInListCache(
  post: CommunityPost,
  postId: string,
  isLiked: boolean,
  likesCount: number
): CommunityPost {
  if (post.id !== postId) return post;
  return { ...post, isLiked, likesCount };
}

/**
 * 좋아요 토글
 */
export function useToggleLike() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (postId: string) => togglePostLike(postId),
    onMutate: async (postId) => {
      // detail + list 쿼리 모두 취소
      await queryClient.cancelQueries({
        queryKey: queryKeys.post.detail(postId),
      });
      await queryClient.cancelQueries({
        queryKey: queryKeys.post.lists(),
      });

      // 1) detail 캐시 낙관적 업데이트
      const previousPost = queryClient.getQueryData<CommunityPost>(
        queryKeys.post.detail(postId)
      );

      let newIsLiked: boolean | undefined;

      if (previousPost) {
        newIsLiked = !previousPost.isLiked;
        queryClient.setQueryData(queryKeys.post.detail(postId), {
          ...previousPost,
          isLiked: newIsLiked,
          likesCount: previousPost.likesCount + (newIsLiked ? 1 : -1),
        });
      }

      // 2) list 캐시 낙관적 업데이트 (infinite query + 일반 query 모두)
      const previousLists: Array<{
        queryKey: readonly unknown[];
        data: unknown;
      }> = [];

      queryClient
        .getQueriesData<InfiniteData<PostListResponse>>({
          queryKey: queryKeys.post.lists(),
        })
        .forEach(([queryKey, data]) => {
          if (!data) return;
          previousLists.push({ queryKey, data });

          // infinite query (pages 배열이 있는 경우)
          if ('pages' in data && Array.isArray(data.pages)) {
            // 아직 newIsLiked를 모르면 첫 번째 매칭 게시글에서 결정
            if (newIsLiked === undefined) {
              for (const page of data.pages) {
                const found = page.posts.find(
                  (p: CommunityPost) => p.id === postId
                );
                if (found) {
                  newIsLiked = !found.isLiked;
                  break;
                }
              }
            }

            if (newIsLiked === undefined) return;

            queryClient.setQueryData(queryKey, {
              ...data,
              pages: data.pages.map((page: PostListResponse) => ({
                ...page,
                posts: page.posts.map((post: CommunityPost) =>
                  updatePostInListCache(
                    post,
                    postId,
                    newIsLiked!,
                    post.id === postId
                      ? post.likesCount + (newIsLiked! ? 1 : -1)
                      : post.likesCount
                  )
                ),
              })),
            });
          }

          // 일반 query (PostListResponse 형태)
          else if ('posts' in data) {
            const listData = data as unknown as PostListResponse;

            if (newIsLiked === undefined) {
              const found = listData.posts.find((p) => p.id === postId);
              if (found) newIsLiked = !found.isLiked;
            }

            if (newIsLiked === undefined) return;

            queryClient.setQueryData(queryKey, {
              ...listData,
              posts: listData.posts.map((post: CommunityPost) =>
                updatePostInListCache(
                  post,
                  postId,
                  newIsLiked!,
                  post.id === postId
                    ? post.likesCount + (newIsLiked! ? 1 : -1)
                    : post.likesCount
                )
              ),
            });
          }
        });

      return { previousPost, previousLists };
    },
    onError: (_, postId, context) => {
      // detail 캐시 롤백
      if (context?.previousPost) {
        queryClient.setQueryData(
          queryKeys.post.detail(postId),
          context.previousPost
        );
      }
      // list 캐시 롤백
      context?.previousLists?.forEach(({ queryKey, data }) => {
        queryClient.setQueryData(queryKey, data);
      });
    },
    onSuccess: (result, postId) => {
      // detail 캐시를 서버 결과로 최종 업데이트
      const currentPost = queryClient.getQueryData<CommunityPost>(
        queryKeys.post.detail(postId)
      );
      if (currentPost) {
        queryClient.setQueryData(queryKeys.post.detail(postId), {
          ...currentPost,
          isLiked: result.isLiked,
          likesCount: result.likesCount,
        });
      }

      // list 캐시도 서버 결과로 최종 업데이트
      queryClient
        .getQueriesData({ queryKey: queryKeys.post.lists() })
        .forEach(([queryKey, data]) => {
          if (!data || typeof data !== 'object') return;

          // infinite query (pages 배열이 있는 경우)
          if ('pages' in data) {
            const infiniteData = data as InfiniteData<PostListResponse>;
            if (!Array.isArray(infiniteData.pages)) return;
            queryClient.setQueryData(queryKey, {
              ...infiniteData,
              pages: infiniteData.pages.map((page) => ({
                ...page,
                posts: page.posts.map((post) =>
                  updatePostInListCache(post, postId, result.isLiked, result.likesCount)
                ),
              })),
            });
          } else if ('posts' in data) {
            // 일반 query (PostListResponse 형태)
            const listData = data as unknown as PostListResponse;
            queryClient.setQueryData(queryKey, {
              ...listData,
              posts: listData.posts.map((post) =>
                updatePostInListCache(post, postId, result.isLiked, result.likesCount)
              ),
            });
          }
        });
    },

    // 성공/실패 무관하게 서버 데이터와 최종 재동기화
    onSettled: (_, __, postId) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.post.detail(postId) });
    },
  });
}

/**
 * 댓글 작성
 */
export function useCreateComment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      postId,
      data,
    }: {
      postId: string;
      data: CreateCommentRequest;
    }) => createComment(postId, data),
    onSuccess: (_, { postId }) => {
      // 댓글 목록 캐시 무효화
      queryClient.invalidateQueries({
        queryKey: queryKeys.post.comments(postId),
      });
      // 게시글의 댓글 수 업데이트를 위해 목록도 무효화
      queryClient.invalidateQueries({
        queryKey: queryKeys.post.lists(),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.post.detail(postId),
      });
    },
  });
}

/**
 * 댓글 삭제
 */
export function useDeleteComment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      postId,
      commentId,
    }: {
      postId: string;
      commentId: string;
    }) => deleteComment(postId, commentId),
    onSuccess: (_, { postId }) => {
      // 댓글 목록 캐시 무효화
      queryClient.invalidateQueries({
        queryKey: queryKeys.post.comments(postId),
      });
      // 게시글의 댓글 수 업데이트를 위해 목록도 무효화
      queryClient.invalidateQueries({
        queryKey: queryKeys.post.lists(),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.post.detail(postId),
      });
    },
  });
}

/**
 * 이미지 업로드
 */
export function useUploadImages() {
  return useMutation({
    mutationFn: (files: File[]) => uploadPostImages(files),
  });
}
