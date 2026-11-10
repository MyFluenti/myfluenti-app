// Regras de entrada de resposta, compartilhadas por revisão, nivelamento e aula.
// Só escolhem o componente e montam o payload. Quem corrige é sempre o backend.

import { joinTokens } from '@/components/WordOrderAnswer';
import type { AnswerPayload } from '@/types/contract';

/** O mínimo de uma questão que a tela precisa para montar a resposta. */
export type AnswerableQuestion = {
  question_type: string;
  prompt_data: unknown;
  options: { id: string; text: string; position: number }[];
};

export type AnswerMode = 'options' | 'text' | 'word_order';

/** Rascunho da resposta do aluno, antes de enviar. */
export type AnswerDraft = {
  optionId: string | null;
  text: string;
  tokens: string[];
};

export const EMPTY_DRAFT: AnswerDraft = { optionId: null, text: '', tokens: [] };

/** Tokens de word_order exatamente como vieram do backend (sem reordenar). */
export function wordOrderTokens(q: Pick<AnswerableQuestion, 'prompt_data'>): string[] | null {
  const data = q.prompt_data;
  const tokens =
    typeof data === 'object' && data !== null && !Array.isArray(data)
      ? (data as { tokens?: unknown }).tokens
      : undefined;
  return Array.isArray(tokens) && tokens.length > 0 && tokens.every((t) => typeof t === 'string')
    ? (tokens as string[])
    : null;
}

/** Escolhe o componente de entrada pelo tipo da questão. */
export function answerModeOf(q: AnswerableQuestion): AnswerMode {
  if (q.question_type === 'word_order' && wordOrderTokens(q)) return 'word_order';
  if (q.question_type === 'fill_blank' || q.question_type === 'translation') return 'text';
  // multiple_choice, error_identification, error_correction e tipos desconhecidos:
  // opções se houver, senão campo de texto.
  return q.options.length > 0 ? 'options' : 'text';
}

/** "Responder" só habilita com resposta: opção escolhida, texto não vazio ou 1+ token. */
export function canSubmitDraft(q: AnswerableQuestion, draft: AnswerDraft): boolean {
  return toAnswerPayload(q, draft) !== null;
}

/**
 * Monta o payload do contrato: `{ option_id }` para opções e `{ text }` nos demais.
 * Devolve null se o rascunho estiver vazio. O texto só perde espaços nas pontas;
 * a normalização é do backend.
 */
export function toAnswerPayload(q: AnswerableQuestion, draft: AnswerDraft): AnswerPayload | null {
  const mode = answerModeOf(q);
  if (mode === 'options') {
    return draft.optionId && q.options.some((o) => o.id === draft.optionId)
      ? { option_id: draft.optionId }
      : null;
  }
  if (mode === 'word_order') {
    return draft.tokens.length > 0 ? { text: joinTokens(draft.tokens) } : null;
  }
  const text = draft.text.trim();
  return text.length > 0 ? { text } : null;
}
