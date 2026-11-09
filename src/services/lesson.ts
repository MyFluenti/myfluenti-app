import type { AnswerPayload, LessonAnswerResult, LessonFinishResult } from '@/types/contract';

import { rpc, rpcVoid } from './rpc';

/** Abre ou retoma a tentativa. Devolve o id. Lança `module_locked` / `premium_required`. */
export function startAttempt(lessonId: string): Promise<string> {
  return rpc<string>('start_lesson_attempt', { p_lesson_id: lessonId });
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
