import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
} from '@expo-google-fonts/inter';
import {
  Manrope_400Regular,
  Manrope_600SemiBold,
  Manrope_700Bold,
  Manrope_800ExtraBold,
  useFonts,
} from '@expo-google-fonts/manrope';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { View } from 'react-native';

import { ErrorState, LoadingState } from '@/components';
import { AuthProvider, useAuth } from '@/features/auth/AuthProvider';
import { OnboardingProvider, useOnboarding } from '@/features/onboarding/OnboardingProvider';
import { colors, layout } from '@/theme/tokens';

SplashScreen.preventAutoHideAsync();

// O Expo Router já fornece o SafeAreaProvider.
function RootNavigator() {
  const { status } = useAuth();
  const onboarding = useOnboarding();

  const signedIn = status === 'signed_in';

  if (status === 'loading' || (signedIn && onboarding.status === 'loading')) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bgBase, padding: layout.screenPaddingX }}>
        <LoadingState variant="spinner" />
      </View>
    );
  }

  if (signedIn && onboarding.status === 'error') {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bgBase, padding: layout.screenPaddingX }}>
        {onboarding.error?.kind === 'network' ? (
          <ErrorState onRetry={onboarding.retry} />
        ) : (
          <ErrorState
            title="Algo deu errado"
            message={onboarding.error?.message}
            onRetry={onboarding.retry}
          />
        )}
      </View>
    );
  }

  // Porta de entrada: sem sessão vai para Boas-vindas; com sessão e sem nível de partida
  // escolhido vai para a autoavaliação. Cada grupo diz para onde mandar quem não pode entrar.
  const onboarded = signedIn && onboarding.status === 'done';
  const home = signedIn ? (onboarded ? '/' : '/onboarding/self-assessment') : '/welcome';

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.bgBase },
      }}
    >
      <Stack.Protected guard={onboarded} redirectTo={home}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="course/[moduleId]" />
        <Stack.Screen name="lesson/[attemptId]" />
        <Stack.Screen name="lesson/result" options={{ gestureEnabled: false }} />
        <Stack.Screen name="library/[type]/[id]" />
        <Stack.Screen name="review/session" />
        <Stack.Screen name="profile/settings" />
        <Stack.Screen name="profile/edit" />
        <Stack.Screen name="profile/delete-account" />
        <Stack.Screen name="profile/avatar" />
        <Stack.Screen name="premium-module" />
        <Stack.Screen name="dev/showcase" />
      </Stack.Protected>
      <Stack.Protected guard={signedIn && !onboarded} redirectTo={home}>
        <Stack.Screen name="onboarding/self-assessment" />
      </Stack.Protected>
      <Stack.Protected guard={signedIn} redirectTo={home}>
        <Stack.Screen name="placement/intro" />
        <Stack.Screen name="placement/[attemptId]" options={{ gestureEnabled: false }} />
        <Stack.Screen name="placement/result" options={{ gestureEnabled: false }} />
      </Stack.Protected>
      <Stack.Protected guard={!signedIn} redirectTo={home}>
        <Stack.Screen name="welcome" />
        <Stack.Screen name="sign-in" />
        <Stack.Screen name="sign-up" />
      </Stack.Protected>
    </Stack>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Manrope_400Regular,
    Manrope_600SemiBold,
    Manrope_700Bold,
    Manrope_800ExtraBold,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
  });

  const ready = fontsLoaded || fontError !== null;

  useEffect(() => {
    if (ready) {
      SplashScreen.hideAsync();
    }
  }, [ready]);

  if (!ready) {
    return null;
  }

  return (
    <AuthProvider>
      <OnboardingProvider>
        <StatusBar style="light" />
        <RootNavigator />
      </OnboardingProvider>
    </AuthProvider>
  );
}
