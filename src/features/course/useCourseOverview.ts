import { useCallback } from 'react';

import { useAsync } from '@/hooks/useAsync';
import { getCourseOverview } from '@/services/course';

export function useCourseOverview() {
  const load = useCallback(() => getCourseOverview(), []);
  return useAsync(load);
}
