'use client';

import { Suspense, useState, type ReactNode } from 'react';
import { use } from 'react';
import dynamic from 'next/dynamic';

const MealContent = dynamic(
  () => import('@/components/routine/event/MealContent'),
  { ssr: false }
);
import { DetailLayout } from '@/components/layouts';
import { QueryErrorBoundary } from '@/components/common/QueryErrorBoundary';
import { PulseLoader } from '@/components/ui/PulseLoader';

interface MealPageProps {
  params: Promise<{ date: string }>;
}

/**
 * 식단 상세 페이지
 *
 * - DetailLayout + Header: 즉시 렌더링
 * - QueryErrorBoundary: 에러 처리
 * - Suspense: 데이터 로딩 처리
 */
export default function MealPage({ params }: MealPageProps) {
  const { date } = use(params);
  const [title, setTitle] = useState('식단 관리');
  const [headerAction, setHeaderAction] = useState<ReactNode>(null);

  return (
    <DetailLayout title={title} centered action={headerAction}>
      <QueryErrorBoundary>
        <Suspense fallback={<PulseLoader />}>
          <MealContent
            date={date}
            onTitleChange={setTitle}
            onHeaderAction={setHeaderAction}
          />
        </Suspense>
      </QueryErrorBoundary>
    </DetailLayout>
  );
}
