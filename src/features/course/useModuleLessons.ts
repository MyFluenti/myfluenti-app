import { useCallback } from 'react';

import { useAsync } from '@/hooks/useAsync';
import { getModuleLessons } from '@/services/course';

/** Carrega as aulas de um módulo. Lança `module_locked` ou `premium_required`. */
export function useModuleLessons(moduleId: string) {
  const load = useCallback(() => getModuleLessons(moduleId), [moduleId]);
  return useAsync(load);
}
