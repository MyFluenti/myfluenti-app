import type { PlacementAnswerResult } from '@/types/contract';

/** Quanto tempo o aviso fica na tela antes de ir para a próxima pergunta. */
export const PLACEMENT_FEEDBACK_MS = 900;

/** Com leitor de tela ligado, o aviso fica mais tempo (dá tempo de ouvir antes de mudar). */
export const PLACEMENT_FEEDBACK_SCREEN_READER_MS = 2000;

export type PlacementFeedback = {
  tone: 'success' | 'error';
  /** Texto curto mostrado na tela e anunciado ao leitor de tela. */
  text: string;
};

/**
 * Aviso depois de responder no nivelamento (ADR 0005). Só mostra o que a RPC devolveu:
 * "Certo!" em verde no acerto; "Incorreto" em vermelho no erro (decisão do Gabriel,
 * 17/11, igual à aula e à revisão), sem a resposta certa. `null` (backend sem o acerto)
 * não mostra nada.
 */
export function placementFeedback(result: PlacementAnswerResult | null): PlacementFeedback | null {
  if (!result) return null;
  return result.is_correct
    ? { tone: 'success', text: 'Certo!' }
    : { tone: 'error', text: 'Incorreto' };
}

/**
 * Ponto único para tocar um som no acerto. Sem som por enquanto (sem dependência nova):
 * quando houver, ele entra aqui e respeita as preferências do aparelho.
 */
export function onCorrectPlacementAnswer(): void {
  // Intencionalmente vazio.
}
