import { useLocalSearchParams, useRouter } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { LessonRow, Text } from '@/components';
import type { LessonStatus } from '@/components/LessonRow';
import { Icon } from '@/components/icons';
import { Screen } from '@/features/common/Screen';
import { useModuleLessons } from '@/features/course/useModuleLessons';
import { colors, layout, opacity, spacing } from '@/theme/tokens';

/** Mapeia o `status` da RPC para o `LessonStatus` do componente. */
function toLessonStatus(status: string): LessonStatus {
  if (status === 'completed') return 'completed';
  if (status === 'in_progress') return 'in_progress';
  if (status === 'locked') return 'locked';
  return 'available';
}

export default function ModuleScreen() {
  const { moduleId } = useLocalSearchParams<{ moduleId: string }>();
  const router = useRouter();
  const state = useModuleLessons(moduleId);

  return (
    <Screen state={state}>
      {(lessons) => (
        <>
          {/* Cabeçalho com botão voltar */}
          <View style={styles.header}>
            <Pressable
              onPress={() => router.back()}
              accessibilityRole="button"
              accessibilityLabel="Voltar"
              style={({ pressed }) => [styles.backButton, { opacity: pressed ? opacity.pressed : 1 }]}
            >
              <Icon name="arrow-left" color="textPrimary" size={layout.iconSize} />
            </Pressable>
            <Text variant="heading2" style={styles.headerTitle}>
              Aulas
            </Text>
          </View>

          {lessons.length === 0 ? (
            <Text variant="bodyM" color="textSecondary">
              Nenhuma aula disponível neste módulo.
            </Text>
          ) : (
            <View style={styles.list}>
              {lessons.map((l) => (
                <LessonRow
                  key={l.lesson_id}
                  title={l.title}
                  position={l.position}
                  status={toLessonStatus(l.status)}
                  onPress={() => {
                    // TODO: navegar para a tela de aula quando a rota existir.
                  }}
                />
              ))}
            </View>
          )}
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderDefault,
  },
  backButton: {
    minWidth: layout.minTouchTarget,
    minHeight: layout.minTouchTarget,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { flex: 1 },
  list: { gap: spacing.sm },
});
