import { useCallback } from 'react';

import { useAsync } from '@/hooks/useAsync';
import { getLibraryItem } from '@/services/library';
import type { LibraryType } from '@/types/contract';

export function useLibraryItem(type: LibraryType, id: string) {
  const load = useCallback(() => getLibraryItem(type, id), [type, id]);
  return useAsync(load);
}
