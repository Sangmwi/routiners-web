'use client';

import { useState, useRef, useEffect } from 'react';
import { ChevronDown, CheckCircle, MessageCircle, Dumbbell, Utensils, Loader2 } from 'lucide-react';
import { useAISessions } from '@/hooks/aiChat';
import type { Conversation, ConversationStatus } from '@/lib/types/chat';

interface ChatHistoryDropdownProps {
  /** 현재 선택된 세션 ID */
  currentSessionId?: string;
  /** 세션 선택 콜백 */
  onSelectSession: (sessionId: string) => void;
}

/**
 * 대화 목록 드롭다운
 *
 * - 모든 AI 채팅 세션 목록 표시 (활성 + 완료)
 * - 세션 선택 시 해당 대화 로드
 */
export default function ChatHistoryDropdown({
  currentSessionId,
  onSelectSession,
}: ChatHistoryDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // 모든 AI 세션 조회 (활성 + 완료, 최근 15개)
  const { data: sessions, isLoading } = useAISessions(
    { limit: 15 },
    { enabled: isOpen }
  );

  // 외부 클릭 시 닫기
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // ESC 키로 닫기
  useEffect(() => {
    function handleEsc(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEsc);
    }

    return () => {
      document.removeEventListener('keydown', handleEsc);
    };
  }, [isOpen]);

  // 세션 선택 핸들러
  const handleSelect = (sessionId: string) => {
    onSelectSession(sessionId);
    setIsOpen(false);
  };

  // 현재 세션 찾기 + 활성/완료 분리 (현재 세션 포함)
  const currentSession = sessions?.find((s) => s.id === currentSessionId);
  const otherActiveSessions = sessions?.filter((s) => s.id !== currentSessionId && s.aiStatus === 'active') || [];
  const completedSessions = sessions?.filter((s) => s.aiStatus === 'completed') || [];
  const hasAnySessions = currentSession || otherActiveSessions.length > 0 || completedSessions.length > 0;

  return (
    <div className="relative" ref={dropdownRef}>
      {/* 드롭다운 트리거 */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1 px-2 py-1.5 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-lg transition-colors"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        <MessageCircle className="w-4 h-4" />
        <span className="hidden sm:inline">대화 목록</span>
        <ChevronDown
          className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {/* 드롭다운 메뉴 */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-1 w-72 bg-card border border-border rounded-xl shadow-lg z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
          {/* 헤더 */}
          <div className="px-3 py-2 border-b border-border bg-muted/30">
            <span className="text-xs font-medium text-muted-foreground">대화 목록</span>
          </div>

          {/* 세션 목록 */}
          <div className="max-h-72 overflow-y-auto">
            {isLoading ? (
              <div className="p-4 text-center text-sm text-muted-foreground flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                불러오는 중...
              </div>
            ) : !hasAnySessions ? (
              <div className="p-4 text-center text-sm text-muted-foreground">
                대화 내역이 없습니다
              </div>
            ) : (
              <ul role="listbox">
                {/* 현재 대화 섹션 (현재 세션 하이라이트) */}
                {currentSession && (
                  <>
                    <li className="px-3 py-1.5 text-xs font-medium text-primary bg-primary/5">
                      현재 대화
                    </li>
                    <SessionItem
                      key={currentSession.id}
                      session={currentSession}
                      isSelected={true}
                      onSelect={() => handleSelect(currentSession.id)}
                    />
                  </>
                )}

                {/* 다른 진행 중인 대화 (현재 세션 제외) */}
                {otherActiveSessions.length > 0 && (
                  <>
                    <li className="px-3 py-1.5 text-xs font-medium text-primary bg-primary/5">
                      진행 중인 대화
                    </li>
                    {otherActiveSessions.map((session) => (
                      <SessionItem
                        key={session.id}
                        session={session}
                        isSelected={false}
                        onSelect={() => handleSelect(session.id)}
                      />
                    ))}
                  </>
                )}

                {/* 완료된 세션 섹션 */}
                {completedSessions.length > 0 && (
                  <>
                    <li className="px-3 py-1.5 text-xs font-medium text-muted-foreground bg-muted/30">
                      이전 대화
                    </li>
                    {completedSessions.map((session) => (
                      <SessionItem
                        key={session.id}
                        session={session}
                        isSelected={session.id === currentSessionId}
                        onSelect={() => handleSelect(session.id)}
                      />
                    ))}
                  </>
                )}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// SessionItem 컴포넌트
// ============================================================================

interface SessionItemProps {
  session: Conversation;
  isSelected: boolean;
  onSelect: () => void;
}

function SessionItem({ session, isSelected, onSelect }: SessionItemProps) {
  const status = session.aiStatus;
  const purpose = session.aiPurpose;

  // 날짜 포맷 (MM/DD)
  const dateStr = formatDate(session.createdAt);

  // 상태 아이콘 및 텍스트
  const statusInfo = getStatusInfo(status);

  // 목적 아이콘
  const PurposeIcon = purpose === 'meal' ? Utensils : Dumbbell;
  const purposeLabel = purpose === 'meal' ? '식단 관리' : '운동 루틴';
  const purposeColor = purpose === 'meal' ? 'text-meal' : 'text-workout';

  return (
    <li>
      <button
        onClick={onSelect}
        disabled={isSelected}
        className={`w-full px-3 py-2.5 flex items-center gap-3 hover:bg-muted/50 transition-colors disabled:opacity-50 disabled:cursor-default ${
          isSelected ? 'bg-muted/30' : ''
        }`}
        role="option"
        aria-selected={isSelected}
      >
        {/* 목적 아이콘 */}
        <div
          className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
            purpose === 'meal' ? 'bg-meal/10' : 'bg-workout/10'
          }`}
        >
          <PurposeIcon className={`w-4 h-4 ${purposeColor}`} />
        </div>

        {/* 세션 정보 */}
        <div className="flex-1 min-w-0 text-left">
          <div className="flex items-center gap-2">
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
    </li>
  );
}

// ============================================================================
// 유틸리티 함수
// ============================================================================

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${month}/${day}`;
}

function getStatusInfo(status?: ConversationStatus): {
  icon: React.ReactNode;
  label: string;
  color: string;
} | null {
  switch (status) {
    case 'active':
      return {
        icon: <Loader2 className="w-3 h-3 animate-spin" />,
        label: '진행 중',
        color: 'text-primary',
      };
    case 'completed':
      return {
        icon: <CheckCircle className="w-3 h-3" />,
        label: '완료',
        color: 'text-success',
      };
    default:
      return null;
  }
}
