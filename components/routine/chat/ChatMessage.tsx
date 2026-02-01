'use client';

import { ChatMessage as ChatMessageType } from '@/lib/types/chat';
import type {
  ProfileConfirmationRequest,
  ProfileConfirmationStatus,
  RoutinePreviewStatus,
  InputRequestStatus,
} from '@/lib/types/chat';
import type { InputRequest, RoutinePreviewData } from '@/lib/types/fitness';
import { RobotIcon } from '@phosphor-icons/react';
import { Markdown } from '@/components/common/Markdown';
import { ChatProfileConfirmation } from './ChatProfileConfirmation';
import ChatInputRequest from './ChatInputRequest';
import ChatPreviewSummary from './ChatPreviewSummary';

/**
 * 메시지 액션 콜백 타입
 */
export type MessageActionType =
  | 'confirm'      // 프로필 확인
  | 'edit'         // 프로필 수정
  | 'apply'        // 루틴 적용
  | 'cancel'       // 취소
  | 'viewDetails'  // 상세 보기
  | 'submitInput'; // 입력 제출

interface ChatMessageProps {
  message: ChatMessageType;
  /** 트랜지언트 UI 액션 핸들러 */
  onAction?: (action: MessageActionType, messageId: string, value?: string | string[]) => void;
  /** 루틴 적용 중 상태 (외부 제어용) */
  isApplyingRoutine?: boolean;
}

/**
 * 개별 채팅 메시지 컴포넌트
 *
 * Phase 9: content_type별 트랜지언트 UI 렌더링 지원
 * - profile_confirmation: 프로필 확인 카드
 * - routine_preview: 루틴 미리보기 카드
 * - input_request: 선택형 입력 UI
 */
export default function ChatMessage({ message, onAction, isApplyingRoutine = false }: ChatMessageProps) {
  const isAssistant = message.role === 'assistant';
  const contentType = message.contentType;

  // 시스템 로그는 중앙 정렬, muted 스타일
  if (contentType === 'system_log') {
    return (
      <div className="flex justify-center py-2">
        <div className="px-4 py-2.5 bg-muted/30 rounded-2xl max-w-[85%]">
          <Markdown
            content={message.content}
            className="text-sm text-muted-foreground text-center"
          />
        </div>
      </div>
    );
  }

  // 프로필 확인 카드
  if (contentType === 'profile_confirmation') {
    try {
      if (!message.content || message.content.trim() === '') {
        console.error('[ChatMessage] profile_confirmation message has empty content');
        return null;
      }
      
      const profileData = JSON.parse(message.content) as ProfileConfirmationRequest;
      const status = (message.metadata?.status as ProfileConfirmationStatus) || 'pending';
      
      return (
        <ChatProfileConfirmation
          request={profileData}
          status={status}
          onConfirm={() => onAction?.('confirm', message.id)}
          onEdit={() => onAction?.('edit', message.id)}
          disabled={status !== 'pending'}
        />
      );
    } catch (error) {
      console.error('[ChatMessage] Failed to parse profile_confirmation:', error, {
        messageId: message.id,
        content: message.content?.slice(0, 100),
      });
      // 파싱 실패 시 기본 텍스트 메시지로 fallback
      return (
        <div className="flex gap-3">
          <div className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-primary text-primary-foreground">
            <RobotIcon size={16} weight="fill" />
          </div>
          <div className="max-w-[80%] px-4 py-3 mt-1 rounded-2xl bg-muted/40 rounded-tl-none">
            <p className="text-sm text-muted-foreground">
              프로필 확인 데이터를 불러올 수 없습니다.
            </p>
          </div>
        </div>
      );
    }
  }

  // 루틴 미리보기 카드
  if (contentType === 'routine_preview') {
    const previewData = JSON.parse(message.content) as RoutinePreviewData;
    const status = (message.metadata?.status as RoutinePreviewStatus) || 'pending';

    // previewData에서 주차별 요약 생성
    const weekSummaries = (previewData.weeks || []).map((week) => {
      const dayLabels = (week.days || []).map((d) => d.title || `${d.dayOfWeek}요일`).join(', ');
      return dayLabels || `${week.weekNumber}주차`;
    });

    return (
      <ChatPreviewSummary
        type="routine"
        title={previewData.title || '운동 루틴'}
        description={previewData.description || ''}
        stats={{
          duration: `${previewData.weeks?.length || 0}주`,
          frequency: `주 ${previewData.weeks?.[0]?.days?.length || 0}회`,
          perSession: previewData.weeks?.[0]?.days?.[0]?.exercises
            ? `${previewData.weeks[0].days[0].exercises.length}개 운동`
            : undefined,
        }}
        weekSummaries={weekSummaries}
        hasConflicts={Boolean(previewData.conflicts?.length)}
        status={status}
        onViewDetails={() => onAction?.('viewDetails', message.id)}
        onCancel={() => onAction?.('cancel', message.id)}
        onApply={(forceOverwrite) => onAction?.('apply', message.id, forceOverwrite ? 'force' : undefined)}
        isApplying={isApplyingRoutine}
      />
    );
  }

  // 입력 요청 카드
  if (contentType === 'input_request') {
    const inputData = JSON.parse(message.content) as InputRequest;
    const status = (message.metadata?.status as InputRequestStatus) || 'pending';
    return (
      <ChatInputRequest
        request={inputData}
        status={status}
        onSubmit={(value) => onAction?.('submitInput', message.id, value)}
      />
    );
  }

  // 기본 텍스트 메시지
  return (
    <div
      className={`flex gap-3 ${isAssistant ? 'flex-row' : 'flex-row-reverse'}`}
    >
      {/* 아바타 */}
      {isAssistant && (
        <div className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-primary text-primary-foreground">
          <RobotIcon size={16} weight="fill" />
        </div>
      )}

      {/* 메시지 버블 */}
      <div
        className={`max-w-[80%] px-4 py-3 mt-1 rounded-2xl wrap-break-word overflow-hidden ${
          isAssistant
            ? 'bg-muted/40 rounded-tl-none'
            : 'bg-primary text-primary-foreground rounded-tr-none'
        }`}
      >
        {isAssistant ? (
          <Markdown content={message.content} />
        ) : (
          <p className="text-sm whitespace-pre-wrap leading-relaxed">
            {message.content}
          </p>
        )}
      </div>
    </div>
  );
}
