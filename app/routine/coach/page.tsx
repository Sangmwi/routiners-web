'use client';

import { Suspense, useState } from 'react';
import dynamic from 'next/dynamic';
import { ChatLayout } from '@/components/layouts';
import { QueryErrorBoundary } from '@/components/common/QueryErrorBoundary';
import { PulseLoader } from '@/components/ui/PulseLoader';
import CoachHeader from '@/components/coach/CoachHeader';

const CoachContent = dynamic(
  () => import('@/components/coach/CoachContent'),
  { ssr: false, loading: () => <PulseLoader variant="chat" /> }
);

/**
 * 코치 채팅 페이지
 *
 * 프로젝트 패턴 준수:
 * - CoachHeader: Suspense 밖 (즉시 렌더링, 다른 페이지와 일관성)
 * - CoachContent: Suspense 내부 (데이터 로딩)
 *
 * 드로어 상태:
 * - isOpen: page.tsx에서 관리 (헤더 즉시 동작)
 * - 드로어 내용/액션: CoachContent 내부 (데이터 필요)
 */
export default function CoachPage() {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  return (
    <ChatLayout>
      {/* 헤더: Suspense 밖 - 즉시 렌더링 */}
      <CoachHeader onMenuClick={() => setIsDrawerOpen(true)} />

      {/* 컨텐츠: Suspense 내부 - 데이터 로딩 */}
      <ChatLayout.Content>
        <QueryErrorBoundary>
          <Suspense fallback={<PulseLoader variant="chat" />}>
            <CoachContent
              isDrawerOpen={isDrawerOpen}
              onDrawerClose={() => setIsDrawerOpen(false)}
            />
          </Suspense>
        </QueryErrorBoundary>
      </ChatLayout.Content>
    </ChatLayout>
  );
}
