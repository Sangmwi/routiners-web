'use client';

import { useCallback, useMemo, useState } from 'react';

interface UseCatalogSelectionOptions<TCategory, TResult> {
  search: (query: string, category?: TCategory) => TResult[];
}

export function useCatalogSelection<TCategory, TResult>({
  search,
}: UseCatalogSelectionOptions<TCategory, TResult>) {
  const [query, setQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<TCategory | null>(null);

  const searchResults = useMemo(
    () => search(query, categoryFilter ?? undefined),
    [categoryFilter, query, search],
  );

  const resetSelection = useCallback(() => {
    setQuery('');
    setCategoryFilter(null);
  }, []);

  return {
    query,
    setQuery,
    categoryFilter,
    setCategoryFilter,
    searchResults,
    resetSelection,
  };
}
