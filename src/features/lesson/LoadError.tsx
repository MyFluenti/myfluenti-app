import { useEffect } from 'react';

import { EmptyState, ErrorState, LoadingState, PremiumState } from '@/components';
import { useAuth } from '@/features/auth/AuthProvider';
import type { AppError } from '@/services/errors';

/** Estados de erro das telas de aula, iguais aos do `Screen` (bloqueado, Premium, rede). */
export function LoadError({ error, onRetry }: { error: AppError; onRetry: () => void }) {
  const { signOutLocal } = useAuth();
  const unauthenticated = error.kind === 'not_authenticated';
  useEffect(() => {
    if (unauthenticated) signOutLocal().catch(() => {});
  }, [unauthenticated, signOutLocal]);

  if (unauthenticated) return <LoadingState />;
  if (error.kind === 'module_locked') {
    return <EmptyState title="Módulo bloqueado" message="Conclua o módulo anterior" />;
  }
  if (error.kind === 'premium_required') return <PremiumState />;
  if (error.kind === 'network') return <ErrorState onRetry={onRetry} />;
  return <ErrorState title="Algo deu errado" message={error.message} onRetry={onRetry} />;
}
