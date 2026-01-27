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
 * 좋아요 토글
 */
export function useToggleLike() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (postId: string) => togglePostLike(postId),
    onMutate: async (postId) => {
      // 낙관적 업데이트
      await queryClient.cancelQueries({
        queryKey: queryKeys.post.detail(postId),
      });

      const previousPost = queryClient.getQueryData<CommunityPost>(
        queryKeys.post.detail(postId)
      );

      if (previousPost) {
        const newIsLiked = !previousPost.isLiked;
        queryClient.setQueryData(queryKeys.post.detail(postId), {
          ...previousPost,
          isLiked: newIsLiked,
          likesCount: previousPost.likesCount + (newIsLiked ? 1 : -1),
        });
      }

      return { previousPost };
    },
    onError: (_, postId, context) => {
      // 에러 시 롤백
      if (context?.previousPost) {
        queryClient.setQueryData(
          queryKeys.post.detail(postId),
          context.previousPost
        );
      }
    },
    onSuccess: (result, postId) => {
      // 서버 결과로 최종 업데이트
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
      // 목록 캐시 무효화
      queryClient.invalidateQueries({
        queryKey: queryKeys.post.lists(),
      });
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
