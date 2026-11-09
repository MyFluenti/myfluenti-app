import { Redirect } from 'expo-router';

import { ComponentShowcase } from '@/components/__showcase__/ComponentShowcase';

// Rota só de desenvolvimento: em produção volta para o início.
export default function ShowcaseRoute() {
  if (!__DEV__) {
    return <Redirect href="/" />;
  }
  return <ComponentShowcase />;
}
