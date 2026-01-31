'use client';

import { Suspense } from 'react';
import dynamic from 'next/dynamic';
import { ChatLayout } from '@/components/layouts';
import { QueryErrorBoundary } from '@/components/common/QueryErrorBoundary';
import { PulseLoader } from '@/components/ui/PulseLoader';

const CoachContent = dynamic(
  () => import('@/components/coach/CoachContent'),
  { ssr: false, loading: () => <PulseLoader /> }
);

/**
 * 코치 채팅 페이지
 *
 * - ChatLayout: 즉시 렌더링
 * - QueryErrorBoundary: 에러 처리
 * - Suspense: 데이터 로딩 처리
 */
export default function CoachPage() {
  return (
    <ChatLayout>
      <QueryErrorBoundary>
        <Suspense fallback={<PulseLoader />}>
          <CoachContent />
        </Suspense>
      </QueryErrorBoundary>
    </ChatLayout>
  );
}
