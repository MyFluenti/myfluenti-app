import type { Database } from '@/types/database';

import { assertOk, unwrap } from './errors';
import { supabase } from './supabase';

type Fns = Database['public']['Functions'];
type FnName = keyof Fns;

/** Chama uma RPC com argumentos tipados e devolve o retorno já tipado pelo contrato. */
export async function rpc<R, N extends FnName = FnName>(
  name: N,
  args: Fns[N]['Args'],
): Promise<R> {
  const result = await supabase.rpc(name, args as never);
  return unwrap<unknown>(result as { data: unknown; error: unknown }) as R;
}

/** RPC que não devolve dados (void). */
export async function rpcVoid<N extends FnName>(name: N, args: Fns[N]['Args']): Promise<void> {
  const result = await supabase.rpc(name, args as never);
  assertOk(result);
}
