import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { LessonRow, ProgressBar, Text } from '@/components';
import { notify } from '@/features/common/dialogs';
import type { LessonStatus } from '@/components/LessonRow';
import { Screen } from '@/features/common/Screen';
import { moduleTitle } from '@/features/course/format';
import { useCourseOverview } from '@/features/course/useCourseOverview';
import { useModuleLessons } from '@/features/course/useModuleLessons';
import { toAppError } from '@/services/errors';
import { startAttempt } from '@/services/lesson';
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

  // Ao voltar de uma aula, atualiza status e progresso (sem piscar o loading).
  const { refresh: refreshLessons } = state;
  const { refresh: refreshOverview } = overview;
  const focusedOnce = useRef(false);
  useFocusEffect(
    useCallback(() => {
      if (!focusedOnce.current) {
        focusedOnce.current = true;
        return;
      }
      refreshLessons();
      refreshOverview();
    }, [refreshLessons, refreshOverview]),
  );

  // Abre (ou retoma) a tentativa pelo backend, que valida módulo e plano.
  const [opening, setOpening] = useState<string | null>(null);
  const openLesson = async (lessonId: string) => {
    if (opening) return;
    setOpening(lessonId);
    try {
      const attemptId = await startAttempt(lessonId);
      router.push({ pathname: '/lesson/[attemptId]', params: { attemptId } });
    } catch (e) {
      const error = toAppError(e);
      if (error.kind === 'premium_required') router.push('/premium-module');
      else if (error.kind === 'module_locked') notify('Módulo bloqueado', 'Conclua o módulo anterior');
      else notify('Não foi possível abrir a aula', error.message);
    } finally {
      setOpening(null);
    }
  };

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
                  onPress={() => void openLesson(l.lesson_id)}
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
