import type { Session, User } from '@supabase/supabase-js';
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';

import * as auth from '@/services/auth';
import { updateProfile } from '@/services/profile';

export type AuthStatus = 'loading' | 'signed_in' | 'signed_out';

type AuthContextValue = {
  session: Session | null;
  user: User | null;
  status: AuthStatus;
  signIn: (email: string, password: string) => Promise<void>;
  /** Devolve true se já há sessão; false se falta confirmar o e-mail. */
  signUp: (email: string, password: string, displayName?: string) => Promise<boolean>;
  signOut: () => Promise<void>;
  /** Só limpa a sessão local; para sessão inválida ou sem rede. */
  signOutLocal: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [status, setStatus] = useState<AuthStatus>('loading');

  useEffect(() => {
    let active = true;

    const subscription = auth.onAuthStateChange((_event, next) => {
      if (!active) return;
      setSession(next);
      setStatus(next ? 'signed_in' : 'signed_out');
    });

    // Cobre a leitura inicial do storage seguro, caso o evento inicial não chegue.
    auth
      .getSession()
      .then((current) => {
        if (!active) return;
        setSession(current);
        setStatus(current ? 'signed_in' : 'signed_out');
      })
      .catch(() => {
        if (active) setStatus('signed_out');
      });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    await auth.signIn(email, password);
  }, []);

  const signUp = useCallback(async (email: string, password: string, displayName?: string) => {
    const created = await auth.signUp(email, password, displayName);
    if (created && displayName?.trim()) {
      // PENDENTE (backend): o trigger de perfil não lê o metadado display_name.
      // Contorno: grava o nome pelo update permitido. Falha aqui não bloqueia o cadastro.
      try {
        await updateProfile({ display_name: displayName.trim() });
      } catch {
        // o aluno pode editar o nome depois, no perfil
      }
    }
    return created !== null;
  }, []);

  const signOut = useCallback(async () => {
    await auth.signOut();
  }, []);

  const signOutLocal = useCallback(async () => {
    await auth.signOutLocal();
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ session, user: session?.user ?? null, status, signIn, signUp, signOut, signOutLocal }),
    [session, status, signIn, signUp, signOut, signOutLocal],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth deve ser usado dentro de <AuthProvider>.');
  return ctx;
}
