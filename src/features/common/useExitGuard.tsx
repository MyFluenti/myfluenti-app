import { usePreventRemove } from 'expo-router';
import { useCallback, useReducer, useRef } from 'react';

import { ConfirmSheet } from '@/components/ConfirmSheet';

import {
  EXIT_COPY,
  EXIT_GUARD_INITIAL,
  exitGuardActive,
  exitGuardReducer,
} from './exitGuard';

/**
 * Pede confirmação em qualquer saída da tela enquanto `enabled` (✕, voltar do Android,
 * gesto do iOS, voltar do navegador). "Sair" só descarta o que não foi enviado: nada
 * chama RPC aqui. `allowLeave` libera a saída sem perguntar (ex.: ir para o resultado).
 */
export function useExitGuard(enabled: boolean, kind: keyof typeof EXIT_COPY) {
  const [state, dispatch] = useReducer(exitGuardReducer, EXIT_GUARD_INITIAL);
  // A navegação bloqueada fica num ref também: "Sair" a repete uma vez só, mesmo com
  // toque duplo antes de a tela renderizar de novo.
  const repeatRef = useRef<(() => void) | null>(null);
  const disablePrevention = usePreventRemove(exitGuardActive(enabled, state), ({ repeat }) => {
    if (!repeatRef.current) repeatRef.current = repeat;
    dispatch({ type: 'blocked', repeat });
  });

  const stay = () => {
    repeatRef.current = null;
    dispatch({ type: 'stay' });
  };

  const leave = () => {
    const repeat = repeatRef.current;
    repeatRef.current = null;
    dispatch({ type: 'leave' });
    repeat?.();
  };

  const allowLeave = useCallback(() => {
    dispatch({ type: 'allow' });
    disablePrevention();
  }, [disablePrevention]);

  const copy = EXIT_COPY[kind];
  const sheet = (
    <ConfirmSheet
      visible={state.pending !== null}
      title={copy.title}
      message={copy.message}
      primaryLabel={copy.primary}
      secondaryLabel={copy.secondary}
      onPrimary={stay}
      onSecondary={leave}
    />
  );

  return { sheet, allowLeave };
}
