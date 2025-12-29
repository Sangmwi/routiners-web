'use client';

import {
  useQuery,
  useMutation,
  useQueryClient,
  UseQueryOptions,
} from '@tanstack/react-query';
import {
  InBodyRecord,
  InBodyCreateData,
  InBodyUpdateData,
  InBodySummary,
} from '@/lib/types';
import { inbodyApi } from '@/lib/api/inbody';
import { queryKeys } from '@/lib/constants/queryKeys';

/**
 * InBody Query Hooks
 *
 * InBody 기록 조회 관련 React Query 훅
 */

/**
 * InBody 기록 목록 조회
 *
 * @param limit - 조회할 기록 수 (기본 20)
 * @param offset - 오프셋 (페이지네이션)
 *
 * @example
 * const { data: records, isLoading } = useInBodyRecords();
 */
export function useInBodyRecords(
  limit = 20,
  offset = 0,
  options?: Omit<UseQueryOptions<InBodyRecord[]>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: queryKeys.inbody.list(limit, offset),
    queryFn: () => inbodyApi.getRecords(limit, offset),
    staleTime: 5 * 60 * 1000, // 5분간 fresh
    ...options,
  });
}

/**
 * 최신 InBody 기록 조회
 *
 * @example
 * const { data: latest } = useLatestInBody();
 */
export function useLatestInBody(
  options?: Omit<UseQueryOptions<InBodyRecord | null>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: queryKeys.inbody.latest(),
    queryFn: inbodyApi.getLatest,
    staleTime: 5 * 60 * 1000,
    ...options,
  });
}

/**
 * InBody 요약 정보 조회 (프로필 표시용)
 *
 * @example
 * const { data: summary } = useInBodySummary();
 */
export function useInBodySummary(
  options?: Omit<UseQueryOptions<InBodySummary>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: queryKeys.inbody.summary(),
    queryFn: inbodyApi.getSummary,
    staleTime: 5 * 60 * 1000,
    ...options,
  });
}

/**
 * 특정 사용자의 InBody 요약 정보 조회
 *
 * @param userId - 조회할 사용자 ID
 *
 * @example
 * const { data: summary } = useUserInBodySummary('user-123');
 */
export function useUserInBodySummary(
  userId: string | undefined,
  options?: Omit<UseQueryOptions<InBodySummary>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: queryKeys.inbody.userSummary(userId || ''),
    queryFn: () => inbodyApi.getUserSummary(userId!),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
    ...options,
  });
}

/**
 * 특정 InBody 기록 조회
 *
 * @param id - InBody 기록 ID
 *
 * @example
 * const { data: record } = useInBodyRecord('record-id');
 */
export function useInBodyRecord(
  id: string | undefined,
  options?: Omit<UseQueryOptions<InBodyRecord | null>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: queryKeys.inbody.detail(id || ''),
    queryFn: () => inbodyApi.getRecord(id!),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
    ...options,
  });
}

/**
 * InBody Mutation Hooks
 *
 * InBody 기록 생성/수정/삭제 관련 React Query 훅
 */

/**
 * InBody 기록 생성 Mutation
 *
 * @example
 * const createInBody = useCreateInBody();
 *
 * createInBody.mutate(data, {
 *   onSuccess: () => {
 *     toast.success('인바디 기록이 저장되었습니다');
 *   },
 * });
 */
export function useCreateInBody() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: inbodyApi.createRecord,

    onSuccess: (newRecord) => {
      // 목록 캐시 무효화
      queryClient.invalidateQueries({
        queryKey: queryKeys.inbody.all,
      });

      // 최신 기록 캐시 업데이트
      queryClient.setQueryData(queryKeys.inbody.latest(), newRecord);

      // 요약 캐시 무효화
      queryClient.invalidateQueries({
        queryKey: queryKeys.inbody.summary(),
      });
    },
  });
}

/**
 * InBody 기록 수정 Mutation
 *
 * @example
 * const updateInBody = useUpdateInBody();
 *
 * updateInBody.mutate({ id: 'record-id', data: { weight: 75 } });
 */
export function useUpdateInBody() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: InBodyUpdateData }) =>
      inbodyApi.updateRecord(id, data),

    onSuccess: (updatedRecord) => {
      // 상세 캐시 업데이트
      queryClient.setQueryData(
        queryKeys.inbody.detail(updatedRecord.id),
        updatedRecord
      );

      // 목록 캐시 무효화
      queryClient.invalidateQueries({
        queryKey: queryKeys.inbody.all,
      });

      // 최신 기록이면 캐시 업데이트
      const latestRecord = queryClient.getQueryData<InBodyRecord>(
        queryKeys.inbody.latest()
      );
      if (latestRecord?.id === updatedRecord.id) {
        queryClient.setQueryData(queryKeys.inbody.latest(), updatedRecord);
      }

      // 요약 캐시 무효화
      queryClient.invalidateQueries({
        queryKey: queryKeys.inbody.summary(),
      });
    },
  });
}

/**
 * InBody 기록 삭제 Mutation
 *
 * @example
 * const deleteInBody = useDeleteInBody();
 *
 * deleteInBody.mutate('record-id', {
 *   onSuccess: () => {
 *     toast.success('기록이 삭제되었습니다');
 *   },
 * });
 */
export function useDeleteInBody() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: inbodyApi.deleteRecord,

    onSuccess: (_, deletedId) => {
      // 상세 캐시 제거
      queryClient.removeQueries({
        queryKey: queryKeys.inbody.detail(deletedId),
      });

      // 목록 캐시 무효화
      queryClient.invalidateQueries({
        queryKey: queryKeys.inbody.all,
      });

      // 최신 기록 캐시 무효화 (삭제된 것이 최신이었을 수 있음)
      queryClient.invalidateQueries({
        queryKey: queryKeys.inbody.latest(),
      });

      // 요약 캐시 무효화
      queryClient.invalidateQueries({
        queryKey: queryKeys.inbody.summary(),
      });
    },
  });
}
