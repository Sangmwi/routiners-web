'use client';

import { Suspense, useState, type ReactNode } from 'react';
import { use } from 'react';
import dynamic from 'next/dynamic';

const WorkoutContent = dynamic(
  () => import('@/components/routine/event/WorkoutContent'),
  { ssr: false, loading: () => <PulseLoader /> }
);
import { DetailLayout } from '@/components/layouts';
import { QueryErrorBoundary } from '@/components/common/QueryErrorBoundary';
import { PulseLoader } from '@/components/ui/PulseLoader';

interface WorkoutPageProps {
  params: Promise<{ date: string }>;
}

/**
 * 운동 상세 페이지
 *
 * - DetailLayout + Header: 즉시 렌더링 (동적 타이틀)
 * - QueryErrorBoundary: 에러 처리
 * - Suspense: 데이터 로딩 처리
 */
export default function WorkoutPage({ params }: WorkoutPageProps) {
  const { date } = use(params);
  const [title, setTitle] = useState('운동 루틴');
  const [headerAction, setHeaderAction] = useState<ReactNode>(null);

  const handleTitleChange = (newTitle: string) => {
    setTitle(newTitle);
  };

  return (
    <DetailLayout title={title} centered action={headerAction} bottomInset="footer">
      <QueryErrorBoundary>
        <Suspense fallback={<PulseLoader />}>
          <WorkoutContent
            date={date}
            onTitleChange={handleTitleChange}
            onHeaderAction={setHeaderAction}
          />
        </Suspense>
      </QueryErrorBoundary>
    </DetailLayout>
  );
}
