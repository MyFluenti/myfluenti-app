import { useLocalSearchParams, usePreventRemove, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Button, ErrorState, Icon, LoadingState, ProgressBar, Text } from '@/components';
import { confirm } from '@/features/common/dialogs';
import { FlowScreen } from '@/features/common/FlowScreen';
import { placementErrorMessage } from '@/features/onboarding/messages';
import { QuestionAnswerInput } from '@/features/questions/QuestionAnswerInput';
import {
  EMPTY_DRAFT,
  canSubmitDraft,
  toAnswerPayload,
  type AnswerDraft,
} from '@/features/questions/answer';
import { useAsync } from '@/hooks/useAsync';
import { toAppError } from '@/services/errors';
import * as placement from '@/services/placement';
import { layout, opacity, spacing } from '@/theme/tokens';

const COMPETENCY_LABELS: Record<string, string> = {
  vocabulary: 'Vocabulário',
  grammar: 'Gramática',
  reading: 'Interpretação',
  construction: 'Construção',
};

/**
 * Tela 02: perguntas do nivelamento. Mostra só os itens ainda não respondidos, um por vez,
 * sem correção e sem voltar. Sair no meio é seguro: ao voltar, retoma do primeiro não
 * respondido (`get_placement_items`).
 */
export default function PlacementQuestionScreen() {
  const router = useRouter();
  const { attemptId } = useLocalSearchParams<{ attemptId: string }>();
  const state = useAsync(useCallback(() => placement.getItems(attemptId), [attemptId]));

  // Respondidas nesta tela (além das que já vieram com answered: true).
  const [answeredNow, setAnsweredNow] = useState<Set<string>>(() => new Set());
  const [draft, setDraft] = useState<AnswerDraft>(EMPTY_DRAFT);
  const [busy, setBusy] = useState<'answer' | 'finish' | null>(null);
  const [error, setError] = useState<string | undefined>();

  // Tentativa já encerrada: o resultado está gravado, só mostra.
  const closed = state.error?.kind === 'known' && state.error.code === 'attempt_closed';

  // Qualquer saída (X ou voltar do Android) pede confirmação. Ir para o resultado não.
  const [leaving, setLeaving] = useState(false);
  const disablePrevention = usePreventRemove(!leaving && !closed, ({ repeat }) => {
    void confirm({
      title: 'Sair do teste?',
      message: 'Suas respostas ficam salvas. Quando voltar, você continua de onde parou.',
      confirmLabel: 'Sair',
      cancelLabel: 'Continuar o teste',
    }).then((ok) => {
      if (!ok) return;
      setLeaving(true);
      repeat();
    });
  });

  const replaceWithResult = useCallback(
    () => router.replace({ pathname: '/placement/result', params: { attemptId } }),
    [router, attemptId],
  );
  const goToResult = useCallback(() => {
    setLeaving(true);
    disablePrevention();
    replaceWithResult();
  }, [disablePrevention, replaceWithResult]);

  // Com a tentativa encerrada a proteção já está desligada (`closed`).
  useEffect(() => {
    if (closed) replaceWithResult();
  }, [closed, replaceWithResult]);

  const data = state.data;
  const pending = useMemo(
    () => (data ? data.items.filter((i) => !i.answered && !answeredNow.has(i.question.id)) : []),
    [data, answeredNow],
  );
  const current = pending[0] ?? null;
  const total = data?.items.length ?? 0;
  const answered = total - pending.length;

  // A confirmação vem do usePreventRemove.
  const exit = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/');
  };

  const finish = async () => {
    setError(undefined);
    setBusy('finish');
    try {
      await placement.finish(attemptId);
      goToResult();
    } catch (e) {
      // Já encerrada (ex.: outra aba): o resultado existe.
      if (toAppError(e).code === '55000') goToResult();
      else setError(placementErrorMessage(e));
    } finally {
      setBusy(null);
    }
  };

  const submit = async () => {
    if (!current) return;
    const payload = toAnswerPayload(current.question, draft);
    if (!payload) return;
    setError(undefined);
    setBusy('answer');
    try {
      await placement.submitAnswer(attemptId, current.question.id, payload);
      setAnsweredNow((prev) => new Set(prev).add(current.question.id));
      setDraft(EMPTY_DRAFT);
      if (pending.length === 1) {
        // Última questão: encerra e mostra o resultado. Se falhar, a tela de "todas
        // respondidas" oferece "Ver resultado".
        setBusy(null);
        await finish();
        return;
      }
    } catch (e) {
      const appError = toAppError(e);
      if (appError.code === '23505') {
        // Já respondida (ex.: toque duplo ou outra aba): segue para a próxima.
        setAnsweredNow((prev) => new Set(prev).add(current.question.id));
        setDraft(EMPTY_DRAFT);
      } else if (appError.code === '55000') {
        goToResult();
      } else {
        setError(placementErrorMessage(e));
      }
    } finally {
      setBusy(null);
    }
  };

  const header = (
    <>
      <View style={styles.titleRow}>
        <Pressable
          onPress={exit}
          accessibilityRole="button"
          accessibilityLabel="Sair do teste"
          hitSlop={spacing.sm}
          style={({ pressed }) => [styles.close, { opacity: pressed ? opacity.pressed : 1 }]}
        >
          <Icon name="close" color="textSecondary" size={layout.iconSize} />
        </Pressable>
        <Text variant="heading3" style={styles.title} accessibilityRole="header">
          Nivelamento
        </Text>
        {total > 0 ? (
          <Text variant="label" color="textSecondary">
            {Math.min(answered + 1, total)} de {total}
          </Text>
        ) : null}
      </View>
      {total > 0 ? (
        <ProgressBar
          value={(answered / total) * 100}
          accessibilityLabel={`Progresso: ${answered} de ${total} questões respondidas`}
        />
      ) : null}
    </>
  );

  if (state.loading || closed) {
    return (
      <FlowScreen header={header}>
        <LoadingState />
      </FlowScreen>
    );
  }

  if (state.error || !data) {
    return (
      <FlowScreen header={header}>
        {state.error?.kind === 'network' ? (
          <ErrorState onRetry={state.reload} />
        ) : (
          <ErrorState title="Algo deu errado" message={state.error?.message} onRetry={state.reload} />
        )}
      </FlowScreen>
    );
  }

  const errorText = error ? (
    <Text variant="bodyM" color="statusError" accessibilityLiveRegion="polite">
      {error}
    </Text>
  ) : null;

  // Tudo respondido: falta só encerrar (ex.: saiu antes do fim e voltou).
  if (!current) {
    return (
      <FlowScreen
        header={header}
        footer={
          <>
            {errorText}
            <Button label="Ver resultado" onPress={finish} loading={busy === 'finish'} />
          </>
        }
        centered
      >
        <View style={styles.done}>
          <Text variant="heading1" accessibilityRole="header">
            Você respondeu todas as questões
          </Text>
          <Text variant="bodyL" color="textSecondary">
            Veja o nível recomendado para começar.
          </Text>
        </View>
      </FlowScreen>
    );
  }

  const isLast = pending.length === 1;
  const competency = COMPETENCY_LABELS[current.competency];

  return (
    <FlowScreen
      header={header}
      footer={
        <>
          {errorText}
          <Button
            label="Responder"
            onPress={submit}
            loading={busy === 'answer'}
            disabled={!canSubmitDraft(current.question, draft) || busy !== null}
          />
        </>
      }
    >
      <View key={current.question.id} style={styles.question}>
        {competency ? (
          <Text variant="label" color="brandPrimaryLight" style={styles.competency}>
            {competency}
          </Text>
        ) : null}
        <Text variant="heading2">{current.question.prompt}</Text>
        <QuestionAnswerInput
          question={current.question}
          draft={draft}
          onChange={setDraft}
          disabled={busy !== null}
        />
      </View>
      {isLast ? (
        <Text variant="caption" color="textSecondary">
          Esta é a última questão. Depois dela, você vê o resultado.
        </Text>
      ) : null}
    </FlowScreen>
  );
}

const styles = StyleSheet.create({
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  close: {
    minWidth: layout.minTouchTarget,
    minHeight: layout.minTouchTarget,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -spacing.md,
  },
  title: { flex: 1 },
  question: { gap: spacing.lg, marginTop: spacing.sm },
  competency: { textTransform: 'uppercase' },
  done: { gap: spacing.sm },
});
