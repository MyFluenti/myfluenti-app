import { useState } from 'react';
import { useReducedMotion } from 'react-native-reanimated';

import { introModeFor, type IntroMode } from './introMode';

/**
 * Decide como as Boas-vindas abrem. A tela só existe sem sessão, então a animação toca em
 * toda abertura dela: no primeiro uso, depois de sair da conta e depois de excluir a conta.
 * O modo fica fixo enquanto a tela está montada: voltar do cadastro ou do login não repete.
 */
export function useWelcomeIntro(): { mode: IntroMode } {
  const reduceMotion = useReducedMotion();
  const [mode] = useState<IntroMode>(() => introModeFor(reduceMotion));
  return { mode };
}
