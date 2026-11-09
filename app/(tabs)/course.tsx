import { useRouter } from 'expo-router';
import { View, StyleSheet } from 'react-native';

import { EmptyState, ModuleCard, Text } from '@/components';
import { Screen } from '@/features/common/Screen';
import { useCourseOverview } from '@/features/course/useCourseOverview';
import type { ModuleStatus } from '@/components/ModuleCard';
import { spacing } from '@/theme/tokens';

/** Converte o `state` da RPC para o `ModuleStatus` do componente. */
function toModuleStatus(state: string, accessTier: string): ModuleStatus {
  if (state === 'locked') return 'locked';
  if (accessTier === 'premium' && state !== 'completed') return 'premium';
  if (state === 'completed') return 'completed';
  if (state === 'in_progress') return 'in_progress';
  return 'available';
}

export default function CourseScreen() {
  const router = useRouter();
  const state = useCourseOverview();

  return (
    <Screen state={state}>
      {(modules) => (
        <>
          <Text variant="display" accessibilityRole="header">
            Curso
          </Text>

          {modules.length === 0 ? (
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
                const status = toModuleStatus(m.state, m.access_tier);
                return (
                  <ModuleCard
                    key={m.module_id}
                    title={m.title}
                    description={m.description}
                    status={status}
                    progress={m.progress_pct}
                    onPress={() => router.push({ pathname: '/course/[moduleId]', params: { moduleId: m.module_id } })}
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
