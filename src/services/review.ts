import type {
  AnswerPayload,
  ReviewAnswerResult,
  ReviewQueue,
  ReviewRecordResult,
  ReviewSummary,
} from '@/types/contract';
import { getDeviceTimezone } from '@/utils/timezone';

import { rpc } from './rpc';

export type ReviewRating = 'hard' | 'good' | 'easy';

export function getReviewQueue(limit?: number): Promise<ReviewQueue> {
  return rpc<ReviewQueue>('get_review_queue', {
    p_timezone: getDeviceTimezone(),
    ...(limit !== undefined && { p_limit: limit }),
  });
}

/** Abre a sessão de revisão ou devolve a aberta. */
export function startReviewSession(): Promise<string> {
  return rpc<string>('start_review_session', {});
}

export function submitReviewAnswer(
  sessionId: string,
  questionId: string,
  answer: AnswerPayload,
): Promise<ReviewAnswerResult> {
  return rpc<ReviewAnswerResult>('submit_review_answer', {
    p_session_id: sessionId,
    p_question_id: questionId,
    p_answer: answer,
    p_timezone: getDeviceTimezone(),
  });
}

export function finishReviewSession(sessionId: string): Promise<ReviewSummary> {
  return rpc<ReviewSummary>('finish_review_session', {
    p_session_id: sessionId,
    p_timezone: getDeviceTimezone(),
  });
}

/** Questão: acerto exige o botão; erro não tem botão (o backend força a qualidade). */
export type QuestionOutcome =
  | { answered: 'correct'; rating: ReviewRating }
  | { answered: 'incorrect' };

/** Vocabulário e tópico sempre exigem o botão. */
export type ContentOutcome = { rating: ReviewRating };

/**
 * Grava o resultado de um item da sessão. Os tipos obrigam a regra do contrato:
 * em questão errada o `p_rating` NÃO é enviado (a chave nem existe). O app só
 * repassa o botão; o backend decide a nota e o reagendamento.
 */
export function recordReviewResult(
  sessionId: string,
  item: { type: 'question'; id: string },
  outcome: QuestionOutcome,
): Promise<ReviewRecordResult>;
export function recordReviewResult(
  sessionId: string,
  item: { type: 'vocabulary' | 'grammar_topic'; id: string },
  outcome: ContentOutcome,
): Promise<ReviewRecordResult>;
export function recordReviewResult(
  sessionId: string,
  item: { type: 'question' | 'vocabulary' | 'grammar_topic'; id: string },
  outcome: QuestionOutcome | ContentOutcome,
): Promise<ReviewRecordResult> {
  const target =
    item.type === 'question'
      ? { p_question_id: item.id }
      : item.type === 'vocabulary'
        ? { p_vocabulary_id: item.id }
        : { p_grammar_topic_id: item.id };

  // Decide pela variante, não pela presença de `rating`: no erro nunca envia p_rating.
  const rating =
    'answered' in outcome && outcome.answered === 'incorrect'
      ? {}
      : { p_rating: (outcome as { rating: ReviewRating }).rating };

  return rpc<ReviewRecordResult>('record_review_result_v2', {
    p_session_id: sessionId,
    ...target,
    ...rating,
  });
}
