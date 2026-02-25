'use client';

import { useState, useRef, useEffect } from 'react';
import { ArrowUpIcon, XIcon } from '@phosphor-icons/react';
import { useCreateComment } from '@/hooks/community/mutations';
import type { ReplyTarget } from './CommentSection';

interface CommentInputProps {
  postId: string;
  replyingTo: ReplyTarget | null;
  onCancelReply: () => void;
  onCreated: () => void;
  autoFocus?: boolean;
}

export default function CommentInput({
  postId,
  replyingTo,
  onCancelReply,
  onCreated,
  autoFocus = false,
}: CommentInputProps) {
  const [content, setContent] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const createComment = useCreateComment();

  // autoFocus: 드로어 열릴 때 인풋에 포커스 → 키보드 열림
  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus({ preventScroll: true });
    }
  }, [autoFocus]);

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

  const hasContent = content.trim().length > 0;

  return (
    <div className="border-t border-edge-faint bg-card">
      <div className="px-4 py-2.5 pb-[max(0.625rem,env(safe-area-inset-bottom))]">
        {/* 답글 모드 표시 */}
        {replyingTo && (
          <div className="flex items-center gap-2 px-1 mb-1.5">
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

        {/* 입력 영역 — 보내기 버튼이 인풋 안에 원형으로 */}
        <div className="relative flex items-center">
          <input
            ref={inputRef}
            type="text"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="댓글을 입력하세요..."
            maxLength={500}
            className="w-full rounded-full bg-surface-secondary border border-edge-subtle pl-4 pr-11 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-focus focus:border-primary"
          />
          <button
            onClick={handleSubmit}
            disabled={!hasContent || createComment.isPending}
            className={`absolute right-1.5 w-7 h-7 rounded-full flex items-center justify-center transition-all ${
              hasContent
                ? 'bg-primary text-primary-foreground'
                : 'bg-surface-hover text-hint-faint'
            }`}
          >
            <ArrowUpIcon size={14} weight="bold" />
          </button>
        </div>
      </div>
    </div>
  );
}
