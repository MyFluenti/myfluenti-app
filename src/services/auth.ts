import type { AuthChangeEvent, Session, Subscription } from '@supabase/supabase-js';

import { AppError, toAppError } from './errors';
import { supabase } from './supabase';

export type { Session };

/** Devolve a sessão, ou null quando o projeto exige confirmação de e-mail. */
export async function signUp(
  email: string,
  password: string,
  displayName?: string,
): Promise<Session | null> {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: displayName ? { data: { display_name: displayName } } : undefined,
  });
  if (error) throw toAppError(error);
  return data.session;
}

export async function signIn(email: string, password: string): Promise<Session> {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw toAppError(error);
  if (!data.session) throw new AppError({ kind: 'unknown' });
  return data.session;
}

export async function signOut(): Promise<void> {
  const { error } = await supabase.auth.signOut();
  if (error) throw toAppError(error);
}

/** Encerra só a sessão local (não chama o servidor): funciona sem rede. */
export async function signOutLocal(): Promise<void> {
  const { error } = await supabase.auth.signOut({ scope: 'local' });
  if (error) throw toAppError(error);
}

export async function getSession(): Promise<Session | null> {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw toAppError(error);
  return data.session;
}

/** Devolve a assinatura; chame `unsubscribe()` ao desmontar. */
export function onAuthStateChange(
  callback: (event: AuthChangeEvent, session: Session | null) => void,
): Subscription {
  return supabase.auth.onAuthStateChange(callback).data.subscription;
}
