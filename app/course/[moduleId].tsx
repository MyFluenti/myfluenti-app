import { useLocalSearchParams, useRouter } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { LessonRow, ProgressBar, Text } from '@/components';
import type { LessonStatus } from '@/components/LessonRow';
import { Screen } from '@/features/common/Screen';
import { moduleTitle } from '@/features/course/format';
import { useCourseOverview } from '@/features/course/useCourseOverview';
import { useModuleLessons } from '@/features/course/useModuleLessons';
import { layout, opacity, spacing } from '@/theme/tokens';

/** Mapeia o `status` da RPC para o `LessonStatus` do componente. */
function toLessonStatus(status: string): LessonStatus {
  if (status === 'completed') return 'completed';
  if (status === 'in_progress') return 'in_progress';
  if (status === 'locked') return 'locked';
  return 'available';
}

export default function ModuleScreen() {
  const { moduleId, title } = useLocalSearchParams<{ moduleId: string; title?: string }>();
  const router = useRouter();
  const state = useModuleLessons(moduleId);
  // Progresso e título do módulo vêm do overview (mesmo dado do Curso).
  const overview = useCourseOverview();
  const current = overview.data?.find((m) => m.module_id === moduleId);
  const heading = (current ? moduleTitle(current) : title) || 'Aulas';

  return (
    <Screen state={state}>
      {(lessons) => (
        <>
          <View style={styles.header}>
            <Pressable
              onPress={() => router.back()}
              accessibilityRole="button"
              accessibilityLabel="Voltar ao curso"
              style={({ pressed }) => [styles.backButton, { opacity: pressed ? opacity.pressed : 1 }]}
            >
              <Text variant="label" color="brandPrimaryLight">
                ‹ Curso
              </Text>
            </Pressable>
            <Text variant="display" accessibilityRole="header">
              {heading}
            </Text>
            <Text variant="bodyM" color="textSecondary">
              Faça as aulas em qualquer ordem. Conclua todas as obrigatórias para liberar o próximo
              módulo.
            </Text>
            {current ? (
              <ProgressBar
                value={current.progress_pct}
                accessibilityLabel={`Progresso do módulo: ${Math.round(current.progress_pct)}%`}
              />
            ) : null}
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
    gap: spacing.sm,
  },
  backButton: {
    alignSelf: 'flex-start',
    minHeight: layout.minTouchTarget,
    justifyContent: 'center',
  },
  list: { gap: spacing.sm },
});
