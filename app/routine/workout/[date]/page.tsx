import { dehydrate, HydrationBoundary } from '@tanstack/react-query';
import { getQueryClient } from '@/lib/query-client';
import { queryKeys } from '@/lib/constants/queryKeys';
import { fetchRoutineEventByDateServer } from '@/lib/api/routine.server';
import { WorkoutClient } from '@/components/routine';

// 정적 생성 방지 - 인증 기반 데이터 필요
export const dynamic = 'force-dynamic';

interface WorkoutPageProps {
  params: Promise<{ date: string }>;
}

/**
 * 운동 상세 페이지 (Server Component)
 *
 * SSR 흐름:
 * 1. Server: 해당 날짜의 운동 이벤트 prefetch
 * 2. HydrationBoundary로 클라이언트에 데이터 전달
 * 3. Client: 동일한 queryKey로 즉시 hydrate (refetch 없음)
 */
export default async function WorkoutPage({ params }: WorkoutPageProps) {
  const { date } = await params;
  const queryClient = getQueryClient();

  await queryClient.prefetchQuery({
    queryKey: queryKeys.routineEvent.byDate(date, 'workout'),
    queryFn: () => fetchRoutineEventByDateServer(date, 'workout'),
  });

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <WorkoutClient params={params} />
    </HydrationBoundary>
  );
}
