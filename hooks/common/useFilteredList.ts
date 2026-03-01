'use client';

import { useState } from 'react';

/**
 * 검색어 상태와 필터링 결과를 관리하는 범용 훅.
 * SearchablePickerSheet 등 검색+필터 UI에서 반복 사용되는 상태 로직 추출.
 *
 * @param items - 전체 항목 배열
 * @param filterFn - 검색어가 있을 때 적용할 필터 함수
 * @param maxResults - 결과 최대 개수 (undefined = 제한 없음)
 */
export function useFilteredList<T>(
  items: readonly T[],
  filterFn: (item: T, query: string) => boolean,
  maxResults?: number,
) {
  const [query, setQuery] = useState('');

  const filtered = query.trim()
    ? items.filter((item) => filterFn(item, query.toLowerCase()))
    : items;

  const results = maxResults !== undefined ? filtered.slice(0, maxResults) : filtered;
  const hasOverflow = maxResults !== undefined && filtered.length > maxResults;

  return { query, setQuery, filtered: results, totalFiltered: filtered.length, hasOverflow };
}
