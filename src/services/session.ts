import { AppError, toAppError } from './errors';
import { supabase } from './supabase';

/** Id do usuário autenticado, lido da sessão. Nunca vem de parâmetro da tela. */
export async function requireUserId(): Promise<string> {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw toAppError(error);
  const id = data.session?.user.id;
  if (!id) throw new AppError({ kind: 'not_authenticated' });
  return id;
}
