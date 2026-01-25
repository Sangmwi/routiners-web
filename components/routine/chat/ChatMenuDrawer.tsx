'use client';

import { ArrowCounterClockwiseIcon } from '@phosphor-icons/react';
import { DeleteIcon, SuccessIcon, LoadingSpinner } from '@/components/ui/icons';
import { EventIcons } from '@/lib/config/theme';
import Modal, { ModalBody } from '@/components/ui/Modal';
import { useAISessions } from '@/hooks/aiChat';
import type { Conversation, ConversationStatus } from '@/lib/types/chat';
import type { SessionPurpose } from '@/lib/types/routine';

interface ChatMenuDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  currentSessionId: string;
  sessionStatus: ConversationStatus;
  sessionPurpose: SessionPurpose;
  onSelectSession: (sessionId: string) => void;
  onResetChat: () => void;
  onDeleteChat: () => void;
  isStreaming: boolean;
}

/**
 * 채팅 메뉴 드로어 (바텀시트)
 *
 * - 대화 목록 (현재, 진행중, 완료)
 * - 액션 버튼 (초기화 / 삭제)
 */
export default function ChatMenuDrawer({
  isOpen,
  onClose,
  currentSessionId,
  sessionStatus,
  sessionPurpose,
  onSelectSession,
  onResetChat,
  onDeleteChat,
  isStreaming,
}: ChatMenuDrawerProps) {
  // 모든 AI 세션 조회 (활성 + 완료, 최근 15개)
  const { data: sessions, isPending: isLoading } = useAISessions(
    { limit: 15 },
    { enabled: isOpen }
  );

  const isActive = sessionStatus === 'active';
  const isCompleted = sessionStatus === 'completed';

  // 세션 선택 핸들러
  const handleSelect = (sessionId: string) => {
    if (sessionId === currentSessionId) return;
    onSelectSession(sessionId);
    onClose();
  };

  // 초기화 버튼 클릭
  const handleReset = () => {
    onClose();
    onResetChat();
  };

  // 삭제 버튼 클릭
  const handleDelete = () => {
    onClose();
    onDeleteChat();
  };

  // 현재 세션 + 다른 세션들 분리
  const currentSession = sessions?.find((s) => s.id === currentSessionId);
  const otherActiveSessions = sessions?.filter((s) => s.id !== currentSessionId && s.aiStatus === 'active') || [];
  const completedSessions = sessions?.filter((s) => s.aiStatus === 'completed') || [];
  const hasAnySessions = currentSession || otherActiveSessions.length > 0 || completedSessions.length > 0;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      position="bottom"
      enableSwipe
      showCloseButton={false}
      size="lg"
    >
      <ModalBody className="pb-8">
        {/* 타이틀 */}
        <div className="text-center mb-4">
          <h2 className="text-lg font-bold text-foreground">채팅 메뉴</h2>
        </div>

        {/* 대화 목록 */}
        <div className="mb-4">
          <h3 className="text-xs font-medium text-muted-foreground mb-2 px-1">
            대화 목록
          </h3>
          <div className="bg-muted/30 rounded-xl overflow-hidden max-h-64 overflow-y-auto">
            {isLoading ? (
              <div className="p-4 text-center text-sm text-muted-foreground flex items-center justify-center gap-2">
                <LoadingSpinner size="sm" />
                불러오는 중...
              </div>
            ) : !hasAnySessions ? (
              <div className="p-4 text-center text-sm text-muted-foreground">
                대화 내역이 없습니다
              </div>
            ) : (
              <div>
                {/* 현재 대화 */}
                {currentSession && (
                  <SessionItem
                    session={currentSession}
                    isCurrent={true}
                    onSelect={() => {}}
                  />
                )}

                {/* 다른 진행 중인 대화 */}
                {otherActiveSessions.length > 0 && (
                  <>
                    <div className="px-3 py-1.5 text-xs font-medium text-primary bg-primary/5 border-t border-border/50">
                      진행 중인 대화
                    </div>
                    {otherActiveSessions.map((session) => (
                      <SessionItem
                        key={session.id}
                        session={session}
                        isCurrent={false}
                        onSelect={() => handleSelect(session.id)}
                      />
                    ))}
                  </>
                )}

                {/* 완료된 대화 */}
                {completedSessions.length > 0 && (
                  <>
                    <div className="px-3 py-1.5 text-xs font-medium text-muted-foreground bg-muted/50 border-t border-border/50">
                      이전 대화
                    </div>
                    {completedSessions.map((session) => (
                      <SessionItem
                        key={session.id}
                        session={session}
                        isCurrent={session.id === currentSessionId}
                        onSelect={() => handleSelect(session.id)}
                      />
                    ))}
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {/* 구분선 */}
        <div className="border-t border-border my-4" />

        {/* 액션 버튼 */}
        <div className="space-y-2">
          {/* 진행 중인 세션: 초기화 버튼 */}
          {isActive && (
            <button
              onClick={handleReset}
              disabled={isStreaming}
              className="w-full flex items-center gap-3 p-4 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                <ArrowCounterClockwiseIcon size={20} className="text-foreground" />
              </div>
              <div className="text-left">
                <p className="font-medium text-foreground">대화 초기화</p>
                <p className="text-xs text-muted-foreground">
                  현재 대화를 종료하고 처음부터 다시 시작
                </p>
              </div>
            </button>
          )}

          {/* 완료된 세션: 삭제 버튼 */}
          {isCompleted && (
            <button
              onClick={handleDelete}
              className="w-full flex items-center gap-3 p-4 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors"
            >
              <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                <DeleteIcon size="md" className="text-muted-foreground" />
              </div>
              <div className="text-left">
                <p className="font-medium text-foreground">대화 삭제</p>
                <p className="text-xs text-muted-foreground">
                  이 대화를 영구적으로 삭제
                </p>
              </div>
            </button>
          )}
        </div>
      </ModalBody>
    </Modal>
  );
}

// ============================================================================
// SessionItem 컴포넌트
// ============================================================================

interface SessionItemProps {
  session: Conversation;
  isCurrent: boolean;
  onSelect: () => void;
}

function SessionItem({ session, isCurrent, onSelect }: SessionItemProps) {
  const status = session.aiStatus;
  const purpose = session.aiPurpose;

  // 날짜 포맷 (MM/DD)
  const date = new Date(session.createdAt);
  const dateStr = `${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getDate()).padStart(2, '0')}`;

  // 목적 아이콘
  const PurposeIcon = purpose === 'meal' ? EventIcons.Meal : EventIcons.Workout;
  const purposeLabel = purpose === 'meal' ? '식단 관리' : '운동 루틴';
  const purposeColor = purpose === 'meal' ? 'text-primary' : 'text-primary';
  const purposeBg = purpose === 'meal' ? 'bg-primary/10' : 'bg-primary/10';

  // 상태 정보
  const statusInfo = status === 'active'
    ? { icon: <LoadingSpinner size="xs" />, label: '진행 중', color: 'text-primary' }
    : status === 'completed'
    ? { icon: <SuccessIcon size="xs" />, label: '완료', color: 'text-success' }
    : null;

  return (
    <button
      onClick={onSelect}
      disabled={isCurrent}
      className={`w-full px-3 py-3 flex items-center gap-3 transition-colors border-t border-border/30 first:border-t-0 ${
        isCurrent
          ? 'bg-primary/5 cursor-default'
          : 'hover:bg-muted/50 active:bg-muted'
      }`}
    >
      {/* 목적 아이콘 */}
      <div className={`shrink-0 w-9 h-9 rounded-full flex items-center justify-center ${purposeBg}`}>
        <PurposeIcon size={16} weight="fill" className={purposeColor} />
      </div>

      {/* 세션 정보 */}
      <div className="flex-1 min-w-0 text-left">
        <div className="flex items-center gap-2">
          {isCurrent && (
            <span className="px-1.5 py-0.5 text-[10px] rounded bg-primary/10 text-primary font-medium">
              현재
            </span>
          )}
          <span className="text-sm font-medium text-foreground truncate">
            {session.title || purposeLabel}
          </span>
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-xs text-muted-foreground">{dateStr}</span>
          {statusInfo && (
            <>
              <span className="text-xs text-muted-foreground">·</span>
              <span className={`text-xs flex items-center gap-1 ${statusInfo.color}`}>
                {statusInfo.icon}
                {statusInfo.label}
              </span>
            </>
          )}
        </div>
      </div>
    </button>
  );
}
