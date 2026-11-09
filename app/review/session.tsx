import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
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
} from '@/components';
import type { AnswerOptionState } from '@/components/AnswerOption';
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

export default function ReviewSessionScreen() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<AppError | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [items, setItems] = useState<ReviewQueueItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Estado da questão atual
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [submittingAnswer, setSubmittingAnswer] = useState(false);
  const [answerResult, setAnswerResult] = useState<ReviewAnswerResult | null>(null);
  const [recordingResult, setRecordingResult] = useState(false);

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
      setAnswerResult(null);
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

  const confirmExit = () => {
    if (summary) {
      router.replace('/practice');
      return;
    }
    Alert.alert(
      'Sair da revisão?',
      'Os itens que você já avaliou foram salvos.',
      [
        { text: 'Continuar revisando', style: 'cancel' },
        {
          text: 'Sair',
          style: 'destructive',
          onPress: () => router.replace('/practice'),
        },
      ],
    );
  };

  const handleNext = useCallback(
    async (nextIdx: number, sid: string) => {
      setSelectedOptionId(null);
      setAnswerResult(null);

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

  // Envia a resposta da questão
  const handleSubmitAnswer = async () => {
    if (!sessionId || !selectedOptionId) return;
    const currentItem = items[currentIndex];
    if (currentItem?.item_type !== 'question') return;

    setSubmittingAnswer(true);
    try {
      const res = await submitReviewAnswer(sessionId, currentItem.question.id, {
        option_id: selectedOptionId,
      });
      setAnswerResult(res);
    } catch (e) {
      Alert.alert('Erro ao enviar', toAppError(e).message);
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
      Alert.alert('Erro ao gravar', toAppError(e).message);
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
      Alert.alert('Erro ao gravar', toAppError(e).message);
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
      Alert.alert('Erro ao gravar', toAppError(e).message);
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

            <View style={styles.optionsList}>
              {currentItem.question.options
                .slice()
                .sort((a, b) => a.position - b.position)
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
                      disabled={answerResult !== null || submittingAnswer}
                      onPress={() => setSelectedOptionId(opt.id)}
                    />
                  );
                })}
            </View>

            {/* Ação antes da resposta: botão Responder */}
            {!answerResult && (
              <View style={styles.actionContainer}>
                <Button
                  label="Responder"
                  disabled={!selectedOptionId}
                  loading={submittingAnswer}
                  onPress={handleSubmitAnswer}
                />
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
                {answerResult.is_correct ? (
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
    width: 64,
    height: 64,
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
