import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';

import { useOnboarding } from './OnboardingProvider';

/**
 * Leva ao Início depois de concluir a porta de entrada. Espera o status `done` chegar
 * ao layout raiz: navegar antes disso cairia na guarda das abas, que ainda não liberou.
 */
export function useLeaveOnboarding(): () => void {
  const router = useRouter();
  const { status } = useOnboarding();
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    if (!leaving || status !== 'done') return;
    // Tira autoavaliação e nivelamento da pilha: o voltar no Início não reabre o fluxo.
    if (router.canDismiss()) router.dismissAll();
    router.replace('/');
  }, [leaving, status, router]);

  return () => setLeaving(true);
}
