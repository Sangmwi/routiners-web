'use client';

import { useState, useCallback } from 'react';
import Modal from '@/components/ui/Modal';
import CommentSection from './comments/CommentSection';
import CommentInput from './comments/CommentInput';
import type { ReplyTarget } from './comments/CommentSection';

interface CommentDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  postId: string;
}

export default function CommentDrawer({
  isOpen,
  onClose,
  postId,
}: CommentDrawerProps) {
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

  const [shouldFocus, setShouldFocus] = useState(false);

  const handleOpened = useCallback(() => {
    setShouldFocus(true);
  }, []);

  // 드로어 닫힐 때 포커스 상태 초기화
  const handleClose = useCallback(() => {
    setShouldFocus(false);
    setReplyingTo(null);
    onClose();
  }, [onClose]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="댓글"
      position="bottom"
      enableSwipe
      height="full"
      showCloseButton={false}
      onOpened={handleOpened}
      stickyFooter={
        <CommentInput
          postId={postId}
          replyingTo={replyingTo}
          onCancelReply={handleCancelReply}
          onCreated={handleCommentCreated}
          autoFocus={shouldFocus}
        />
      }
    >
      <div className="p-4">
        <CommentSection
          postId={postId}
          onReply={handleReply}
        />
      </div>
    </Modal>
  );
}
