'use client';

import { PlusIcon, RobotIcon, TrashSimpleIcon } from '@phosphor-icons/react';
import { LoadingSpinner } from '@/components/ui/icons';
import Modal, { ModalBody } from '@/components/ui/Modal';
import type { CoachConversationListItem, ActivePurposeType } from '@/lib/types/coach';
import { formatMessagePreview } from '@/lib/utils/formatMessagePreview';

interface ChatListDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  /** 대화 목록 */
  conversations: CoachConversationListItem[];
  /** 현재 대화 ID */
  currentId?: string | null;
  /** 대화 선택 핸들러 */
  onSelect: (id: string) => void;
  /** 새 채팅 생성 핸들러 */
  onNewChat: () => void;
  /** 대화 삭제 핸들러 */
  onDelete: (id: string) => void;
  /** 로딩 중 */
  isLoading?: boolean;
}

/**
 * 채팅 목록 드로어 (바텀시트)
 *
 * Grok 스타일 - 오른쪽 상단 버튼 또는 스와이프로 열림
 * - 새로운 대화 버튼
 * - 날짜별 그룹핑된 대화 목록
 */
export default function ChatListDrawer({
  isOpen,
  onClose,
  conversations,
  currentId,
  onSelect,
  onNewChat,
  onDelete,
  isLoading = false,
}: ChatListDrawerProps) {
  // 날짜별 그룹핑
  const groupedConversations = groupByDate(conversations);

  const handleSelect = (id: string) => {
    if (id === currentId) return;
    onSelect(id);
    onClose();
  };

  const handleNewChat = () => {
    onNewChat();
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      position="bottom"
      enableSwipe
      showCloseButton={false}
      size="lg"
      height="half"
    >
      <ModalBody className="pb-8">
        {/* 타이틀 */}
        <div className="text-center mb-4">
          <h2 className="text-lg font-bold text-foreground">대화 목록</h2>
        </div>

        {/* 새 대화 버튼 */}
        <button
          onClick={handleNewChat}
          className="w-full flex items-center gap-3 p-4 mb-4 rounded-xl bg-primary/10 hover:bg-primary/20 transition-colors"
        >
          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
            <PlusIcon size={20} weight="bold" className="text-primary" />
          </div>
          <span className="font-medium text-primary">새로운 대화</span>
        </button>

        {/* 대화 목록 */}
        <div className="bg-muted/20 rounded-xl overflow-hidden max-h-64 overflow-y-auto">
          {isLoading ? (
            <div className="p-4 text-center text-sm text-muted-foreground flex items-center justify-center gap-2">
              <LoadingSpinner size="sm" />
              불러오는 중...
            </div>
          ) : conversations.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              대화 내역이 없어요
            </div>
          ) : (
            <div>
              {Object.entries(groupedConversations).map(([dateLabel, items]) => (
                <div key={dateLabel}>
                  {/* 날짜 헤더 */}
                  <div className="px-3 py-1.5 text-xs font-medium text-muted-foreground bg-muted/50 border-t border-border/30 first:border-t-0">
                    {dateLabel}
                  </div>
                  {/* 대화 항목들 */}
                  {items.map((item) => (
                    <ConversationItem
                      key={item.conversation.id}
                      item={item}
                      isCurrent={item.conversation.id === currentId}
                      onSelect={() => handleSelect(item.conversation.id)}
                      onDelete={() => onDelete(item.conversation.id)}
                    />
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>
      </ModalBody>
    </Modal>
  );
}

// ============================================================================
// ConversationItem
// ============================================================================

interface ConversationItemProps {
  item: CoachConversationListItem;
  isCurrent: boolean;
  onSelect: () => void;
  onDelete: () => void;
}

function ConversationItem({ item, isCurrent, onSelect, onDelete }: ConversationItemProps) {
  const { conversation, hasActivePurpose, lastMessage } = item;
  const activePurposeType = conversation.metadata?.activePurpose?.type;

  // 시간 포맷 (HH:MM)
  const date = new Date(conversation.createdAt);
  const timeStr = `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;

  // 상태 정보 (활성 목적이 있을 때만 표시)
  const statusInfo = hasActivePurpose && activePurposeType
    ? { icon: <LoadingSpinner size="xs" />, label: getPurposeLabel(activePurposeType), color: 'text-primary' }
    : null;

  return (
    <div
      role="button"
      tabIndex={isCurrent ? undefined : 0}
      onClick={isCurrent ? undefined : onSelect}
      className={`relative w-full px-3 py-3 pr-10 flex items-center gap-3 transition-colors border-t border-border/30 ${
        isCurrent
          ? 'bg-primary/5 cursor-default'
          : 'hover:bg-muted/50 active:bg-muted cursor-pointer'
      }`}
    >
      {/* 아이콘 */}
      <div className="shrink-0 w-9 h-9 rounded-full flex items-center justify-center bg-primary/10">
        <RobotIcon size={16} weight="fill" className="text-primary" />
      </div>

      {/* 정보 */}
      <div className="flex-1 min-w-0 text-left">
        <div className="flex items-center gap-2">
          {isCurrent && (
            <span className="px-1.5 py-0.5 text-[10px] rounded bg-primary/10 text-primary font-medium">
              현재
            </span>
          )}
          <span className="text-sm font-medium text-foreground truncate">
            {conversation.title || 'AI 코치'}
          </span>
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-xs text-muted-foreground">{timeStr}</span>
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
        {lastMessage && formatMessagePreview(lastMessage) && (
          <p className="text-xs text-muted-foreground truncate mt-0.5">
            {formatMessagePreview(lastMessage)}
          </p>
        )}
      </div>

      {/* 삭제 버튼 */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
        }}
        className="absolute top-2.5 right-1.5 p-1.5 rounded-full text-muted-foreground/50 hover:text-destructive hover:bg-destructive/10 transition-colors"
        aria-label="대화 삭제"
      >
        <TrashSimpleIcon size={14} />
      </button>
    </div>
  );
}

// ============================================================================
// Helpers
// ============================================================================

/**
 * 활성 목적 타입에 따른 상태 라벨
 */
function getPurposeLabel(type: ActivePurposeType): string {
  switch (type) {
    case 'routine_generation':
      return '운동 루틴 생성 중';
    default:
      return '진행 중';
  }
}

/**
 * 날짜별 그룹핑
 */
function groupByDate(
  conversations: CoachConversationListItem[]
): Record<string, CoachConversationListItem[]> {
  const groups: Record<string, CoachConversationListItem[]> = {};
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
  const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

  for (const item of conversations) {
    const date = new Date(item.conversation.createdAt);
    const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());

    let label: string;
    if (dateOnly.getTime() === today.getTime()) {
      label = '오늘';
    } else if (dateOnly.getTime() === yesterday.getTime()) {
      label = '어제';
    } else if (dateOnly >= weekAgo) {
      label = '이번 주';
    } else {
      label = `${date.getMonth() + 1}월 ${date.getDate()}일`;
    }

    if (!groups[label]) {
      groups[label] = [];
    }
    groups[label].push(item);
  }

  return groups;
}
