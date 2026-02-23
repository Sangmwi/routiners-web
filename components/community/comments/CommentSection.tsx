'use client';

import { LoadingSpinner } from '@/components/ui/icons';
import { usePostComments } from '@/hooks/community/queries';
import CommentItem from './CommentItem';

interface CommentSectionProps {
  postId: string;
  commentsCount?: number;
  onReply: (commentId: string, authorName: string) => void;
}

export interface ReplyTarget {
  commentId: string;
  authorName: string;
}

export default function CommentSection({
  postId,
  commentsCount,
  onReply,
}: CommentSectionProps) {
  const { data, isLoading } = usePostComments(postId);

  return (
    <div className="space-y-4">
      {/* 헤더 */}
      {commentsCount !== undefined && (
        <h3 className="text-sm font-semibold text-foreground">
          댓글 {commentsCount}
        </h3>
      )}

      {/* 댓글 목록 */}
      {isLoading ? (
        <div className="flex justify-center py-6">
          <LoadingSpinner size="lg" />
        </div>
      ) : data && data.comments.length > 0 ? (
        <div className="space-y-4">
          {data.comments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              postId={postId}
              onReply={onReply}
            />
          ))}
        </div>
      ) : (
        <p className="text-center text-xs text-muted-foreground py-6">
          아직 댓글이 없어요. 첫 댓글을 남겨보세요!
        </p>
      )}
    </div>
  );
}
