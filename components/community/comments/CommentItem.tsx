'use client';

import { TrashIcon } from '@phosphor-icons/react';
import { ImageWithFallback } from '@/components/ui/image';
import { useDeleteComment } from '@/hooks/community/mutations';
import { useCurrentUserProfile } from '@/hooks/profile/queries';
import { useConfirmDialog } from '@/lib/stores/modalStore';
import { formatTimeAgo } from '@/lib/types/community';
import { RANK_OPTIONS } from '@/lib/constants/military';
import type { CommunityComment } from '@/lib/types/community';

interface CommentItemProps {
  comment: CommunityComment;
  postId: string;
  onReply: (commentId: string, authorName: string) => void;
  isReply?: boolean;
}

export default function CommentItem({
  comment,
  postId,
  onReply,
  isReply = false,
}: CommentItemProps) {
  const { data: currentUser } = useCurrentUserProfile();
  const deleteComment = useDeleteComment();
  const confirm = useConfirmDialog();

  const author = comment.author;
  const authorName = author?.nickname ?? '알 수 없음';
  const authorAvatar = author?.profileImage;
  const authorRank = author?.rank
    ? RANK_OPTIONS.find((r) => r.value === author.rank)?.label ?? ''
    : '';
  const isOwner = currentUser?.id === comment.authorId;

  const handleDelete = () => {
    confirm({
      title: '댓글 삭제',
      message: '이 댓글을 삭제하시겠습니까?',
      confirmText: '삭제',
      variant: 'danger',
      onConfirm: async () => {
        await deleteComment.mutateAsync({ postId, commentId: comment.id });
      },
    });
  };

  const handleReply = () => {
    // 답글의 답글은 허용하지 않음 (1depth만) - 부모 댓글 ID로 답글
    const targetCommentId = comment.parentId ?? comment.id;
    onReply(targetCommentId, authorName);
  };

  return (
    <div className={isReply ? 'ml-10' : ''}>
      <div className="flex gap-2.5">
        {/* 아바타 */}
        <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded-full bg-primary/10">
          <ImageWithFallback
            src={authorAvatar}
            alt={authorName}
            fill
            className="object-cover"
            fallbackClassName="bg-primary/10"
            showFallbackIcon={false}
          />
          {!authorAvatar && (
            <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-primary">
              {authorName.charAt(0)}
            </div>
          )}
        </div>

        {/* 내용 */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-medium text-foreground">
              {authorName}
            </span>
            {authorRank && (
              <span className="text-xs text-muted-foreground">
                {authorRank}
              </span>
            )}
            <span className="text-xs text-muted-foreground">
              · {formatTimeAgo(comment.createdAt)}
            </span>
          </div>

          <p className="text-sm text-foreground mt-0.5 whitespace-pre-wrap break-words">
            {comment.content}
          </p>

          {/* 액션 */}
          <div className="flex items-center gap-3 mt-1.5">
            <button
              onClick={handleReply}
              className="text-xs text-muted-foreground hover:text-primary transition-colors"
            >
              답글
            </button>
            {isOwner && (
              <button
                onClick={handleDelete}
                className="text-xs text-muted-foreground hover:text-destructive transition-colors flex items-center gap-0.5"
              >
                <TrashIcon size={12} />
                삭제
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 답글 목록 */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="mt-3 space-y-3">
          {comment.replies.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              postId={postId}
              onReply={onReply}
              isReply
            />
          ))}
        </div>
      )}
    </div>
  );
}
