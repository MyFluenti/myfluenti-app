import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import { useReducedMotion } from 'react-native-reanimated';

import { introModeFor, markSeen, readSeen, type IntroMode } from './introMode';

/**
 * Decide como as Boas-vindas abrem (animação, fade ou estado final). A animação toca toda
 * vez que a tela aparece até a pessoa entrar ou criar conta pela primeira vez no aparelho
 * (decisão do Gabriel, 23/11): quem grava a flag é `markWelcomeAnimationSeen`, chamado
 * quando há sessão, e não o fim da animação.
 */
export function useWelcomeIntro(): { mode: IntroMode } {
  const reduceMotion = useReducedMotion();
  const [seen, setSeen] = useState<boolean | null>(null);
  // O modo é decidido uma vez por abertura da tela.
  const [mode, setMode] = useState<IntroMode>('loading');

  useEffect(() => {
    let active = true;
    readSeen(AsyncStorage).then((value) => {
      if (active) setSeen(value);
    });
    return () => {
      active = false;
    };
  }, []);

  if (mode === 'loading' && seen !== null) setMode(introModeFor(seen, reduceMotion));

  return { mode };
}

/** Grava a flag: a partir daqui, as Boas-vindas abrem paradas. Chamado com sessão aberta. */
export function markWelcomeAnimationSeen(): Promise<void> {
  return markSeen(AsyncStorage);
}
