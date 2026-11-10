import {
  EXIT_COPY,
  EXIT_GUARD_INITIAL,
  exitGuardActive,
  exitGuardReducer,
  type ExitGuardState,
} from '../exitGuard';

// O ✕ chama router.back(); o voltar do Android, o gesto do iOS e o voltar do navegador
// também removem a tela. Todos chegam como o mesmo evento bloqueado ('blocked').
const blocked = (state: ExitGuardState, repeat = jest.fn()) =>
  exitGuardReducer(state, { type: 'blocked', repeat });

describe('exitGuardReducer', () => {
  it('opens the sheet when leaving is blocked (✕, hardware back or gesture)', () => {
    const repeat = jest.fn();
    const state = blocked(EXIT_GUARD_INITIAL, repeat);
    expect(state.pending).toBe(repeat);
    expect(repeat).not.toHaveBeenCalled();
  });

  it('keeps a single sheet when a second exit arrives while it is open', () => {
    const first = jest.fn();
    const second = jest.fn();
    const state = blocked(blocked(EXIT_GUARD_INITIAL, first), second);
    expect(state.pending).toBe(first);
  });

  it('"Continuar" closes the sheet and keeps the guard on', () => {
    const state = exitGuardReducer(blocked(EXIT_GUARD_INITIAL), { type: 'stay' });
    expect(state).toEqual(EXIT_GUARD_INITIAL);
    expect(exitGuardActive(true, state)).toBe(true);
  });

  it('"Sair" closes the sheet and turns the guard off so the blocked navigation can run', () => {
    const state = exitGuardReducer(blocked(EXIT_GUARD_INITIAL), { type: 'leave' });
    expect(state).toEqual({ pending: null, leaving: true });
    expect(exitGuardActive(true, state)).toBe(false);
  });

  it('allow (going to the result) turns the guard off without asking', () => {
    const state = exitGuardReducer(EXIT_GUARD_INITIAL, { type: 'allow' });
    expect(state.pending).toBeNull();
    expect(exitGuardActive(true, state)).toBe(false);
  });

  it('ignores blocked exits after leaving was chosen', () => {
    const left = exitGuardReducer(EXIT_GUARD_INITIAL, { type: 'leave' });
    expect(blocked(left)).toBe(left);
  });

  it('is inactive when the screen does not ask for it (reading sections, read-only)', () => {
    expect(exitGuardActive(false, EXIT_GUARD_INITIAL)).toBe(false);
  });
});

describe('EXIT_COPY', () => {
  it('uses the approved texts', () => {
    expect(EXIT_COPY.test.title).toBe('Sair do teste?');
    expect(EXIT_COPY.test.primary).toBe('Continuar teste');
    expect(EXIT_COPY.lesson.title).toBe('Sair da aula?');
    expect(EXIT_COPY.lesson.message).toContain('O que você já respondeu fica salvo.');
    expect(EXIT_COPY.lesson.secondary).toBe('Sair');
  });
});
