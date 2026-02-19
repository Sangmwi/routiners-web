'use client';

import { useState } from 'react';
import { PaperPlaneRightIcon, XIcon } from '@phosphor-icons/react';
import { useCreateComment } from '@/hooks/community/mutations';
import type { ReplyTarget } from './CommentSection';

interface CommentInputProps {
  postId: string;
  replyingTo: ReplyTarget | null;
  onCancelReply: () => void;
  onCreated: () => void;
}

export default function CommentInput({
  postId,
  replyingTo,
  onCancelReply,
  onCreated,
}: CommentInputProps) {
  const [content, setContent] = useState('');
  const createComment = useCreateComment();

  const handleSubmit = () => {
    const trimmed = content.trim();
    if (!trimmed || createComment.isPending) return;

    createComment.mutate(
      {
        postId,
        data: {
          content: trimmed,
          parentId: replyingTo?.commentId,
        },
      },
      {
        onSuccess: () => {
          setContent('');
          onCreated();
        },
      }
    );
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="border-t border-border/30 pt-3 space-y-2">
      {/* 답글 모드 표시 */}
      {replyingTo && (
        <div className="flex items-center gap-2 px-1">
          <span className="text-xs text-primary">
            @{replyingTo.authorName}에게 답글
          </span>
          <button
            onClick={onCancelReply}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <XIcon size={14} />
          </button>
        </div>
      )}

      {/* 입력 영역 */}
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="댓글을 입력하세요..."
          maxLength={500}
          className="flex-1 rounded-full bg-muted/20 border border-border/50 px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
        />
        <button
          onClick={handleSubmit}
          disabled={!content.trim() || createComment.isPending}
          className="shrink-0 p-2.5 rounded-full text-primary disabled:opacity-30 transition-opacity"
        >
          <PaperPlaneRightIcon size={20} weight="fill" />
        </button>
      </div>
    </div>
  );
}
