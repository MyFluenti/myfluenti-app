import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';

import { Button } from '@/components';
import { FlowScreen } from '@/features/common/FlowScreen';
import { REDUCED_FADE_MS } from '@/features/welcome/constants';
import { useWelcomeIntro } from '@/features/welcome/useWelcomeIntro';
import { WelcomeContent, WelcomeIntro } from '@/features/welcome/WelcomeIntro';
import { spacing } from '@/theme/tokens';

/**
 * Tela 01: Boas-vindas. Primeira tela sem sessão. Toda vez que aparece, toca a animação da
 * tela 49 (com "reduzir movimento", só um fade).
 */
export default function WelcomeScreen() {
  const router = useRouter();
  const { mode } = useWelcomeIntro();

  const signUp = () => router.push('/sign-up');
  const signIn = () => router.push('/sign-in');

  if (mode === 'animate') {
    return (
      <WelcomeIntro
        renderActions={() => ({
          primary: <Button label="Começar" onPress={signUp} />,
          secondary: <Button label="Já tenho conta" variant="outline" onPress={signIn} />,
        })}
      />
    );
  }

  return (
    <FlowScreen centered>
      <FadeIn>
        <WelcomeContent />
        <View style={styles.actions}>
          <Button label="Começar" onPress={signUp} />
          <Button label="Já tenho conta" variant="outline" onPress={signIn} />
        </View>
      </FadeIn>
    </FlowScreen>
  );
}

/** "Reduzir movimento": só um fade curto da tela inteira. */
function FadeIn({ children }: { children: React.ReactNode }) {
  const opacity = useSharedValue(0);
  useEffect(() => {
    opacity.value = withTiming(1, { duration: REDUCED_FADE_MS });
  }, [opacity]);
  const style = useAnimatedStyle(() => ({ opacity: opacity.value }));
  return <Animated.View style={style}>{children}</Animated.View>;
}

const styles = StyleSheet.create({
  actions: { gap: spacing.md, marginTop: spacing.lg },
});
