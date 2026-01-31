'use client';

import { ReactNode } from 'react';

interface ChatLayoutProps {
  /** 자식 컴포넌트 (채팅 UI) */
  children: ReactNode;
}

/**
 * 채팅 페이지용 레이아웃 (순수 배치만 담당)
 *
 * - 전체 화면 높이 (h-screen)
 * - flex column 레이아웃
 * - 자체 헤더 사용 (CoachHeader 등)
 *
 * Suspense/ErrorBoundary는 각 page.tsx에서 명시적으로 관리합니다.
 * 이는 SOLID의 SRP(단일 책임 원칙)를 따릅니다.
 *
 * @example
 * // page.tsx에서 사용
 * <ChatLayout>
 *   <QueryErrorBoundary>
 *     <Suspense fallback={<PulseLoader />}>
 *       <CoachChatContent />
 *     </Suspense>
 *   </QueryErrorBoundary>
 * </ChatLayout>
 */
export function ChatLayout({ children }: ChatLayoutProps) {
  return (
    <div className="flex flex-col h-screen bg-background">
      {children}
    </div>
  );
}

export default ChatLayout;
