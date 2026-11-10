import { useEffect } from 'react';

import { EmptyState, ErrorState, LoadingState, PremiumState } from '@/components';
import { useAuth } from '@/features/auth/AuthProvider';
import type { AppError } from '@/services/errors';

/** Estados de erro das telas de aula, iguais aos do `Screen` (bloqueado, Premium, rede). */
export function LoadError({
  error,
  onRetry,
  onBack,
}: {
  error: AppError;
  onRetry: () => void;
  onBack: () => void;
}) {
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
  // A tentativa não existe (ou é de outra conta): tentar de novo não adianta.
  if (error.kind === 'known' && error.code === 'attempt_not_found') {
    return (
      <EmptyState
        title="Aula não encontrada"
        message={error.message}
        actionLabel="Voltar"
        onAction={onBack}
      />
    );
  }
  return <ErrorState title="Algo deu errado" message={error.message} onRetry={onRetry} />;
}
