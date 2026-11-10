import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { EmptyState, ModuleCard, Text } from '@/components';
import type { ModuleStatus } from '@/components/ModuleCard';
import { Screen } from '@/features/common/Screen';
import { lessonsProgressText, moduleTitle } from '@/features/course/format';
import { useCourseOverview } from '@/features/course/useCourseOverview';
import { useProfileSummary } from '@/features/profile/useProfileSummary';
import { colors, radius, spacing } from '@/theme/tokens';

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
  // Só para o selo do nível em estudo; se falhar, o selo some e o curso segue.
  const profile = useProfileSummary();
  const level = profile.data?.current_level ?? null;

  return (
    <Screen state={state}>
      {(modules) => (
        <>
          <View style={styles.header}>
            <View style={styles.titleRow}>
              <Text variant="display" accessibilityRole="header">
                Curso
              </Text>
              {level ? (
                <View style={styles.levelBadge} accessible accessibilityLabel={`Nível ${level.code}`}>
                  <Text variant="label" color="brandPrimaryLight">
                    {`Nível ${level.code}`}
                  </Text>
                </View>
              ) : null}
            </View>
            <Text variant="bodyM" color="textSecondary">
              Conclua cada módulo para liberar o próximo.
            </Text>
          </View>

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
                const status = toModuleStatus(m.state);
                return (
                  <ModuleCard
                    key={m.module_id}
                    title={moduleTitle(m)}
                    description={lessonsProgressText(m)}
                    status={status}
                    progress={m.progress_pct}
                    onPress={() => {
                      if (status === 'premium') {
                        router.push({
                          pathname: '/premium-module',
                          params: { title: moduleTitle(m) },
                        });
                        return;
                      }
                      router.push({
                        pathname: '/course/[moduleId]',
                        params: { moduleId: m.module_id, title: moduleTitle(m) },
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
  header: { gap: spacing.xs },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  levelBadge: {
    backgroundColor: colors.brandPrimarySubtle,
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  list: { gap: spacing.md },
});
