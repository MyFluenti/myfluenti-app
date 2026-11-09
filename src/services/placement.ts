import type { AnswerPayload, PlacementResult } from '@/types/contract';

import { rpc, rpcVoid } from './rpc';

/** Inicia ou retoma o nivelamento. Devolve o id da tentativa. */
export function start(testId?: string): Promise<string> {
  return rpc<string>('start_placement_attempt', testId ? { p_test_id: testId } : {});
}

/** Grava a resposta. O nivelamento não devolve correção durante o teste. */
export function submitAnswer(
  attemptId: string,
  questionId: string,
  answer: AnswerPayload,
): Promise<void> {
  return rpcVoid('submit_placement_answer', {
    p_attempt_id: attemptId,
    p_question_id: questionId,
    p_answer: answer,
  });
}

export function finish(attemptId: string): Promise<PlacementResult> {
  return rpc<PlacementResult>('finish_placement_attempt', { p_attempt_id: attemptId });
}

/** O backend recusa nível acima do recomendado. */
export function selectStartingLevel(levelId: string, placementAttemptId?: string): Promise<void> {
  return rpcVoid('select_starting_level', {
    p_level_id: levelId,
    ...(placementAttemptId ? { p_placement_attempt_id: placementAttemptId } : {}),
  });
}
