'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useDeleteCounselorConversation } from './mutations';
import { useConfirmDialog } from '@/lib/stores/modalStore';

interface UseCounselorDrawerOptions {
  /** 현재 대화 ID */
  conversationId: string | null;
  /** 새 채팅 시작 핸들러 */
  onNewChat: () => void;
}

/**
 * 상담 대화 목록 드로어 관리 훅 (SRP)
 *
 * 책임:
 * - 드로어 열림/닫힘 상태
 * - 대화 선택 (라우팅)
 * - 대화 삭제 (확인 다이얼로그 포함)
 */
export function useCounselorDrawer({ conversationId, onNewChat }: UseCounselorDrawerOptions) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const deleteConversation = useDeleteCounselorConversation();
  const confirm = useConfirmDialog();

  const open = () => setIsOpen(true);
  const close = () => setIsOpen(false);

  const selectConversation = (id: string) => {
    router.push(`/routine/counselor?id=${id}`);
  };

  const deleteWithConfirm = (id: string) => {
    confirm({
      title: '대화 삭제',
      message: '이 대화를 삭제할까요?\n삭제된 대화는 복구할 수 없어요.',
      confirmText: '삭제',
      cancelText: '취소',
      variant: 'default',
      onConfirm: async () => {
        await deleteConversation.mutateAsync(id);
        // 현재 대화 삭제 시 새 채팅 화면으로 이동
        if (id === conversationId) {
          close();
          router.push('/routine/counselor');
        }
      },
    });
  };

  return {
    isOpen,
    open,
    close,
    selectConversation,
    deleteWithConfirm,
    onNewChat,
  };
}
