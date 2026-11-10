import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';

import { useAuth } from '@/features/auth/AuthProvider';
import { toAppError, type AppError } from '@/services/errors';
import * as placement from '@/services/placement';
import { getOnboardingState, updateProfile } from '@/services/profile';

/**
 * - `loading`: lendo o perfil.
 * - `pending`: falta concluir a porta de entrada (autoavaliação e nivelamento).
 * - `done`: `onboarding_completed_at` gravado.
 * - `error`: não deu para ler o perfil (ex.: sem rede).
 */
export type OnboardingStatus = 'loading' | 'pending' | 'done' | 'error';

type OnboardingContextValue = {
  status: OnboardingStatus;
  error: AppError | null;
  /** Autoavaliação gravada no perfil (null = "Não sei meu nível" ou ainda não respondida). */
  selfAssessedLevelId: string | null;
  retry: () => void;
  /** Guarda a autoavaliação (update permitido em profiles). */
  saveSelfAssessment: (levelId: string | null) => Promise<void>;
  /**
   * Define o nível de partida pela RPC (o backend recusa nível acima do recomendado)
   * e grava `onboarding_completed_at`. Só depois disso o app libera as abas.
   */
  complete: (levelId: string, placementAttemptId?: string) => Promise<void>;
};

const OnboardingContext = createContext<OnboardingContextValue | null>(null);

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const { status: authStatus, user, signOutLocal } = useAuth();
  const userId = authStatus === 'signed_in' ? (user?.id ?? null) : null;

  const [status, setStatus] = useState<OnboardingStatus>('loading');
  // Usuário a que `status` se refere: ao trocar de conta, nada vaza da conta anterior.
  const [loadedFor, setLoadedFor] = useState<string | null>(null);
  const [error, setError] = useState<AppError | null>(null);
  const [selfAssessedLevelId, setSelfAssessedLevelId] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  // Nível já aceito pela RPC nesta sessão: se só o update do perfil falhar, não repete a RPC.
  const levelSelected = useRef<string | null>(null);

  useEffect(() => {
    if (!userId) return;
    let active = true;
    levelSelected.current = null;
    getOnboardingState()
      .then((profile) => {
        if (!active) return;
        setSelfAssessedLevelId(profile.self_assessed_level_id);
        setError(null);
        setStatus(profile.onboarding_completed_at ? 'done' : 'pending');
        setLoadedFor(userId);
      })
      .catch((e: unknown) => {
        if (!active) return;
        const appError = toAppError(e);
        if (appError.kind === 'not_authenticated') {
          signOutLocal().catch(() => {});
          return;
        }
        setError(appError);
        setStatus('error');
        setLoadedFor(userId);
      });
    return () => {
      active = false;
    };
  }, [userId, attempt, signOutLocal]);

  const retry = useCallback(() => {
    setLoadedFor(null);
    setError(null);
    setAttempt((n) => n + 1);
  }, []);

  const saveSelfAssessment = useCallback(async (levelId: string | null) => {
    await updateProfile({ self_assessed_level_id: levelId });
    setSelfAssessedLevelId(levelId);
  }, []);

  const complete = useCallback(async (levelId: string, placementAttemptId?: string) => {
    const key = `${levelId}:${placementAttemptId ?? ''}`;
    if (levelSelected.current !== key) {
      await placement.selectStartingLevel(levelId, placementAttemptId);
      levelSelected.current = key;
    }
    await updateProfile({ onboarding_completed_at: new Date().toISOString() });
    setStatus('done');
  }, []);

  const effectiveStatus: OnboardingStatus =
    userId !== null && loadedFor === userId ? status : 'loading';

  const value = useMemo<OnboardingContextValue>(
    () => ({
      status: effectiveStatus,
      error,
      selfAssessedLevelId,
      retry,
      saveSelfAssessment,
      complete,
    }),
    [effectiveStatus, error, selfAssessedLevelId, retry, saveSelfAssessment, complete],
  );

  return <OnboardingContext.Provider value={value}>{children}</OnboardingContext.Provider>;
}

export function useOnboarding(): OnboardingContextValue {
  const ctx = useContext(OnboardingContext);
  if (!ctx) throw new Error('useOnboarding fora do OnboardingProvider');
  return ctx;
}
