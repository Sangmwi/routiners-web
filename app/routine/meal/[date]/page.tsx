'use client';

import { Suspense, useState, type ReactNode } from 'react';
import { use } from 'react';
import dynamic from 'next/dynamic';
import { DetailLayout } from '@/components/layouts';
import { QueryErrorBoundary } from '@/components/common/QueryErrorBoundary';
import { PulseLoader } from '@/components/ui/PulseLoader';

const MealContent = dynamic(
  () => import('@/components/routine/event/MealContent'),
  { ssr: false, loading: () => <PulseLoader /> }
);

interface MealPageProps {
  params: Promise<{ date: string }>;
}

/**
 * 식단 상세 페이지
 *
 * - DetailLayout + Header: 즉시 렌더링
 * - QueryErrorBoundary: 에러 처리
 * - Suspense: 데이터 로딩 처리
 * - MealContent: ssr: false (authFetch 상대경로 SSR 호환 문제 방지)
 */
export default function MealPage({ params }: MealPageProps) {
  const { date } = use(params);
  const [headerAction, setHeaderAction] = useState<ReactNode>(null);

  return (
    <DetailLayout title="식단 관리" action={headerAction}>
      <QueryErrorBoundary>
        <Suspense fallback={<PulseLoader />}>
          <MealContent date={date} onHeaderAction={setHeaderAction} />
        </Suspense>
      </QueryErrorBoundary>
    </DetailLayout>
  );
}
