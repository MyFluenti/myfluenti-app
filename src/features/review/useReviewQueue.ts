import { useCallback } from 'react';

import { useAsync } from '@/hooks/useAsync';
import { getReviewQueue } from '@/services/review';

export function useReviewQueue() {
  const load = useCallback(() => getReviewQueue(), []);
  return useAsync(load);
}
