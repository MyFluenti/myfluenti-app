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
    if (leaving && status === 'done') router.replace('/');
  }, [leaving, status, router]);

  return () => setLeaving(true);
}
