'use client';

import { useState } from 'react';
import { SpinnerGapIcon } from '@phosphor-icons/react';
import { usePostComments } from '@/hooks/community/queries';
import CommentItem from './CommentItem';
import CommentInput from './CommentInput';

interface CommentSectionProps {
  postId: string;
  commentsCount: number;
}

export interface ReplyTarget {
  commentId: string;
  authorName: string;
}

export default function CommentSection({
  postId,
  commentsCount,
}: CommentSectionProps) {
  const { data, isLoading } = usePostComments(postId);
  const [replyingTo, setReplyingTo] = useState<ReplyTarget | null>(null);

  const handleReply = (commentId: string, authorName: string) => {
    setReplyingTo({ commentId, authorName });
  };

  const handleCancelReply = () => {
    setReplyingTo(null);
  };

  const handleCommentCreated = () => {
    setReplyingTo(null);
  };

  return (
    <div className="space-y-4">
      {/* 헤더 */}
      <h3 className="text-sm font-semibold text-foreground">
        댓글 {commentsCount}
      </h3>

      {/* 댓글 목록 */}
      {isLoading ? (
        <div className="flex justify-center py-6">
          <SpinnerGapIcon size={24} className="text-primary animate-spin" />
        </div>
      ) : data && data.comments.length > 0 ? (
        <div className="space-y-4">
          {data.comments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              postId={postId}
              onReply={handleReply}
            />
          ))}
        </div>
      ) : (
        <p className="text-center text-xs text-muted-foreground py-6">
          아직 댓글이 없어요. 첫 댓글을 남겨보세요!
        </p>
      )}

      {/* 댓글 입력 */}
      <CommentInput
        postId={postId}
        replyingTo={replyingTo}
        onCancelReply={handleCancelReply}
        onCreated={handleCommentCreated}
      />
    </div>
  );
}
