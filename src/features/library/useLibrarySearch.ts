import { useCallback } from 'react';

import { useAsync } from '@/hooks/useAsync';
import { searchLibrary } from '@/services/library';
import type { LibraryFilters } from '@/types/contract';

export function useLibrarySearch(filters: LibraryFilters = {}) {
  const { type, query, category, levelCode, limit = 50, offset = 0 } = filters;

  const load = useCallback(
    () =>
      searchLibrary({
        type,
        query: query?.trim() ? query.trim() : undefined,
        category,
        levelCode,
        limit,
        offset,
      }),
    [type, query, category, levelCode, limit, offset],
  );

  return useAsync(load);
}
