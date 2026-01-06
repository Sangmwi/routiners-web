'use client';

import { useState } from 'react';
import Button from '@/components/ui/Button';
import { Check, X, Loader2 } from 'lucide-react';
import { conversationApi } from '@/lib/api/conversation';
import { routineEventApi } from '@/lib/api/routineEvent';

interface ChatActionButtonsProps {
  /** 대화 ID */
  conversationId: string;
  /** 적용하기 성공 시 콜백 */
  onApplySuccess?: () => void;
  /** 버리기 성공 시 콜백 */
  onAbandonSuccess?: () => void;
  /** 에러 발생 시 콜백 */
  onError?: (error: string) => void;
}

/**
 * 채팅 완료 시 표시되는 액션 버튼
 *
 * - 적용하기: 생성된 루틴을 실제로 적용
 * - 버리기: 대화 포기 처리
 */
export default function ChatActionButtons({
  conversationId,
  onApplySuccess,
  onAbandonSuccess,
  onError,
}: ChatActionButtonsProps) {
  const [isApplying, setIsApplying] = useState(false);
  const [isAbandoning, setIsAbandoning] = useState(false);

  const handleApply = async () => {
    try {
      setIsApplying(true);
      await conversationApi.completeAIConversation(conversationId);
      onApplySuccess?.();
    } catch (err) {
      console.error('Failed to apply routine:', err);
      onError?.('루틴 적용에 실패했습니다.');
    } finally {
      setIsApplying(false);
    }
  };

  const handleAbandon = async () => {
    try {
      setIsAbandoning(true);
      // 1. 저장된 루틴 삭제 (conversation ID = ai_session_id)
      await routineEventApi.deleteEventsBySession(conversationId);
      // 2. 대화 포기 처리
      await conversationApi.abandonAIConversation(conversationId);
      onAbandonSuccess?.();
    } catch (err) {
      console.error('Failed to abandon conversation:', err);
      onError?.('대화 취소에 실패했습니다.');
    } finally {
      setIsAbandoning(false);
    }
  };

  const isLoading = isApplying || isAbandoning;

  return (
    <div className="flex gap-3 p-4 border-t border-border bg-card">
      <Button
        variant="outline"
        onClick={handleAbandon}
        disabled={isLoading}
        className="flex-1"
      >
        {isAbandoning ? (
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
        ) : (
          <X className="w-4 h-4 mr-2" />
        )}
        버리기
      </Button>
      <Button
        variant="primary"
        onClick={handleApply}
        disabled={isLoading}
        className="flex-1"
      >
        {isApplying ? (
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
        ) : (
          <Check className="w-4 h-4 mr-2" />
        )}
        적용하기
      </Button>
    </div>
  );
}
