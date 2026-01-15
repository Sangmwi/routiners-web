'use client';

import { useRouter } from 'next/navigation';
import type { AISessionCompat } from '@/lib/types/chat';
import type { useDeleteAISession, useResetAISession } from './useAISession';

// =============================================================================
// Types
// =============================================================================

interface UseChatPageHandlersParams {
  /** 현재 세션 */
  session: AISessionCompat | null | undefined;
  /** 세션 활성 상태 */
  isActive: boolean;
  /** WebView 환경 여부 */
  isInWebView: boolean;
  /** 세션 삭제 mutation */
  deleteSession: ReturnType<typeof useDeleteAISession>;
  /** 세션 초기화 mutation */
  resetSession: ReturnType<typeof useResetAISession>;
  /** 확인 다이얼로그 */
  confirmDialog: (options: {
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    variant?: 'default' | 'danger';
    loadingMessage?: string;
    onConfirm: () => void | Promise<void>;
  }) => void;
  /** 에러 표시 */
  showError: (message: string) => void;
  /** 메시지 전송 함수 */
  sendMessage: (message: string) => void;
  /** 미리보기 드로어 열기 콜백 */
  onOpenPreviewDrawer?: (type: 'routine' | 'meal') => void;
}

export interface UseChatPageHandlersReturn {
  /** 히스토리 세션 선택 */
  handleSelectHistorySession: (sessionId: string) => void;
  /** 메시지 전송 */
  handleSendMessage: (message: string) => void;
  /** 캘린더로 이동 */
  handleNavigateToCalendar: () => void;
  /** 루틴 미리보기 상세 보기 */
  handleViewRoutineDetails: () => void;
  /** 식단 미리보기 상세 보기 */
  handleViewMealDetails: () => void;
  /** 대화 삭제 */
  handleDeleteChat: () => void;
  /** 대화 초기화 */
  handleResetChat: () => void;
}

// =============================================================================
// Hook
// =============================================================================

/**
 * 채팅 페이지 핸들러 훅
 *
 * 페이지의 모든 이벤트 핸들러를 관리
 * - 네비게이션 (세션 선택, 캘린더 이동)
 * - 세션 관리 (삭제, 초기화)
 * - 메시지 전송
 * - 미리보기 드로어 열기
 */
export function useChatPageHandlers({
  session,
  isActive,
  isInWebView,
  deleteSession,
  resetSession,
  confirmDialog,
  showError,
  sendMessage,
  onOpenPreviewDrawer,
}: UseChatPageHandlersParams): UseChatPageHandlersReturn {
  const router = useRouter();

  // ---------------------------------------------------------------------------
  // 네비게이션 핸들러
  // ---------------------------------------------------------------------------

  const handleSelectHistorySession = (selectedSessionId: string) => {
    router.push(`/routine/chat?session=${selectedSessionId}`);
  };

  const handleNavigateToCalendar = () => {
    const type = session?.purpose === 'meal' ? 'meal' : 'workout';
    router.push(`/routine/calendar?type=${type}`);
  };

  // ---------------------------------------------------------------------------
  // 메시지 핸들러
  // ---------------------------------------------------------------------------

  const handleSendMessage = (message: string) => {
    if (session?.id && isActive) {
      sendMessage(message);
    }
  };

  // ---------------------------------------------------------------------------
  // 미리보기 드로어 핸들러
  // ---------------------------------------------------------------------------

  const handleViewRoutineDetails = () => {
    onOpenPreviewDrawer?.('routine');
  };

  const handleViewMealDetails = () => {
    onOpenPreviewDrawer?.('meal');
  };

  // ---------------------------------------------------------------------------
  // 세션 관리 핸들러
  // ---------------------------------------------------------------------------

  const handleDeleteChat = () => {
    if (!session?.id) return;

    confirmDialog({
      title: '대화 삭제',
      message: '이 대화를 삭제하시겠습니까? 삭제된 대화는 히스토리에서 보이지 않습니다.',
      confirmText: '삭제',
      cancelText: '취소',
      variant: 'danger',
      onConfirm: () => {
        deleteSession.mutate(session.id, {
          onSuccess: () => {
            if (isInWebView) {
              window.location.replace('/routine');
            } else {
              router.replace('/routine');
            }
          },
          onError: (err) => {
            console.error('Failed to delete chat:', err);
            showError('채팅 삭제에 실패했습니다');
          },
        });
      },
    });
  };

  const handleResetChat = () => {
    if (!session?.id || !isActive) return;

    confirmDialog({
      title: '대화 초기화',
      message: '현재 대화를 종료하고 처음부터 다시 시작할까요?',
      confirmText: '초기화',
      cancelText: '취소',
      variant: 'danger',
      loadingMessage: '대화를 초기화하는 중...',
      onConfirm: async () => {
        const newSession = await resetSession.mutateAsync({
          sessionId: session.id,
          purpose: session.purpose,
        });

        // 새 세션 URL로 히스토리 대체 (캐시 유지, 깜빡임 방지)
        const newUrl = `/routine/chat?session=${newSession.id}`;
        router.replace(newUrl);
      },
    });
  };

  // ---------------------------------------------------------------------------
  // Return
  // ---------------------------------------------------------------------------

  return {
    handleSelectHistorySession,
    handleSendMessage,
    handleNavigateToCalendar,
    handleViewRoutineDetails,
    handleViewMealDetails,
    handleDeleteChat,
    handleResetChat,
  };
}
