'use client';

import { useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import PageHeader from '@/components/common/PageHeader';
import { ChatMessageList, ChatInput } from '@/components/routine/chat';
import {
  useActiveAISession,
  useCreateAISession,
  useAIChat,
} from '@/hooks/aiChat';
import { Loader2 } from 'lucide-react';
import Button from '@/components/ui/Button';

/**
 * AI 트레이너 채팅 페이지
 */
export default function AIChatPage() {
  const router = useRouter();

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
    error: chatError,
  } = useAIChat(activeSession);

  // 활성 세션이 없으면 새 세션 생성
  const handleStartNewSession = useCallback(async () => {
    try {
      await createSession.mutateAsync({ purpose: 'workout' });
    } catch (err) {
      console.error('Failed to create session:', err);
    }
  }, [createSession]);

  // 메시지 전송
  const handleSendMessage = useCallback(
    (message: string) => {
      if (activeSession?.id) {
        sendMessage(message);
      }
    },
    [activeSession?.id, sendMessage]
  );

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

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <PageHeader
        title="AI 트레이너"
        onBack={() => router.push('/routine')}
      />

      {/* 채팅 메시지 목록 */}
      <ChatMessageList
        messages={messages}
        isLoading={isStreaming && !streamingContent}
        streamingContent={streamingContent}
      />

      {/* 에러 메시지 */}
      {chatError && (
        <div className="px-4 py-2 bg-destructive/10 text-destructive text-sm text-center">
          {chatError}
        </div>
      )}

      {/* 입력 영역 */}
      <ChatInput
        onSend={handleSendMessage}
        disabled={isStreaming}
        placeholder="운동 목표를 알려주세요..."
      />
    </div>
  );
}
