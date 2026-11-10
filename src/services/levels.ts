import type { Level } from '@/types/contract';

import { assertOk } from './errors';
import { supabase } from './supabase';

/** Os seis níveis de referência (A1 a C2), na ordem de `position`. */
export async function listLevels(): Promise<Level[]> {
  const result = await supabase
    .from('levels')
    .select('id, code, title, position')
    .order('position', { ascending: true });
  assertOk(result);
  return result.data ?? [];
}
