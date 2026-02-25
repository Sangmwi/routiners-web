'use client';

import { ReactNode } from 'react';

interface ChatLayoutProps {
  /** 자식 컴포넌트 (채팅 UI) */
  children: ReactNode;
}

interface ChatContentProps {
  /** 콘텐츠 */
  children: ReactNode;
  /** 추가 클래스 */
  className?: string;
}

/**
 * 채팅 페이지용 레이아웃 (순수 배치만 담당)
 *
 * - 전체 화면 높이 (h-screen)
 * - flex column 레이아웃
 * - 자체 헤더 사용 (CounselorHeader 등)
 *
 * Suspense/ErrorBoundary는 각 page.tsx에서 명시적으로 관리합니다.
 * 이는 SOLID의 SRP(단일 책임 원칙)를 따릅니다.
 *
 * @example
 * // page.tsx에서 사용
 * <ChatLayout>
 *   <CounselorHeader />
 *   <ChatLayout.Content>
 *     <Suspense fallback={<PulseLoader variant="chat" />}>
 *       <CounselorChatContent />
 *     </Suspense>
 *   </ChatLayout.Content>
 * </ChatLayout>
 */
export function ChatLayout({ children }: ChatLayoutProps) {
  return (
    <div
      className="fixed inset-x-0 top-0 z-40 flex flex-col bg-background overflow-hidden"
      style={{
        height: 'var(--app-height, 100dvh)',
        transition: 'height 0.3s ease-out',
      }}
    >
      {children}
    </div>
  );
}

/**
 * 채팅 콘텐츠 영역 래퍼
 *
 * - CSS Variable 기반 패딩 적용
 * - flex-1로 남은 공간 채움
 * - 스크롤 가능
 */
function ChatContent({ children, className = '' }: ChatContentProps) {
  return (
    <div
      className={`flex-1 flex flex-col min-h-0 ${className}`.trim()}
    >
      {children}
    </div>
  );
}

ChatLayout.Content = ChatContent;

export default ChatLayout;
