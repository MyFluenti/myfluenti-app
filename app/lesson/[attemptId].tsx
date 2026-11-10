import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useMemo, useRef, useState, type ComponentRef } from 'react';
import { Pressable, StyleSheet, View, type TextInput } from 'react-native';

import { Button, ContentBlocks, Icon, LoadingState, ProgressBar, Text } from '@/components';
import { parseContent, type ContentExample } from '@/components/ContentBlocks';
import { notify } from '@/features/common/dialogs';
import { FlowScreen } from '@/features/common/FlowScreen';
import { LoadError } from '@/features/lesson/LoadError';
import { SectionNote } from '@/features/lesson/SectionNote';
import {
  buildSteps,
  readyToFinish,
  resumeIndex,
  sectionLabel,
  type LessonStep,
} from '@/features/lesson/steps';
import { useSectionNotes } from '@/features/lesson/useSectionNotes';
import { AnswerFeedback } from '@/features/questions/AnswerFeedback';
import { QuestionAnswerInput } from '@/features/questions/QuestionAnswerInput';
import {
  EMPTY_DRAFT,
  canSubmitDraft,
  toAnswerPayload,
  type AnswerDraft,
} from '@/features/questions/answer';
import { useAsync } from '@/hooks/useAsync';
import { toAppError } from '@/services/errors';
import {
  addPhraseFavorite,
  getFavoriteExampleIds,
  removePhraseFavorite,
} from '@/services/favorites';
import * as lesson from '@/services/lesson';
import { listNotes } from '@/services/notes';
import { colors, layout, opacity, radius, spacing } from '@/theme/tokens';
import type { LessonAnswerResult, LessonContent } from '@/types/contract';

/** Ids de frases ligadas a `vocabulary_examples` nas seções (para o favorito). */
function exampleIds(content: LessonContent): string[] {
  const ids = new Set<string>();
  for (const section of content.sections) {
    for (const block of parseContent(section.content)) {
      const items =
        block.kind === 'examples' ? block.items : block.kind === 'structure' ? block.examples : [];
      for (const item of items) if (item.vocabulary_example_id) ids.add(item.vocabulary_example_id);
    }
  }
  return [...ids];
}

/**
 * Telas 21, 22 e 07: a aula de uma tentativa. Seções, depois exercícios, uma tela por
 * passo. Tudo vem de `get_lesson_content`; correção de `submit_lesson_answer`; conclusão
 * de `finish_lesson_attempt`. Sair no meio é seguro: ao voltar, retoma de onde parou.
 * Tentativa encerrada abre só para leitura, com as explicações.
 */
export default function LessonScreen() {
  const router = useRouter();
  const { attemptId } = useLocalSearchParams<{ attemptId: string }>();
  const state = useAsync(useCallback(() => lesson.getContent(attemptId), [attemptId]));
  const content = state.data;
  const lessonId = content?.lesson.id;

  // Notas da aula e frases favoritas: extras da tela, não bloqueiam a aula. Cada um
  // falha sozinho, com aviso.
  const extras = useAsync(
    useCallback(async () => {
      if (!content) return null;
      const [notes, favorites] = await Promise.allSettled([
        listNotes({ lessonId: content.lesson.id }),
        getFavoriteExampleIds(exampleIds(content)),
      ]);
      return {
        notes: notes.status === 'fulfilled' ? notes.value : null,
        favorites: favorites.status === 'fulfilled' ? favorites.value : null,
      };
      // Só recarrega ao trocar de aula, não a cada resposta.
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [lessonId]),
  );
  const notes = useSectionNotes(lessonId, extras.data?.notes ?? null);
  const [favoriteEdits, setFavoriteEdits] = useState<Record<string, boolean>>({});
  const favoritePending = useRef<Set<string>>(new Set());

  const readOnly = content?.attempt.status !== 'in_progress';
  const steps = useMemo(() => (content ? buildSteps(content) : []), [content]);

  // O passo inicial é fixado na primeira carga; recargas depois não mudam o passo.
  const [index, setIndex] = useState<number | null>(null);
  if (index === null && content) setIndex(resumeIndex(steps, readOnly));
  const current = index ?? 0;
  const step: LessonStep | null = steps[current] ?? null;

  // Respostas e seções desta visita (além das que já vieram do backend).
  const [answersNow, setAnswersNow] = useState<Record<string, LessonAnswerResult>>({});
  const [viewedNow, setViewedNow] = useState<Set<string>>(() => new Set());
  const [draft, setDraft] = useState<AnswerDraft>(EMPTY_DRAFT);
  const [busy, setBusy] = useState<'step' | 'answer' | 'finish' | null>(null);
  const [error, setError] = useState<string | undefined>();
  const [missing, setMissing] = useState<string | undefined>();
  const noteInput = useRef<ComponentRef<typeof TextInput>>(null);

  const goTo = (next: number) => {
    setIndex(next);
    setDraft(EMPTY_DRAFT);
    setError(undefined);
    setMissing(undefined);
  };

  const leave = () => {
    if (router.canGoBack()) router.back();
    else if (content) {
      router.replace({ pathname: '/course/[moduleId]', params: { moduleId: content.lesson.module_id } });
    } else router.replace('/course');
  };

  /** Abre o resultado gravado de uma tentativa já encerrada. */
  const showSavedResult = async () => {
    if (!content) return;
    const saved = await lesson.getAttemptResult(attemptId);
    if (saved.status !== 'completed') return;
    router.replace({
      pathname: '/lesson/result',
      params: {
        attemptId,
        lessonId: content.lesson.id,
        moduleId: content.lesson.module_id,
        lessonPosition: String(content.lesson.position),
        score: String(saved.score_pct ?? ''),
        passed: saved.passed ? '1' : '0',
      },
    });
  };

  const advanceFromSection = async () => {
    if (!step || step.kind !== 'section') return;
    const { section } = step;
    if (!readOnly && !section.viewed && !viewedNow.has(section.id)) {
      setBusy('step');
      setError(undefined);
      try {
        await lesson.recordSectionView(section.id);
        setViewedNow((prev) => new Set(prev).add(section.id));
      } catch (e) {
        setError(toAppError(e).message);
        return;
      } finally {
        setBusy(null);
      }
    }
    goTo(current + 1);
  };

  const submit = async () => {
    if (!step || step.kind !== 'question') return;
    const { question } = step;
    const payload = toAnswerPayload(question, draft);
    if (!payload) return;
    setBusy('answer');
    setError(undefined);
    try {
      const result = await lesson.submitAnswer(attemptId, question.id, payload);
      setAnswersNow((prev) => ({ ...prev, [question.id]: result }));
    } catch (e) {
      const appError = toAppError(e);
      if (appError.code === '23505') {
        // Já respondida (toque duplo, outra aba): a correção volta na recarga.
        state.refresh();
      } else if (appError.code === '55000') {
        setError('Esta tentativa já foi encerrada.');
        state.refresh();
      } else {
        setError(appError.message);
      }
    } finally {
      setBusy(null);
    }
  };

  const finish = async () => {
    setBusy('finish');
    setError(undefined);
    setMissing(undefined);
    try {
      // Confere no backend antes de encerrar: encerrar com pendências perde a tentativa.
      const fresh = await lesson.getContent(attemptId);
      if (!readyToFinish(fresh.progress)) {
        const freshSteps = buildSteps(fresh);
        state.refresh();
        goTo(Math.min(resumeIndex(freshSteps, false), freshSteps.length - 1));
        setMissing('Ainda falta ver alguma seção ou responder alguma questão. Levamos você até lá.');
        return;
      }
      const result = await lesson.finishAttempt(attemptId);
      router.replace({
        pathname: '/lesson/result',
        params: {
          attemptId,
          lessonId: fresh.lesson.id,
          moduleId: fresh.lesson.module_id,
          lessonPosition: String(fresh.lesson.position),
          score: String(result.score_pct),
          passed: result.passed ? '1' : '0',
          sectionsComplete: result.sections_complete ? '1' : '0',
          allAnswered: result.all_questions_answered ? '1' : '0',
          moduleCompleted: result.module_completed ? '1' : '0',
        },
      });
    } catch (e) {
      const appError = toAppError(e);
      if (appError.code === '55000') {
        // Já encerrada (ex.: a resposta anterior se perdeu na rede): mostra o resultado gravado.
        await showSavedResult().catch(() => setError('Esta tentativa já foi encerrada.'));
      } else if (appError.kind === 'premium_required') {
        router.push('/premium-module');
      } else {
        setError(appError.message);
      }
    } finally {
      setBusy(null);
    }
  };

  const isFavorite = (id: string) =>
    favoriteEdits[id] ?? extras.data?.favorites?.has(id) ?? false;

  const toggleFavorite = async (id: string) => {
    if (favoritePending.current.has(id)) return;
    favoritePending.current.add(id);
    const was = isFavorite(id);
    setFavoriteEdits((prev) => ({ ...prev, [id]: !was }));
    try {
      if (!was) await addPhraseFavorite(id);
      else await removePhraseFavorite(id);
    } catch (e) {
      // Já favoritada (ex.: em outro aparelho): o estado final é o que o aluno pediu.
      if (!was && toAppError(e).code === '23505') return;
      setFavoriteEdits((prev) => ({ ...prev, [id]: was }));
      notify('Não foi possível salvar o favorito', toAppError(e).message);
    } finally {
      favoritePending.current.delete(id);
    }
  };

  // ---------- cabeçalho ----------
  const total = steps.length;
  const progressValue = total > 0 ? (Math.min(current, total) / total) * 100 : 0;
  const counter =
    step?.kind === 'section'
      ? `Seção ${step.number} de ${step.total}`
      : step?.kind === 'question'
        ? `${step.number} de ${step.total}`
        : null;

  const header = (
    <>
      <View style={styles.topRow}>
        <Pressable
          onPress={leave}
          disabled={busy === 'finish'}
          accessibilityRole="button"
          accessibilityLabel="Voltar ao módulo"
          accessibilityState={{ disabled: busy === 'finish' }}
          hitSlop={spacing.sm}
          style={({ pressed }) => [styles.back, { opacity: pressed ? opacity.pressed : 1 }]}
        >
          <Text variant="label" color="textSecondary">
            ‹ Módulo
          </Text>
        </Pressable>
        {step?.kind === 'section' && extras.data?.notes ? (
          <Pressable
            onPress={() => noteInput.current?.focus()}
            accessibilityRole="button"
            accessibilityLabel="Escrever nota sobre esta seção"
            hitSlop={spacing.sm}
            style={({ pressed }) => [styles.iconButton, { opacity: pressed ? opacity.pressed : 1 }]}
          >
            <Icon name="pencil" color="textSecondary" size={layout.iconSize} />
          </Pressable>
        ) : null}
      </View>
      {content ? (
        <>
          <View style={styles.titleRow}>
            <Text variant="heading3" style={styles.title} numberOfLines={2}>
              {content.lesson.title}
            </Text>
            {counter ? (
              <Text variant="label" color="textSecondary">
                {counter}
              </Text>
            ) : null}
          </View>
          <ProgressBar
            value={progressValue}
            accessibilityLabel={`Progresso da aula: ${Math.round(progressValue)}%`}
          />
        </>
      ) : null}
    </>
  );

  if (state.loading) {
    return (
      <FlowScreen header={header}>
        <LoadingState />
      </FlowScreen>
    );
  }
  if (state.error || !content) {
    return (
      <FlowScreen header={header}>
        {state.error ? (
          <LoadError error={state.error} onRetry={state.reload} onBack={leave} />
        ) : null}
      </FlowScreen>
    );
  }

  const messages = (
    <>
      {missing ? (
        <Text variant="bodyM" color="statusWarning" accessibilityLiveRegion="polite">
          {missing}
        </Text>
      ) : null}
      {error ? (
        <Text variant="bodyM" color="statusError" accessibilityLiveRegion="polite">
          {error}
        </Text>
      ) : null}
    </>
  );

  // ---------- fim ----------
  if (!step) {
    return (
      <FlowScreen
        header={header}
        centered
        footer={
          <>
            {messages}
            {readOnly ? (
              <>
                <Button label="Ver resultado" onPress={() => void showSavedResult()} />
                <Button label="Voltar ao módulo" variant="secondary" onPress={leave} />
              </>
            ) : (
              <Button label="Ver resultado" onPress={finish} loading={busy === 'finish'} />
            )}
          </>
        }
      >
        <View style={styles.done}>
          <Text variant="heading1" accessibilityRole="header">
            {readOnly ? 'Fim da aula' : 'Você terminou a aula'}
          </Text>
          <Text variant="bodyL" color="textSecondary">
            {readOnly
              ? 'Esta tentativa já foi encerrada. Você pode rever as seções e as explicações quando quiser.'
              : 'Veja o seu aproveitamento.'}
          </Text>
        </View>
      </FlowScreen>
    );
  }

  const backButton =
    current > 0 ? (
      <Button
        label="Voltar"
        variant="secondary"
        onPress={() => goTo(current - 1)}
        disabled={busy !== null}
        style={styles.backButton}
      />
    ) : null;

  const notesUnavailable =
    extras.data && (extras.data.notes === null || extras.data.favorites === null) ? (
      <Text variant="caption" color="textSecondary">
        Não conseguimos carregar suas notas ou favoritos agora.
      </Text>
    ) : null;

  // ---------- seção ----------
  if (step.kind === 'section') {
    const { section } = step;
    const next = steps[current + 1];
    const label = sectionLabel(section.section_type);
    const primaryLabel =
      next?.kind === 'question' && step.number === step.total ? 'Fazer exercícios' : 'Continuar';
    const sectionNote = notes.noteFor(section.id);

    return (
      <FlowScreen
        header={header}
        footer={
          <>
            {messages}
            <View style={styles.footerRow}>
              {backButton}
              <Button
                label={primaryLabel}
                onPress={advanceFromSection}
                loading={busy === 'step'}
                disabled={busy !== null}
                style={styles.primaryButton}
              />
            </View>
          </>
        }
      >
        <View key={section.id} style={styles.section}>
          {label ? (
            <View style={styles.tag}>
              <Text variant="caption" color="brandPrimaryLight" style={styles.tagText}>
                {label}
              </Text>
            </View>
          ) : null}
          {section.title ? (
            <Text variant="heading1" accessibilityRole="header">
              {section.title}
            </Text>
          ) : null}
          <ContentBlocks
            content={section.content}
            renderItemAccessory={(item: ContentExample) => {
              const id = item.vocabulary_example_id;
              if (!id || !extras.data?.favorites) return null;
              const fav = isFavorite(id);
              return (
                <Pressable
                  accessibilityRole="checkbox"
                  accessibilityLabel={`Favoritar frase: ${item.en}`}
                  aria-checked={fav}
                  onPress={() => void toggleFavorite(id)}
                  hitSlop={spacing.sm}
                  style={styles.iconButton}
                >
                  <Text variant="heading3" color={fav ? 'brandPrimaryLight' : 'textSecondary'}>
                    {fav ? '★' : '☆'}
                  </Text>
                </Pressable>
              );
            }}
          />
          {extras.data?.notes ? (
            <SectionNote
              key={section.id}
              initialText={sectionNote?.body ?? ''}
              saveState={notes.stateFor(section.id)}
              onSave={(text) => void notes.save(section.id, text)}
              inputRef={noteInput}
            />
          ) : null}
          {notesUnavailable}
        </View>
      </FlowScreen>
    );
  }

  // ---------- questão ----------
  const { question, exercise } = step;
  const localResult = answersNow[question.id] ?? null;
  const serverAnswer = question.answer;
  const answered = localResult ?? serverAnswer;
  const isLast = current === steps.length - 1;

  return (
    <FlowScreen
      header={header}
      footer={
        <>
          {messages}
          <View style={styles.footerRow}>
            {backButton}
            {answered || readOnly ? (
              <Button
                label={isLast ? 'Continuar' : 'Próxima'}
                onPress={() => goTo(current + 1)}
                style={styles.primaryButton}
              />
            ) : (
              <Button
                label="Responder"
                onPress={submit}
                loading={busy === 'answer'}
                disabled={!canSubmitDraft(question, draft) || busy !== null}
                style={styles.primaryButton}
              />
            )}
          </View>
        </>
      }
    >
      <View key={question.id} style={styles.section}>
        {exercise?.instructions ? (
          <Text variant="bodyM" color="textSecondary">
            {exercise.instructions}
          </Text>
        ) : null}
        <Text variant="heading2" accessibilityRole="header">
          {question.prompt}
        </Text>
        <QuestionAnswerInput
          question={question}
          draft={draft}
          onChange={setDraft}
          disabled={answered !== null || readOnly || busy !== null}
          result={localResult}
        />
        {!localResult && serverAnswer ? (
          <Text variant="bodyM" color="textSecondary">
            Você já respondeu esta questão nesta tentativa.
          </Text>
        ) : null}
        {!answered && readOnly ? (
          <Text variant="bodyM" color="textSecondary">
            Esta questão ficou sem resposta nesta tentativa.
          </Text>
        ) : null}
        {answered ? <AnswerFeedback result={answered} /> : null}
      </View>
    </FlowScreen>
  );
}

const styles = StyleSheet.create({
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  back: {
    minHeight: layout.minTouchTarget,
    justifyContent: 'center',
  },
  iconButton: {
    minWidth: layout.minTouchTarget,
    minHeight: layout.minTouchTarget,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  title: { flex: 1 },
  section: { gap: spacing.lg, marginTop: spacing.sm },
  tag: {
    alignSelf: 'flex-start',
    backgroundColor: colors.brandPrimarySubtle,
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  tagText: { textTransform: 'uppercase' },
  footerRow: { flexDirection: 'row', gap: spacing.md },
  backButton: { flex: 1 },
  primaryButton: { flex: 2 },
  done: { gap: spacing.sm },
});
