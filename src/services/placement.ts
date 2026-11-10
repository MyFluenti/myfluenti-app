import type {
  AnswerPayload,
  PlacementAttemptRow,
  PlacementItems,
  PlacementResult,
} from '@/types/contract';

import { assertOk } from './errors';
import { rpc, rpcVoid } from './rpc';
import { supabase } from './supabase';

/** Inicia ou retoma o nivelamento. Devolve o id da tentativa. */
export function start(testId?: string): Promise<string> {
  return rpc<string>('start_placement_attempt', testId ? { p_test_id: testId } : {});
}

/**
 * Itens da tentativa em andamento, na ordem de `position`, com `answered`.
 * Tentativa encerrada: `55000 attempt_closed`.
 */
export function getItems(attemptId: string): Promise<PlacementItems> {
  return rpc<PlacementItems>('get_placement_items', { p_attempt_id: attemptId });
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

/**
 * Lê a própria tentativa (RLS: só as do aluno). Serve para mostrar o resultado
 * de novo, sem recalcular nada no app. Devolve null se não existir.
 */
export async function getAttempt(attemptId: string): Promise<PlacementAttemptRow | null> {
  const result = await supabase
    .from('user_placement_attempts')
    .select('id, status, score_pct, recommended_level_id, competency_breakdown')
    .eq('id', attemptId)
    .maybeSingle();
  assertOk(result);
  return result.data;
}

/** O backend recusa nível acima do recomendado. */
export function selectStartingLevel(levelId: string, placementAttemptId?: string): Promise<void> {
  return rpcVoid('select_starting_level', {
    p_level_id: levelId,
    ...(placementAttemptId ? { p_placement_attempt_id: placementAttemptId } : {}),
  });
}

