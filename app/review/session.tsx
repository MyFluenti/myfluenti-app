import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  Button,
  EmptyState,
  ErrorState,
  Icon,
  LoadingState,
  ProgressBar,
  Text,
} from '@/components';
import { confirm, notify } from '@/features/common/dialogs';
import { AnswerFeedback } from '@/features/questions/AnswerFeedback';
import { QuestionAnswerInput } from '@/features/questions/QuestionAnswerInput';
import {
  EMPTY_DRAFT,
  canSubmitDraft,
  toAnswerPayload,
  type AnswerDraft,
} from '@/features/questions/answer';
import {
  finishReviewSession,
  getReviewQueue,
  recordReviewResult,
  startReviewSession,
  submitReviewAnswer,
  type ReviewRating,
} from '@/services/review';
import { toAppError, type AppError } from '@/services/errors';
import { colors, layout, opacity, radius, spacing } from '@/theme/tokens';
import type {
  ReviewAnswerResult,
  ReviewQueueItem,
  ReviewSummary,
} from '@/types/contract';

type ReviewQuestion = Extract<ReviewQueueItem, { item_type: 'question' }>['question'];

export default function ReviewSessionScreen() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<AppError | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [items, setItems] = useState<ReviewQueueItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Estado da questão atual
  const [draft, setDraft] = useState<AnswerDraft>(EMPTY_DRAFT);
  const [submittingAnswer, setSubmittingAnswer] = useState(false);
  const [answerResult, setAnswerResult] = useState<ReviewAnswerResult | null>(null);
  const [recordingResult, setRecordingResult] = useState(false);
  // Backend pediu o botão (rating_required): mostra Difícil/Bom/Fácil para a questão atual.
  const [needsRating, setNeedsRating] = useState(false);

  // Resumo final
  const [summary, setSummary] = useState<ReviewSummary | null>(null);

  const initSession = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const sid = await startReviewSession();
      const queue = await getReviewQueue();
      setSessionId(sid);
      setItems(queue.items);
      setCurrentIndex(0);
      setDraft(EMPTY_DRAFT);
      setAnswerResult(null);
      setNeedsRating(false);
    } catch (e) {
      setError(toAppError(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void initSession();
  }, [initSession]);

  const confirmExit = async () => {
    if (summary) {
      router.replace('/practice');
      return;
    }
    const ok = await confirm({
      title: 'Sair da revisão?',
      message: 'Os itens que você já avaliou foram salvos.',
      confirmLabel: 'Sair',
      cancelLabel: 'Continuar revisando',
      destructive: true,
    });
    if (ok) router.replace('/practice');
  };

  const handleNext = useCallback(
    async (nextIdx: number, sid: string) => {
      setDraft(EMPTY_DRAFT);
      setAnswerResult(null);
      setNeedsRating(false);

      if (nextIdx < items.length) {
        setCurrentIndex(nextIdx);
      } else {
        // Fim da fila: encerra a sessão
        setLoading(true);
        try {
          const sum = await finishReviewSession(sid);
          setSummary(sum);
        } catch (e) {
          setError(toAppError(e));
        } finally {
          setLoading(false);
        }
      }
    },
    [items.length],
  );

  /**
   * Erros do contrato tratados pelo código, sem Alert genérico:
   * - already_reviewed: o item já foi avaliado nesta sessão, avança.
   * - session_closed: a sessão fechou (finalizada em outro lugar), reinicia.
   * - rating_required: o backend exige o botão, mostra Difícil/Bom/Fácil.
   * Devolve true se tratou o erro.
   */
  const handleSessionError = (e: unknown, sid: string, nextIdx: number): boolean => {
    const err = toAppError(e);
    if (err.kind === 'rating_required') {
      setNeedsRating(true);
      return true;
    }
    if (err.code === 'already_reviewed') {
      void handleNext(nextIdx, sid);
      return true;
    }
    if (err.code === 'session_closed') {
      void initSession();
      return true;
    }
    return false;
  };

  // A questão já foi respondida nesta sessão (ex.: o app foi fechado no meio).
  // O app não sabe se acertou e não decide: tenta gravar como erro (sem rating).
  // Se o backend responder rating_required, a resposta estava certa e ele pede o
  // botão; se aceitar, o item foi gravado e segue para o próximo.
  const resolveAlreadyAnswered = async (sid: string, questionId: string) => {
    try {
      await recordReviewResult(sid, { type: 'question', id: questionId }, { answered: 'incorrect' });
      await handleNext(currentIndex + 1, sid);
    } catch (e) {
      if (!handleSessionError(e, sid, currentIndex + 1)) {
        notify('Erro ao gravar', toAppError(e).message);
      }
    }
  };

  // Envia a resposta da questão
  /** "Responder" só habilita com resposta: opção escolhida, texto não vazio ou 1+ token. */
  const canSubmit = (q: ReviewQuestion): boolean => canSubmitDraft(q, draft);

  const handleSubmitAnswer = async () => {
    const currentItem = items[currentIndex];
    if (!sessionId || currentItem?.item_type !== 'question') return;

    const payload = toAnswerPayload(currentItem.question, draft);
    if (!payload) return;

    setSubmittingAnswer(true);
    try {
      const res = await submitReviewAnswer(sessionId, currentItem.question.id, payload);
      setAnswerResult(res);
    } catch (e) {
      const err = toAppError(e);
      if (err.code === 'already_answered') {
        await resolveAlreadyAnswered(sessionId, currentItem.question.id);
      } else if (!handleSessionError(e, sessionId, currentIndex + 1)) {
        notify('Erro ao enviar', err.message);
      }
    } finally {
      setSubmittingAnswer(false);
    }
  };

  // Grava o resultado de questão acertada (com rating)
  const handleRateQuestionCorrect = async (rating: ReviewRating) => {
    if (!sessionId) return;
    const currentItem = items[currentIndex];
    if (currentItem?.item_type !== 'question') return;

    setRecordingResult(true);
    try {
      await recordReviewResult(
        sessionId,
        { type: 'question', id: currentItem.question.id },
        { answered: 'correct', rating },
      );
      await handleNext(currentIndex + 1, sessionId);
    } catch (e) {
      if (!handleSessionError(e, sessionId, currentIndex + 1)) {
        notify('Erro ao gravar', toAppError(e).message);
      }
    } finally {
      setRecordingResult(false);
    }
  };

  // Grava o resultado de questão errada (sem rating)
  const handleContinueQuestionIncorrect = async () => {
    if (!sessionId) return;
    const currentItem = items[currentIndex];
    if (currentItem?.item_type !== 'question') return;

    setRecordingResult(true);
    try {
      await recordReviewResult(
        sessionId,
        { type: 'question', id: currentItem.question.id },
        { answered: 'incorrect' },
      );
      await handleNext(currentIndex + 1, sessionId);
    } catch (e) {
      if (!handleSessionError(e, sessionId, currentIndex + 1)) {
        notify('Erro ao gravar', toAppError(e).message);
      }
    } finally {
      setRecordingResult(false);
    }
  };

  // Grava resultado de vocabulário ou tópico gramatical (sempre com rating)
  const handleRateContent = async (rating: ReviewRating) => {
    if (!sessionId) return;
    const currentItem = items[currentIndex];
    if (!currentItem) return;

    setRecordingResult(true);
    try {
      if (currentItem.item_type === 'vocabulary') {
        await recordReviewResult(
          sessionId,
          { type: 'vocabulary', id: currentItem.vocabulary.id },
          { rating },
        );
      } else if (currentItem.item_type === 'grammar_topic') {
        await recordReviewResult(
          sessionId,
          { type: 'grammar_topic', id: currentItem.grammar_topic.id },
          { rating },
        );
      }
      await handleNext(currentIndex + 1, sessionId);
    } catch (e) {
      if (!handleSessionError(e, sessionId, currentIndex + 1)) {
        notify('Erro ao gravar', toAppError(e).message);
      }
    } finally {
      setRecordingResult(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <LoadingState variant="spinner" message="Preparando sua revisão..." />
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <ErrorState message={error.message} onRetry={initSession} />
      </SafeAreaView>
    );
  }

  // Tela de resumo final
  if (summary) {
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <ScrollView contentContainerStyle={styles.summaryContent}>
          <View style={styles.summaryBadge}>
            <Icon name="check" color="statusSuccess" size={layout.iconSize * 1.5} />
          </View>
          <Text variant="display" style={styles.centerText}>
            Revisão concluída
          </Text>
          <Text variant="bodyM" color="textSecondary" style={styles.centerText}>
            {`Você revisou ${summary.reviewed_count} ${summary.reviewed_count === 1 ? 'item' : 'itens'} hoje. As próximas revisões já foram agendadas.`}
          </Text>

          <View style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <Text variant="bodyM" color="textSecondary">
                Acertos
              </Text>
              <Text variant="label" color="statusSuccess">
                {summary.correct}
              </Text>
            </View>
            {/* "Para rever em breve": os erros voltam à fila (o backend agenda). */}
            <View style={styles.summaryRow}>
              <Text variant="bodyM" color="textSecondary">
                Para rever em breve
              </Text>
              <Text variant="label" color="statusWarning">
                {summary.incorrect}
              </Text>
            </View>
          </View>
        </ScrollView>
        <View style={styles.footer}>
          <Button label="Voltar ao início" onPress={() => router.replace('/')} />
          <Button label="Ver o curso" variant="secondary" onPress={() => router.replace('/course')} />
        </View>
      </SafeAreaView>
    );
  }

  // Fila vazia
  if (items.length === 0) {
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <EmptyState
          title="Nada para revisar hoje"
          message="Quando você errar ou concluir aulas, os itens aparecem aqui no melhor momento para rever."
          actionLabel="Voltar"
          onAction={() => router.replace('/practice')}
        />
      </SafeAreaView>
    );
  }

  const currentItem = items[currentIndex];
  // "3 de 8": o item atual conta na barra.
  const progressPercent = ((currentIndex + 1) / items.length) * 100;

  const ratingButtons = (onRate: (r: ReviewRating) => void) => (
    <View style={styles.ratingSection}>
      <Text variant="label" color="textSecondary" style={styles.centerText}>
        Como foi lembrar disso?
      </Text>
      <View style={styles.ratingRow}>
        {(['hard', 'good', 'easy'] as const).map((r) => (
          <View key={r} style={styles.ratingCol}>
            <Button
              label={r === 'hard' ? 'Difícil' : r === 'good' ? 'Bom' : 'Fácil'}
              variant="secondary"
              loading={recordingResult}
              onPress={() => onRate(r)}
            />
          </View>
        ))}
      </View>
    </View>
  );

  // Rodapé fixo: a ação do passo atual (Responder, Continuar ou Difícil/Bom/Fácil).
  let footer: ReactNode = null;
  if (currentItem.item_type === 'question') {
    if (answerResult === null && !needsRating) {
      footer = (
        <Button
          label="Responder"
          disabled={!canSubmit(currentItem.question)}
          loading={submittingAnswer}
          onPress={handleSubmitAnswer}
        />
      );
    } else if (needsRating || answerResult?.is_correct) {
      footer = ratingButtons(handleRateQuestionCorrect);
    } else {
      // Erro: só "Continuar", sem rating (o backend força a qualidade).
      footer = (
        <Button label="Continuar" loading={recordingResult} onPress={handleContinueQuestionIncorrect} />
      );
    }
  } else {
    footer = ratingButtons(handleRateContent);
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.topBar}>
        <View style={styles.titleRow}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Fechar revisão"
            onPress={confirmExit}
            style={({ pressed }) => [styles.closeButton, { opacity: pressed ? opacity.pressed : 1 }]}
          >
            <Icon name="close" color="textSecondary" size={layout.iconSize} />
          </Pressable>
          <Text variant="heading3" style={styles.titleText} accessibilityRole="header">
            Revisão
          </Text>
          <Text variant="label" color="textSecondary">
            {currentIndex + 1} de {items.length}
          </Text>
        </View>
        <ProgressBar
          value={progressPercent}
          accessibilityLabel={`Progresso: item ${currentIndex + 1} de ${items.length}`}
        />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Caso 1: Questão */}
        {currentItem.item_type === 'question' && (
          <View style={styles.itemWrapper}>
            <Text variant="heading1" style={styles.prompt}>
              {currentItem.question.prompt}
            </Text>

            <QuestionAnswerInput
              question={currentItem.question}
              draft={draft}
              onChange={setDraft}
              disabled={answerResult !== null || submittingAnswer || needsRating}
              result={answerResult}
            />

            {/* O backend pediu o botão de uma questão já respondida nesta sessão */}
            {!answerResult && needsRating && (
              <Text variant="bodyM" color="textSecondary">
                Você já respondeu esta questão nesta sessão.
              </Text>
            )}

            {/* Explicação devolvida pela RPC. O gabarito nunca vem para o app. */}
            {answerResult && <AnswerFeedback result={answerResult} />}
          </View>
        )}

        {/* Caso 2: Vocabulário */}
        {currentItem.item_type === 'vocabulary' && (
          <View style={styles.itemWrapper}>
            <View style={styles.contentCard}>
              <Text variant="caption" color="brandPrimaryLight">
                VOCABULÁRIO
              </Text>
              <Text variant="display">{currentItem.vocabulary.lemma}</Text>
              {currentItem.vocabulary.part_of_speech ? (
                <Text variant="label" color="textSecondary">
                  {currentItem.vocabulary.part_of_speech}
                </Text>
              ) : null}
              <Text variant="heading2" color="brandPrimaryLight">
                {currentItem.vocabulary.meaning_pt}
              </Text>

              {currentItem.vocabulary.examples.length > 0 && (
                <View style={styles.examplesList}>
                  <Text variant="label" color="textSecondary">
                    Exemplos:
                  </Text>
                  {currentItem.vocabulary.examples.map((ex) => (
                    <View key={ex.id} style={styles.exampleCard}>
                      <Text variant="bodyL">{ex.en}</Text>
                      <Text variant="bodyM" color="textSecondary">
                        {ex.pt}
                      </Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          </View>
        )}

        {/* Caso 3: Tópico Gramatical */}
        {currentItem.item_type === 'grammar_topic' && (
          <View style={styles.itemWrapper}>
            <View style={styles.contentCard}>
              <Text variant="caption" color="brandPrimaryLight">
                GRAMÁTICA
              </Text>
              <Text variant="display">{currentItem.grammar_topic.title}</Text>
              {currentItem.grammar_topic.summary ? (
                <Text variant="bodyL" color="textSecondary">
                  {currentItem.grammar_topic.summary}
                </Text>
              ) : null}
            </View>
          </View>
        )}
      </ScrollView>

      <View style={styles.footer}>{footer}</View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.bgBase,
  },
  topBar: {
    paddingHorizontal: layout.screenPaddingX,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
    gap: spacing.sm,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  titleText: {
    flex: 1,
  },
  footer: {
    padding: layout.screenPaddingX,
    gap: spacing.md,
  },
  closeButton: {
    minWidth: layout.minTouchTarget,
    minHeight: layout.minTouchTarget,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressContainer: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    padding: layout.screenPaddingX,
    gap: spacing.xl,
  },
  itemWrapper: {
    gap: spacing.xl,
  },
  prompt: {
    marginTop: spacing.sm,
  },
  actionContainer: {
    marginTop: spacing.md,
  },
  feedbackSection: {
    gap: spacing.lg,
  },
  feedbackHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  ratingSection: {
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  ratingRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  ratingCol: {
    flex: 1,
  },
  contentCard: {
    backgroundColor: colors.bgSurface,
    borderColor: colors.borderDefault,
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: spacing.xl,
    gap: spacing.md,
  },
  examplesList: {
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  exampleCard: {
    backgroundColor: colors.bgElevated,
    borderRadius: radius.md,
    padding: spacing.md,
    gap: spacing.xs,
  },
  summaryContent: {
    flexGrow: 1,
    padding: layout.screenPaddingX,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.lg,
  },
  summaryBadge: {
    width: layout.avatarSize,
    height: layout.avatarSize,
    borderRadius: radius.full,
    backgroundColor: colors.statusSuccessSubtle,
    borderWidth: 1,
    borderColor: colors.statusSuccess,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  centerText: {
    textAlign: 'center',
  },
  summaryCard: {
    alignSelf: 'stretch',
    backgroundColor: colors.bgSurface,
    borderColor: colors.borderDefault,
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: spacing.xl,
    gap: spacing.md,
    marginVertical: spacing.md,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  difficultyBreakdown: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  difficultyItem: {
    alignItems: 'center',
    gap: spacing.xs,
  },
  divider: {
    height: 1,
    backgroundColor: colors.borderDefault,
  },
  summaryAction: {
    alignSelf: 'stretch',
    marginTop: spacing.md,
  },
});
