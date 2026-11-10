/**
 * Estado da confirmação de saída (folha "Sair do teste?"/"Sair da aula?"). Puro, para
 * testar sem tela. O ✕, o voltar do Android, o gesto do iOS e o voltar do navegador
 * chegam todos como o mesmo evento: a navegação bloqueada pelo `usePreventRemove`.
 */
export type ExitGuardState = {
  /** Navegação bloqueada esperando a resposta do aluno (null = folha fechada). */
  pending: (() => void) | null;
  /** O aluno escolheu sair (ou a tela liberou a saída): a proteção fica desligada. */
  leaving: boolean;
};

export type ExitGuardAction =
  | { type: 'blocked'; repeat: () => void }
  | { type: 'stay' }
  | { type: 'leave' }
  | { type: 'allow' };

export const EXIT_GUARD_INITIAL: ExitGuardState = { pending: null, leaving: false };

export function exitGuardReducer(state: ExitGuardState, action: ExitGuardAction): ExitGuardState {
  switch (action.type) {
    case 'blocked':
      // Já tem folha aberta (toque duplo, ✕ + voltar): mantém a primeira, uma folha só.
      if (state.pending || state.leaving) return state;
      return { ...state, pending: action.repeat };
    case 'stay':
      return { ...state, pending: null };
    case 'leave':
      return { pending: null, leaving: true };
    case 'allow':
      return { pending: null, leaving: true };
    default:
      return state;
  }
}

/** A proteção vale só enquanto a tela pede e o aluno ainda não escolheu sair. */
export function exitGuardActive(enabled: boolean, state: ExitGuardState): boolean {
  return enabled && !state.leaving;
}

export const EXIT_COPY = {
  test: {
    title: 'Sair do teste?',
    message:
      'A resposta que você ainda não enviou nesta pergunta será perdida. As perguntas já respondidas ficam salvas.',
    primary: 'Continuar teste',
    secondary: 'Sair',
  },
  lesson: {
    title: 'Sair da aula?',
    message:
      'A resposta que você ainda não enviou nesta pergunta será perdida. O que você já respondeu fica salvo.',
    primary: 'Continuar aula',
    secondary: 'Sair',
  },
} as const;
