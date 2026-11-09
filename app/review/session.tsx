import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  AnswerOption,
  Button,
  EmptyState,
  ErrorState,
  Icon,
  LoadingState,
  ProgressBar,
  Text,
  TextAnswerInput,
  WordOrderAnswer,
  joinTokens,
} from '@/components';
import type { AnswerOptionState } from '@/components/AnswerOption';
import { confirm, notify } from '@/features/common/dialogs';
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
  AnswerPayload,
  ReviewAnswerResult,
  ReviewQueueItem,
  ReviewSummary,
} from '@/types/contract';

type AnswerMode = 'options' | 'text' | 'word_order';

type ReviewQuestion = Extract<ReviewQueueItem, { item_type: 'question' }>['question'];

/** Tokens de word_order exatamente como vieram do backend (sem reordenar). */
function wordOrderTokens(q: ReviewQuestion): string[] | null {
  const tokens = (q.prompt_data as { tokens?: unknown } | null | undefined)?.tokens;
  return Array.isArray(tokens) && tokens.length > 0 && tokens.every((t) => typeof t === 'string')
    ? (tokens as string[])
    : null;
}

/** Só escolhe o componente de entrada pelo tipo; quem corrige é o backend. */
function answerModeOf(q: ReviewQuestion): AnswerMode {
  if (q.question_type === 'word_order' && wordOrderTokens(q)) return 'word_order';
  if (q.question_type === 'fill_blank' || q.question_type === 'translation') return 'text';
  // multiple_choice, error_identification, error_correction e tipos desconhecidos:
  // opções se houver, senão campo de texto.
  return q.options.length > 0 ? 'options' : 'text';
}

export default function ReviewSessionScreen() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<AppError | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [items, setItems] = useState<ReviewQueueItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Estado da questão atual
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [textAnswer, setTextAnswer] = useState('');
  const [tokenAnswer, setTokenAnswer] = useState<string[]>([]);
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
      setSelectedOptionId(null);
      setTextAnswer('');
      setTokenAnswer([]);
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
      setSelectedOptionId(null);
      setTextAnswer('');
      setTokenAnswer([]);
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
  const canSubmit = (q: ReviewQuestion): boolean => {
    const mode = answerModeOf(q);
    if (mode === 'options') return selectedOptionId !== null;
    if (mode === 'word_order') return tokenAnswer.length >= 1;
    return textAnswer.trim().length > 0;
  };

  const handleSubmitAnswer = async () => {
    const currentItem = items[currentIndex];
    if (!sessionId || currentItem?.item_type !== 'question') return;

    const mode = answerModeOf(currentItem.question);
    let payload: AnswerPayload;
    if (mode === 'options') {
      if (!selectedOptionId) return;
      payload = { option_id: selectedOptionId };
    } else if (mode === 'word_order') {
      if (tokenAnswer.length === 0) return;
      payload = { text: joinTokens(tokenAnswer) };
    } else {
      if (textAnswer.trim().length === 0) return;
      payload = { text: textAnswer.trim() };
    }

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
            Revisão concluída!
          </Text>
          <Text variant="bodyL" color="textSecondary" style={styles.centerText}>
            Você revisou todos os itens desta sessão.
          </Text>

          <View style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <Text variant="bodyM" color="textSecondary">
                Itens revisados
              </Text>
              <Text variant="heading2">{summary.reviewed_count}</Text>
            </View>

            {(summary.correct > 0 || summary.incorrect > 0) && (
              <>
                <View style={styles.divider} />
                <View style={styles.summaryRow}>
                  <Text variant="bodyM" color="statusSuccess">
                    Acertos
                  </Text>
                  <Text variant="heading3" color="statusSuccess">
                    {summary.correct}
                  </Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text variant="bodyM" color="statusError">
                    Erros
                  </Text>
                  <Text variant="heading3" color="statusError">
                    {summary.incorrect}
                  </Text>
                </View>
              </>
            )}

            <View style={styles.divider} />
            <View style={styles.difficultyBreakdown}>
              <View style={styles.difficultyItem}>
                <Text variant="caption" color="textSecondary">
                  Fácil
                </Text>
                <Text variant="heading3">{summary.easy}</Text>
              </View>
              <View style={styles.difficultyItem}>
                <Text variant="caption" color="textSecondary">
                  Bom
                </Text>
                <Text variant="heading3">{summary.good}</Text>
              </View>
              <View style={styles.difficultyItem}>
                <Text variant="caption" color="textSecondary">
                  Difícil
                </Text>
                <Text variant="heading3">{summary.hard}</Text>
              </View>
            </View>
          </View>

          <View style={styles.summaryAction}>
            <Button
              label="Voltar para a Revisão"
              onPress={() => router.replace('/practice')}
            />
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // Fila vazia
  if (items.length === 0) {
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <EmptyState
          title="Nenhum item pendente"
          message="Você não tem nenhum item para revisar no momento."
          actionLabel="Voltar"
          onAction={() => router.replace('/practice')}
        />
      </SafeAreaView>
    );
  }

  const currentItem = items[currentIndex];
  const progressPercent = ((currentIndex) / items.length) * 100;

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      {/* Barra superior de navegação e progresso */}
      <View style={styles.topBar}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Fechar revisão"
          onPress={confirmExit}
          style={({ pressed }) => [styles.closeButton, { opacity: pressed ? opacity.pressed : 1 }]}
        >
          <Icon name="close" color="textSecondary" size={layout.iconSize} />
        </Pressable>

        <View style={styles.progressContainer}>
          <ProgressBar
            value={progressPercent}
            accessibilityLabel={`Progresso: item ${currentIndex + 1} de ${items.length}`}
          />
        </View>

        <Text variant="label" color="textSecondary">
          {currentIndex + 1}/{items.length}
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Caso 1: Questão */}
        {currentItem.item_type === 'question' && (
          <View style={styles.itemWrapper}>
            <Text variant="heading2" style={styles.prompt}>
              {currentItem.question.prompt}
            </Text>

            {(() => {
              const q = currentItem.question;
              const mode = answerModeOf(q);
              const locked = answerResult !== null || submittingAnswer || needsRating;

              if (mode === 'word_order') {
                return (
                  <WordOrderAnswer
                    tokens={wordOrderTokens(q) ?? []}
                    value={tokenAnswer}
                    onChange={setTokenAnswer}
                    disabled={locked}
                  />
                );
              }

              if (mode === 'text') {
                return (
                  <TextAnswerInput
                    value={textAnswer}
                    onChangeText={setTextAnswer}
                    disabled={locked}
                    questionType={q.question_type}
                    promptData={q.prompt_data}
                  />
                );
              }

              return (
                <View style={styles.optionsList}>
                  {q.options
                    .slice()
                    .sort((x, y) => x.position - y.position)
                    .map((opt) => {
                      let optState: AnswerOptionState = 'normal';
                      const isSelected = selectedOptionId === opt.id;

                      if (answerResult) {
                        if (isSelected) {
                          optState = answerResult.is_correct ? 'correct' : 'incorrect';
                        }
                      } else if (isSelected) {
                        optState = 'selected';
                      }

                      return (
                        <AnswerOption
                          key={opt.id}
                          label={opt.text}
                          state={optState}
                          disabled={locked}
                          onPress={() => setSelectedOptionId(opt.id)}
                        />
                      );
                    })}
                </View>
              );
            })()}

            {/* Ação antes da resposta: botão Responder */}
            {!answerResult && !needsRating && (
              <View style={styles.actionContainer}>
                <Button
                  label="Responder"
                  disabled={!canSubmit(currentItem.question)}
                  loading={submittingAnswer}
                  onPress={handleSubmitAnswer}
                />
              </View>
            )}

            {/* O backend pediu o botão de uma questão já respondida nesta sessão */}
            {!answerResult && needsRating && (
              <View style={styles.ratingSection}>
                <Text variant="bodyM" color="textSecondary">
                  Você já respondeu esta questão nesta sessão.
                </Text>
                <Text variant="heading3">Como foi lembrar disso?</Text>
                <View style={styles.ratingRow}>
                  {(['hard', 'good', 'easy'] as const).map((r) => (
                    <View key={r} style={styles.ratingCol}>
                      <Button
                        label={r === 'hard' ? 'Difícil' : r === 'good' ? 'Bom' : 'Fácil'}
                        variant="secondary"
                        loading={recordingResult}
                        onPress={() => handleRateQuestionCorrect(r)}
                      />
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Feedback e avaliação pós-resposta */}
            {answerResult && (
              <View style={styles.feedbackSection}>
                <View
                  style={[
                    styles.feedbackCard,
                    answerResult.is_correct
                      ? styles.feedbackSuccess
                      : styles.feedbackError,
                  ]}
                >
                  <View style={styles.feedbackHeader}>
                    <Icon
                      name={answerResult.is_correct ? 'check' : 'close'}
                      color={answerResult.is_correct ? 'statusSuccess' : 'statusError'}
                      size={layout.iconSize}
                    />
                    <Text
                      variant="heading3"
                      color={answerResult.is_correct ? 'statusSuccess' : 'statusError'}
                    >
                      {answerResult.is_correct ? 'Correto!' : 'Incorreto'}
                    </Text>
                  </View>
                  {answerResult.explanation ? (
                    <Text variant="bodyM" color="textPrimary">
                      {answerResult.explanation}
                    </Text>
                  ) : null}
                </View>

                {/* Acerto: 3 botões (Difícil, Bom, Fácil) */}
                {answerResult.is_correct || needsRating ? (
                  <View style={styles.ratingSection}>
                    <Text variant="heading3">Como foi lembrar disso?</Text>
                    <View style={styles.ratingRow}>
                      <View style={styles.ratingCol}>
                        <Button
                          label="Difícil"
                          variant="secondary"
                          loading={recordingResult}
                          onPress={() => handleRateQuestionCorrect('hard')}
                        />
                      </View>
                      <View style={styles.ratingCol}>
                        <Button
                          label="Bom"
                          variant="secondary"
                          loading={recordingResult}
                          onPress={() => handleRateQuestionCorrect('good')}
                        />
                      </View>
                      <View style={styles.ratingCol}>
                        <Button
                          label="Fácil"
                          variant="secondary"
                          loading={recordingResult}
                          onPress={() => handleRateQuestionCorrect('easy')}
                        />
                      </View>
                    </View>
                  </View>
                ) : (
                  /* Erro: botão Continuar (sem p_rating) */
                  <View style={styles.actionContainer}>
                    <Button
                      label="Continuar"
                      loading={recordingResult}
                      onPress={handleContinueQuestionIncorrect}
                    />
                  </View>
                )}
              </View>
            )}
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

            <View style={styles.ratingSection}>
              <Text variant="heading3">Como foi lembrar disso?</Text>
              <View style={styles.ratingRow}>
                <View style={styles.ratingCol}>
                  <Button
                    label="Difícil"
                    variant="secondary"
                    loading={recordingResult}
                    onPress={() => handleRateContent('hard')}
                  />
                </View>
                <View style={styles.ratingCol}>
                  <Button
                    label="Bom"
                    variant="secondary"
                    loading={recordingResult}
                    onPress={() => handleRateContent('good')}
                  />
                </View>
                <View style={styles.ratingCol}>
                  <Button
                    label="Fácil"
                    variant="secondary"
                    loading={recordingResult}
                    onPress={() => handleRateContent('easy')}
                  />
                </View>
              </View>
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

            <View style={styles.ratingSection}>
              <Text variant="heading3">Como foi lembrar disso?</Text>
              <View style={styles.ratingRow}>
                <View style={styles.ratingCol}>
                  <Button
                    label="Difícil"
                    variant="secondary"
                    loading={recordingResult}
                    onPress={() => handleRateContent('hard')}
                  />
                </View>
                <View style={styles.ratingCol}>
                  <Button
                    label="Bom"
                    variant="secondary"
                    loading={recordingResult}
                    onPress={() => handleRateContent('good')}
                  />
                </View>
                <View style={styles.ratingCol}>
                  <Button
                    label="Fácil"
                    variant="secondary"
                    loading={recordingResult}
                    onPress={() => handleRateContent('easy')}
                  />
                </View>
              </View>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.bgBase,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: layout.screenPaddingX,
    paddingVertical: spacing.md,
    gap: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderDefault,
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
  optionsList: {
    gap: spacing.md,
  },
  actionContainer: {
    marginTop: spacing.md,
  },
  feedbackSection: {
    gap: spacing.lg,
  },
  feedbackCard: {
    borderWidth: 1,
    borderRadius: radius.md,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  feedbackSuccess: {
    backgroundColor: colors.statusSuccessSubtle,
    borderColor: colors.statusSuccess,
  },
  feedbackError: {
    backgroundColor: colors.statusErrorSubtle,
    borderColor: colors.statusError,
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
