'use client';

import { useRouter } from 'next/navigation';
import { PencilSimpleIcon, TrashIcon, WarningIcon } from '@phosphor-icons/react';
import Modal, { ModalBody } from '@/components/ui/Modal';
import { useDeletePost } from '@/hooks/community/mutations';
import { useConfirmDialog } from '@/lib/stores/modalStore';

interface PostMoreMenuProps {
  isOpen: boolean;
  onClose: () => void;
  postId: string;
  isOwner: boolean;
  onDeleted: () => void;
}

export default function PostMoreMenu({
  isOpen,
  onClose,
  postId,
  isOwner,
  onDeleted,
}: PostMoreMenuProps) {
  const router = useRouter();
  const deletePost = useDeletePost();
  const confirm = useConfirmDialog();

  const handleEdit = () => {
    onClose();
    router.push(`/community/write?postId=${postId}`);
  };

  const handleDelete = () => {
    onClose();
    confirm({
      title: '게시글 삭제',
      message: '이 게시글을 삭제하시겠습니까? 삭제된 글은 복구할 수 없어요.',
      confirmText: '삭제',
      cancelText: '취소',
      variant: 'danger',
      onConfirm: async () => {
        await deletePost.mutateAsync(postId);
        onDeleted();
      },
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      position="bottom"
      enableSwipe
    >
      <ModalBody className="p-2 pb-6">
        <div className="space-y-1">
          {isOwner ? (
            <>
              <button
                onClick={handleEdit}
                className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-left hover:bg-muted/30 transition-colors"
              >
                <PencilSimpleIcon size={20} className="text-muted-foreground" />
                <span className="text-sm font-medium text-foreground">수정</span>
              </button>
              <button
                onClick={handleDelete}
                className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-left hover:bg-muted/30 transition-colors"
              >
                <TrashIcon size={20} className="text-destructive" />
                <span className="text-sm font-medium text-destructive">삭제</span>
              </button>
            </>
          ) : (
            <button
              onClick={onClose}
              className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-left hover:bg-muted/30 transition-colors opacity-50 cursor-not-allowed"
              disabled
            >
              <WarningIcon size={20} className="text-muted-foreground" />
              <span className="text-sm text-muted-foreground">신고 (준비 중)</span>
            </button>
          )}
        </div>
      </ModalBody>
    </Modal>
  );
}
