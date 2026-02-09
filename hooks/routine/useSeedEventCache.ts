'use client';

import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/constants/queryKeys';
import type { RoutineEvent } from '@/lib/types/routine';

/**
 * 리스트 데이터로부터 개별 이벤트 byDate 캐시를 미리 세팅
 *
 * - Upcoming/List 쿼리 결과의 각 이벤트를 byDate 캐시에 주입
 * - 상세 페이지 진입 시 즉시 캐시 hit
 * - 이미 존재하는 캐시는 덮어쓰지 않음
 */
export function useSeedEventCache(events: RoutineEvent[] | undefined) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!events?.length) return;

    for (const event of events) {
      const key = queryKeys.routineEvent.byDate(event.date, event.type);
      if (!queryClient.getQueryData(key)) {
        queryClient.setQueryData(key, event);
      }
    }
  }, [events, queryClient]);
}
