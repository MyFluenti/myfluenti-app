import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { Button, LogoMark, Text } from '@/components';
import { FlowScreen } from '@/features/common/FlowScreen';
import { spacing } from '@/theme/tokens';

/** Tela 01: Boas-vindas. Primeira tela sem sessão. */
export default function WelcomeScreen() {
  const router = useRouter();

  return (
    <FlowScreen centered>
      <View style={styles.brand}>
        <LogoMark size={80} />
        <Text variant="display" accessibilityRole="header">
          MyFluenti
        </Text>
        <Text variant="heading3" color="brandPrimaryLight">
          Understand. Practice. Evolve.
        </Text>
        <Text variant="bodyL" color="textSecondary">
          Seu professor particular digital. Entenda como o inglês funciona e construa suas
          próprias frases.
        </Text>
      </View>
      <View style={styles.actions}>
        <Button label="Começar" onPress={() => router.push('/sign-up')} />
        <Button label="Já tenho conta" variant="outline" onPress={() => router.push('/sign-in')} />
      </View>
    </FlowScreen>
  );
}

const styles = StyleSheet.create({
  brand: { gap: spacing.lg },
  actions: { gap: spacing.md, marginTop: spacing.lg },
});
