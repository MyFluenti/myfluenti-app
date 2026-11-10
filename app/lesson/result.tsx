import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Button, Text } from '@/components';
import { FlowScreen } from '@/features/common/FlowScreen';
import { LESSON_PASS_PCT_FOR_DISPLAY, formatScore } from '@/features/lesson/display';
import { useAsync } from '@/hooks/useAsync';
import { getCourseOverview, getModuleLessons } from '@/services/course';
import { toAppError } from '@/services/errors';
import * as lesson from '@/services/lesson';
import { colors, layout, radius, spacing, type ColorToken } from '@/theme/tokens';

type Params = {
  attemptId: string;
  lessonId: string;
  moduleId: string;
  lessonPosition: string;
  score: string;
  passed: string;
  sectionsComplete: string;
  allAnswered: string;
  moduleCompleted: string;
};

/**
 * Telas 25 (concluída) e 26 (quase lá). Mostra o que `finish_lesson_attempt` devolveu;
 * o app não calcula nada. As linhas extras (aulas do módulo, tentativas) são leituras
 * do backend, só para exibir.
 */
export default function LessonResultScreen() {
  const router = useRouter();
  const p = useLocalSearchParams<Params>();
  const passed = p.passed === '1';
  const score = Number(p.score);
  const position = Number(p.lessonPosition);

  const extras = useAsync(
    useCallback(async () => {
      const [overview, lessons, attempts] = await Promise.all([
        getCourseOverview().catch(() => null),
        getModuleLessons(p.moduleId).catch(() => null),
        passed ? Promise.resolve(null) : lesson.countAttempts(p.lessonId).catch(() => null),
      ]);
      const module = overview?.find((m) => m.module_id === p.moduleId) ?? null;
      const next =
        lessons
          ?.filter((l) => l.position > position && l.status !== 'locked')
          .sort((a, b) => a.position - b.position)[0] ?? null;
      return { module, next, attempts };
    }, [p.moduleId, p.lessonId, passed, position]),
  );

  const [busy, setBusy] = useState<'next' | 'retry' | null>(null);
  const [error, setError] = useState<string | undefined>();

  const backToModule = () => {
    if (router.canGoBack()) router.back();
    else router.replace({ pathname: '/course/[moduleId]', params: { moduleId: p.moduleId } });
  };

  const openLesson = async (lessonId: string, which: 'next' | 'retry') => {
    setBusy(which);
    setError(undefined);
    try {
      const attemptId = await lesson.startAttempt(lessonId);
      router.replace({ pathname: '/lesson/[attemptId]', params: { attemptId } });
    } catch (e) {
      const appError = toAppError(e);
      if (appError.kind === 'premium_required') router.push('/premium-module');
      else setError(appError.message);
    } finally {
      setBusy(null);
    }
  };

  const tone: ColorToken = passed ? 'statusSuccess' : 'statusWarning';
  const scoreText = Number.isFinite(score) ? formatScore(score) : '—';
  const module = extras.data?.module ?? null;
  const next = extras.data?.next ?? null;

  let message: string;
  if (passed) {
    message = `Você atingiu os ${LESSON_PASS_PCT_FOR_DISPLAY}% necessários.`;
    if (score < 100) message += ' Os itens que você errou entram na sua revisão.';
  } else if (p.sectionsComplete !== '1') {
    message = 'Faltou ver alguma seção obrigatória. Sua tentativa foi salva e você pode tentar de novo.';
  } else if (p.allAnswered !== '1') {
    message = 'Ficou alguma questão sem resposta. Sua tentativa foi salva e você pode tentar de novo.';
  } else {
    message = `Para concluir a aula é preciso ${LESSON_PASS_PCT_FOR_DISPLAY}% de aproveitamento. Sua tentativa foi salva e você pode tentar de novo.`;
  }

  const rows: { label: string; value: string; color?: ColorToken }[] = [
    { label: 'Aproveitamento', value: scoreText, color: tone },
    { label: 'Mínimo para concluir', value: `${LESSON_PASS_PCT_FOR_DISPLAY}%` },
  ];
  if (passed && module) {
    rows.push({
      label: 'Aulas obrigatórias do módulo',
      value: `${module.completed_lessons} de ${module.required_lessons}`,
    });
  }
  if (!passed && extras.data?.attempts != null) {
    rows.push({ label: 'Tentativas nesta aula', value: String(extras.data.attempts) });
  }

  const footer = (
    <>
      {error ? (
        <Text variant="bodyM" color="statusError" accessibilityLiveRegion="polite">
          {error}
        </Text>
      ) : null}
      {passed ? (
        <>
          {next ? (
            <Button
              label="Próxima aula"
              onPress={() => void openLesson(next.lesson_id, 'next')}
              loading={busy === 'next'}
              disabled={busy !== null}
            />
          ) : null}
          <Button
            label="Voltar ao módulo"
            variant={next ? 'secondary' : 'primary'}
            onPress={backToModule}
            disabled={busy !== null}
          />
        </>
      ) : (
        <>
          <Button
            label="Tentar de novo"
            onPress={() => void openLesson(p.lessonId, 'retry')}
            loading={busy === 'retry'}
            disabled={busy !== null}
          />
          <Button
            label="Rever a explicação"
            variant="secondary"
            onPress={() =>
              router.replace({ pathname: '/lesson/[attemptId]', params: { attemptId: p.attemptId } })
            }
            disabled={busy !== null}
          />
        </>
      )}
    </>
  );

  return (
    <FlowScreen footer={footer} centered>
      <View
        style={styles.hero}
        accessible
        accessibilityLabel={`${passed ? 'Aula concluída' : 'Quase lá'}. Aproveitamento: ${scoreText}`}
      >
        <View
          style={[
            styles.circle,
            {
              borderColor: colors[tone],
              backgroundColor: passed ? colors.statusSuccessSubtle : colors.bgElevated,
            },
          ]}
        >
          <Text variant="display" color={tone}>
            {scoreText}
          </Text>
        </View>
        <Text variant="heading1" accessibilityRole="header">
          {passed ? 'Aula concluída' : 'Quase lá'}
        </Text>
        <Text variant="bodyM" color="textSecondary" style={styles.center}>
          {message}
        </Text>
        {passed && p.moduleCompleted === '1' ? (
          <Text variant="bodyM" color="statusSuccess" style={styles.center}>
            Você concluiu as aulas obrigatórias deste módulo.
          </Text>
        ) : null}
      </View>

      <View style={styles.card}>
        {rows.map((row) => (
          <View key={row.label} style={styles.row} accessible accessibilityLabel={`${row.label}: ${row.value}`}>
            <Text variant="bodyM" color="textSecondary">
              {row.label}
            </Text>
            <Text variant="label" color={row.color ?? 'textPrimary'}>
              {row.value}
            </Text>
          </View>
        ))}
      </View>
    </FlowScreen>
  );
}

const CIRCLE = layout.levelBadgeSize;

const styles = StyleSheet.create({
  hero: { alignItems: 'center', gap: spacing.md },
  circle: {
    width: CIRCLE,
    height: CIRCLE,
    borderRadius: radius.full,
    borderWidth: layout.borderWidthStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  center: { textAlign: 'center' },
  card: {
    backgroundColor: colors.bgSurface,
    borderColor: colors.borderDefault,
    borderWidth: layout.borderWidth,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.md,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
});
