import { useEffect, type ReactNode } from 'react';
import { RefreshControl, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EmptyState, ErrorState, LoadingState, PremiumState } from '@/components';
import { useAuth } from '@/features/auth/AuthProvider';
import type { AsyncState } from '@/hooks/useAsync';
import { colors, layout, spacing } from '@/theme/tokens';

type ScreenProps<T> = {
  state?: AsyncState<T>;
  children: ReactNode | ((data: T) => ReactNode);
};

/**
 * Casca das telas: fundo, área segura, e os estados globais de carga e erro.
 * Sem `state`, só renderiza o conteúdo.
 */
export function Screen<T>({ state, children }: ScreenProps<T>) {
  const { signOutLocal } = useAuth();
  const unauthenticated = state?.error?.kind === 'not_authenticated';

  // Sessão inválida: volta ao login em vez de mostrar erro.
  useEffect(() => {
    if (unauthenticated) signOutLocal().catch(() => {});
  }, [unauthenticated, signOutLocal]);

  let body: ReactNode;

  if (!state) {
    body = children as ReactNode;
  } else if (state.loading) {
    body = <LoadingState />;
  } else if (state.error) {
    const { error } = state;
    body =
      error.kind === 'not_authenticated' ? (
        <LoadingState />
      ) : error.kind === 'module_locked' ? (
        <EmptyState title="Módulo bloqueado" message="Conclua o módulo anterior" />
      ) : error.kind === 'premium_required' ? (
        <PremiumState />
      ) : error.kind === 'network' ? (
        <ErrorState onRetry={state.reload} />
      ) : (
        <ErrorState title="Algo deu errado" message={error.message} onRetry={state.reload} />
      );
  } else if (state.data !== null) {
    body = typeof children === 'function' ? children(state.data) : children;
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          state ? (
            <RefreshControl
              refreshing={state.refreshing}
              onRefresh={state.refresh}
              tintColor={colors.brandPrimary}
            />
          ) : undefined
        }
      >
        {body}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bgBase },
  content: {
    flexGrow: 1,
    padding: layout.screenPaddingX,
    gap: spacing.lg,
  },
});
