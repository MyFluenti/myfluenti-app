import type {
  AnswerPayload,
  LessonAnswerResult,
  LessonContent,
  LessonFinishResult,
} from '@/types/contract';

import { unwrapCount } from './errors';
import { rpc, rpcVoid } from './rpc';
import { supabase } from './supabase';

/** Abre ou retoma a tentativa. Devolve o id. Lança `module_locked` / `premium_required`. */
export function startAttempt(lessonId: string): Promise<string> {
  return rpc<string>('start_lesson_attempt', { p_lesson_id: lessonId });
}

/**
 * Conteúdo da tentativa (seções, exercícios, respostas já dadas e progresso), na versão
 * estudada. Retomar é chamar de novo. Lança `attempt_not_found`, `module_locked` ou
 * `premium_required`.
 */
export function getContent(attemptId: string): Promise<LessonContent> {
  return rpc<LessonContent>('get_lesson_content', { p_attempt_id: attemptId });
}

/** Quantas tentativas o aluno já abriu nesta aula (todas as versões). Só para exibir. */
export async function countAttempts(lessonId: string): Promise<number> {
  return unwrapCount(
    await supabase
      .from('user_lesson_attempts')
      .select('id, lesson_versions!inner(lesson_id)', { count: 'exact', head: true })
      .eq('lesson_versions.lesson_id', lessonId),
  );
}

export function recordSectionView(sectionId: string): Promise<void> {
  return rpcVoid('record_section_view', { p_section_id: sectionId });
}

/** A correção e a explicação vêm da RPC; o app não mostra gabarito antes dela. */
export function submitAnswer(
  attemptId: string,
  questionId: string,
  answer: AnswerPayload,
): Promise<LessonAnswerResult> {
  return rpc<LessonAnswerResult>('submit_lesson_answer', {
    p_attempt_id: attemptId,
    p_question_id: questionId,
    p_answer: answer,
  });
}

export function finishAttempt(attemptId: string): Promise<LessonFinishResult> {
  return rpc<LessonFinishResult>('finish_lesson_attempt', { p_attempt_id: attemptId });
}
