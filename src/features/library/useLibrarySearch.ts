import { useCallback } from 'react';

import { useAsync } from '@/hooks/useAsync';
import { searchLibrary } from '@/services/library';

export function useLibrarySearch(limit = 20) {
  const load = useCallback(() => searchLibrary({ limit }), [limit]);
  return useAsync(load);
}
