'use client';

import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import PageHeader from '@/components/common/PageHeader';
import { ChatMessageList, ChatInput, ChatActionButtons } from '@/components/routine/chat';
import {
  useActiveAISession,
  useCreateAISession,
  useAIChat,
} from '@/hooks/aiChat';
import { queryKeys } from '@/lib/constants/queryKeys';
import { Loader2, CheckCircle, XCircle, RotateCcw } from 'lucide-react';
import Button from '@/components/ui/Button';
import { conversationApi } from '@/lib/api/conversation';
import { routineEventApi } from '@/lib/api/routineEvent';
import { useConfirmDialog } from '@/lib/stores/modalStore';

/**
 * AI 트레이너 채팅 페이지
 */
export default function AIChatPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [actionError, setActionError] = useState<string | null>(null);
  const confirmDialog = useConfirmDialog();

  // 활성 세션 조회
  const {
    data: activeSession,
    isLoading: isLoadingSession,
    error: sessionError,
  } = useActiveAISession('workout');

  // 세션 생성
  const createSession = useCreateAISession();

  // 채팅 훅 (세션 객체 전체를 전달하여 캐시 동기화 문제 해결)
  const {
    messages,
    sendMessage,
    isStreaming,
    streamingContent,
    activeTools,
    error: chatError,
  } = useAIChat(activeSession);

  // 대화 상태 확인
  const isCompleted = activeSession?.status === 'completed';
  const isAbandoned = activeSession?.status === 'abandoned';
  const isActive = activeSession?.status === 'active';

  // 새 대화 시작 실행
  const executeStartNewSession = useCallback(async () => {
    // 기존 활성 세션이 있으면 정리
    if (isActive && activeSession) {
      // 기존 루틴이 저장되어 있으면 삭제
      if (activeSession.resultApplied) {
        try {
          await routineEventApi.deleteEventsBySession(activeSession.id);
        } catch (err) {
          console.error('Failed to delete existing routine:', err);
        }
      }

      // 기존 대화 포기 처리
      try {
        await conversationApi.abandonAIConversation(activeSession.id);
      } catch (err) {
        console.error('Failed to abandon session:', err);
      }
    }

    try {
      await createSession.mutateAsync({ purpose: 'workout' });
    } catch (err) {
      console.error('Failed to create session:', err);
    }
  }, [createSession, isActive, activeSession]);

  // 새 세션 생성 (기존 활성 세션이 있으면 확인 후 포기)
  const handleStartNewSession = useCallback(() => {
    // 활성 대화 중이면 확인 모달 표시
    if (isActive && messages.length > 0) {
      confirmDialog({
        title: '새 대화 시작',
        message: '현재 대화를 종료하고 새 대화를 시작할까요?',
        confirmText: '시작하기',
        cancelText: '취소',
        onConfirm: executeStartNewSession,
      });
      return;
    }

    // 활성 대화가 없으면 바로 시작
    executeStartNewSession();
  }, [isActive, messages.length, confirmDialog, executeStartNewSession]);

  // 메시지 전송
  const handleSendMessage = useCallback(
    (message: string) => {
      if (activeSession?.id && isActive) {
        sendMessage(message);
      }
    },
    [activeSession?.id, sendMessage, isActive]
  );

  // 적용하기 성공
  const handleApplySuccess = useCallback(() => {
    queryClient.invalidateQueries({
      queryKey: queryKeys.aiSession.active('workout'),
    });
    router.push('/routine');
  }, [queryClient, router]);

  // 버리기 성공
  const handleAbandonSuccess = useCallback(() => {
    queryClient.invalidateQueries({
      queryKey: queryKeys.aiSession.active('workout'),
    });
  }, [queryClient]);

  // 로딩 상태
  if (isLoadingSession) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // 세션 에러
  if (sessionError) {
    return (
      <div className="min-h-screen bg-background">
        <PageHeader title="AI 트레이너" />
        <div className="flex flex-col items-center justify-center gap-4 p-8">
          <p className="text-muted-foreground text-center">
            세션을 불러오는데 실패했습니다.
          </p>
          <Button onClick={() => router.refresh()}>다시 시도</Button>
        </div>
      </div>
    );
  }

  // 활성 세션이 없는 경우
  if (!activeSession) {
    return (
      <div className="min-h-screen bg-background">
        <PageHeader title="AI 트레이너" />
        <div className="flex flex-col items-center justify-center gap-6 p-8 mt-20">
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
            <span className="text-4xl">🏋️</span>
          </div>
          <div className="text-center space-y-2">
            <h2 className="text-xl font-bold text-foreground">
              AI 트레이너와 대화하기
            </h2>
            <p className="text-muted-foreground text-sm">
              운동 목표, 체력 수준, 가용 시간을 알려주시면
              <br />
              맞춤형 4주 운동 루틴을 만들어 드립니다.
            </p>
          </div>
          <Button
            onClick={handleStartNewSession}
            isLoading={createSession.isPending}
            size="lg"
          >
            대화 시작하기
          </Button>
        </div>
      </div>
    );
  }

  // 헤더 우측 액션 버튼 (세션이 있으면 항상 표시)
  const headerAction = (
    <button
      onClick={handleStartNewSession}
      disabled={createSession.isPending || isStreaming}
      className="p-2 hover:bg-muted/50 rounded-lg transition-colors text-primary disabled:opacity-50"
      aria-label="새 대화 시작"
    >
      {createSession.isPending ? (
        <Loader2 className="w-5 h-5 animate-spin" />
      ) : (
        <RotateCcw className="w-5 h-5" />
      )}
    </button>
  );

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <PageHeader
        title="AI 트레이너"
        onBack={() => router.push('/routine')}
        action={headerAction}
      />

      {/* 완료/포기 상태 배너 */}
      {isCompleted && (
        <div className="px-4 py-3 bg-green-500/10 border-b border-green-500/20 flex items-center gap-2 text-green-600">
          <CheckCircle className="w-5 h-5" />
          <span className="text-sm font-medium">루틴이 적용되었습니다</span>
        </div>
      )}
      {isAbandoned && (
        <div className="px-4 py-3 bg-muted border-b border-border flex items-center gap-2 text-muted-foreground">
          <XCircle className="w-5 h-5" />
          <span className="text-sm font-medium">대화가 취소되었습니다</span>
        </div>
      )}

      {/* 채팅 메시지 목록 */}
      <ChatMessageList
        messages={messages}
        isLoading={isStreaming && !streamingContent}
        streamingContent={streamingContent}
        activeTools={activeTools}
      />

      {/* 에러 메시지 */}
      {(chatError || actionError) && (
        <div className="px-4 py-2 bg-destructive/10 text-destructive text-sm text-center">
          {chatError || actionError}
        </div>
      )}

      {/* 활성 대화 - 입력 영역 */}
      {isActive && (
        <ChatInput
          onSend={handleSendMessage}
          disabled={isStreaming}
          placeholder="운동 목표를 알려주세요..."
        />
      )}

      {/* 활성 대화 + 루틴 준비됨 - 액션 버튼 */}
      {isActive && activeSession.resultApplied && !isStreaming && (
        <ChatActionButtons
          conversationId={activeSession.id}
          onApplySuccess={handleApplySuccess}
          onAbandonSuccess={handleAbandonSuccess}
          onError={setActionError}
        />
      )}

    </div>
  );
}
