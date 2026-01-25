'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAISessionWithMessages, useAISessions } from './useAISession';
import { useDeleteAISession, useResetAISession } from './useAISession';
import { useAIChat } from './useAIChat';
import { useChatPageHandlers } from './useChatPageHandlers';
import { useWebViewCore } from '@/hooks';
import { useConfirmDialog } from '@/lib/stores/modalStore';
import { useShowError } from '@/lib/stores/errorStore';

// =============================================================================
// Types
// =============================================================================

export interface ChatPageState {
  /** 로딩 중 여부 (세션 로딩, 삭제/초기화 중) */
  isLoading: boolean;
  /** 에러 발생 여부 */
  hasError: boolean;
  /** 세션이 비어있는지 여부 */
  isEmpty: boolean;
  /** 대화 완료 상태 */
  isCompleted: boolean;
  /** 대화 활성 상태 */
  isActive: boolean;
}

export interface UseChatPageReturn {
  /** 세션 데이터 */
  session: ReturnType<typeof useAISessionWithMessages>['data'];
  /** 세션 에러 */
  sessionError: ReturnType<typeof useAISessionWithMessages>['error'];
  /** 채팅 훅 반환값 */
  chat: ReturnType<typeof useAIChat>;
  /** 핸들러 함수들 */
  handlers: ReturnType<typeof useChatPageHandlers>;
  /** 페이지 상태 */
  pageState: ChatPageState;
  /** WebView 환경 여부 */
  isInWebView: boolean;
}

// =============================================================================
// Hook
// =============================================================================

/**
 * 채팅 페이지 통합 훅
 *
 * 페이지의 모든 데이터와 로직을 관리:
 * - 세션 조회 및 상태 관리
 * - 삭제/초기화 뮤테이션
 * - 채팅 기능 (메시지, 미리보기 등)
 * - 이벤트 핸들러
 *
 * @param sessionId - URL에서 가져온 세션 ID
 * @param onOpenPreviewDrawer - 미리보기 드로어 열기 콜백
 */
export function useChatPage(
  sessionId: string | null,
  onOpenPreviewDrawer?: (type: 'routine' | 'meal') => void
): UseChatPageReturn {
  const router = useRouter();
  const { isInWebView } = useWebViewCore();
  const confirmDialog = useConfirmDialog();
  const showError = useShowError();

  // 루틴/식단 적용 완료 상태 추적 (적용 후 리다이렉트 방지)
  const hasAppliedRef = useRef(false);

  // ---------------------------------------------------------------------------
  // 세션 데이터
  // ---------------------------------------------------------------------------

  const {
    data: session,
    isPending: isLoadingSession,
    error: sessionError,
  } = useAISessionWithMessages(sessionId ?? undefined, {
    enabled: !!sessionId,
  });

  // 스마트 네비게이션을 위한 세션 목록 (삭제 후 이동할 세션 찾기)
  const { data: allSessions } = useAISessions({ limit: 15 });

  // ---------------------------------------------------------------------------
  // Mutations
  // ---------------------------------------------------------------------------

  const deleteSession = useDeleteAISession();
  const resetSession = useResetAISession();

  // ---------------------------------------------------------------------------
  // 리다이렉트 처리
  // ---------------------------------------------------------------------------

  useEffect(() => {
    if (!sessionId) {
      if (isInWebView) {
        window.location.replace('/routine');
      } else {
        router.replace('/routine');
      }
    }
  }, [sessionId, router, isInWebView]);

  // ---------------------------------------------------------------------------
  // 채팅 훅
  // ---------------------------------------------------------------------------

  const chat = useAIChat(session);

  // 루틴/식단 적용 성공 시 ref 설정
  useEffect(() => {
    if (chat.appliedRoutine || chat.appliedMealPlan) {
      hasAppliedRef.current = true;
    }
  }, [chat.appliedRoutine, chat.appliedMealPlan]);

  // ---------------------------------------------------------------------------
  // 페이지 상태 계산
  // ---------------------------------------------------------------------------

  const isActive = session?.status === 'active';
  const isCompleted = session?.status === 'completed';

  const pageState: ChatPageState = {
    isLoading: !sessionId || isLoadingSession || deleteSession.isPending || resetSession.isPending,
    hasError: !!sessionError,
    isEmpty: !session,
    isCompleted,
    isActive,
  };

  // ---------------------------------------------------------------------------
  // 핸들러
  // ---------------------------------------------------------------------------

  // 현재 세션 제외한 다른 활성 세션 (삭제 후 이동 대상)
  const otherActiveSessions = allSessions?.filter(
    (s) => s.id !== sessionId && s.aiStatus === 'active'
  );

  const handlers = useChatPageHandlers({
    session,
    isActive,
    isInWebView,
    deleteSession,
    resetSession,
    confirmDialog,
    showError,
    sendMessage: chat.sendMessage,
    onOpenPreviewDrawer,
    otherActiveSessions,
  });

  // ---------------------------------------------------------------------------
  // Return
  // ---------------------------------------------------------------------------

  return {
    session,
    sessionError,
    chat,
    handlers,
    pageState,
    isInWebView,
  };
}
