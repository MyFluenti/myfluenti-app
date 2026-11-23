import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useReducedMotion } from 'react-native-reanimated';

import { introModeFor, markSeen, readSeen, type IntroMode } from './introMode';

/**
 * Decide como as Boas-vindas abrem (animação, fade ou estado final) e marca a animação
 * como vista. A flag fica no AsyncStorage: não é segredo, e funciona no aparelho e na web.
 */
export function useWelcomeIntro(): { mode: IntroMode; finish: () => void } {
  const reduceMotion = useReducedMotion();
  const [seen, setSeen] = useState<boolean | null>(null);
  // O modo é decidido uma vez: marcar como vista no fim não pode trocar a tela no meio.
  const [mode, setMode] = useState<IntroMode>('loading');
  const finished = useRef(false);

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

  const finish = useCallback(() => {
    if (finished.current) return;
    finished.current = true;
    void markSeen(AsyncStorage);
  }, []);

  return { mode, finish };
}
