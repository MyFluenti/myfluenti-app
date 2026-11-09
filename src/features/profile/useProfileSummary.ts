import { useCallback } from 'react';

import { useAsync } from '@/hooks/useAsync';
import { getProfileSummary } from '@/services/profile';

export function useProfileSummary() {
  const load = useCallback(() => getProfileSummary(), []);
  return useAsync(load);
}
