import { useRouter } from 'expo-router';
import { useState } from 'react';
import { View, StyleSheet } from 'react-native';

import { EmptyState, ModuleCard, Text } from '@/components';
import { Screen } from '@/features/common/Screen';
import { useCourseOverview } from '@/features/course/useCourseOverview';
import type { ModuleStatus } from '@/components/ModuleCard';
import { spacing } from '@/theme/tokens';

/**
 * Converte o `state` devolvido pelo backend para o `ModuleStatus` do componente.
 * Não decide por `access_tier`: quem diz que o plano bloqueia é o backend (locked_plan).
 */
function toModuleStatus(state: string): ModuleStatus {
  switch (state) {
    case 'locked':
      return 'locked';
    case 'locked_plan':
      return 'premium';
    case 'in_progress':
      return 'in_progress';
    case 'completed':
      return 'completed';
    default:
      return 'available';
  }
}


export default function CourseScreen() {
  const router = useRouter();
  const state = useCourseOverview();
  // Módulo Premium sem plano: mostra o estado Premium em vez de abrir o módulo.
  const [premiumOpen, setPremiumOpen] = useState(false);

  return (
    <Screen state={state}>
      {(modules) => (
        <>
          <Text variant="display" accessibilityRole="header">
            Curso
          </Text>

          {premiumOpen ? (
            <EmptyState
              title="Disponível no plano Premium"
              message="Este módulo faz parte do plano Premium. A assinatura ainda não está disponível no app."
              actionLabel="Voltar ao curso"
              onAction={() => setPremiumOpen(false)}
            />
          ) : modules.length === 0 ? (
            <EmptyState
              title="Seu curso começa pelo nivelamento"
              message="Faça o teste para descobrir por onde começar."
              actionLabel="Fazer o nivelamento"
              onAction={() => {
                // TODO: navegar para o nivelamento quando a rota existir.
              }}
            />
          ) : (
            <View style={styles.list}>
              {modules.map((m) => {
                const status = toModuleStatus(m.state);
                return (
                  <ModuleCard
                    key={m.module_id}
                    title={m.title}
                    description={m.description}
                    status={status}
                    progress={m.progress_pct}
                    onPress={() => {
                      if (status === 'premium') {
                        setPremiumOpen(true);
                        return;
                      }
                      router.push({
                        pathname: '/course/[moduleId]',
                        params: { moduleId: m.module_id, title: m.title },
                      });
                    }}
                  />
                );
              })}
            </View>
          )}
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: { gap: spacing.md },
});
