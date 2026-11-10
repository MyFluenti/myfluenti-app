import { useLocalSearchParams, useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Badge, Button, Text } from '@/components';
import { notify } from '@/features/common/dialogs';
import { colors, layout, spacing } from '@/theme/tokens';

/**
 * Módulo Premium sem plano (o backend devolveu `locked_plan`). Sem fluxo de compra
 * (ADR 0002) e sem descrever o escopo dos planos.
 */
export default function PremiumModuleScreen() {
  const router = useRouter();
  const { title } = useLocalSearchParams<{ title?: string }>();

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.content}>
        <Badge variant="premium" />
        <Text variant="display" accessibilityRole="header">
          {title || 'Módulo Premium'}
        </Text>
        <Text variant="bodyL" color="textSecondary">
          Este módulo faz parte do plano Premium. Seu progresso e o histórico continuam salvos.
        </Text>
      </View>

      <View style={styles.footer}>
        <Button
          label="Conhecer o Premium"
          onPress={() =>
            notify('Plano Premium', 'Compras ainda não estão disponíveis na versão de testes.')
          }
        />
        <Button label="Voltar ao curso" variant="secondary" onPress={() => router.back()} />
        <Text variant="caption" color="textSecondary" style={styles.footnote}>
          Compras ainda não estão disponíveis na versão de testes.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bgBase },
  content: {
    flex: 1,
    padding: layout.screenPaddingX,
    paddingTop: spacing['4xl'],
    gap: spacing.lg,
  },
  footer: {
    padding: layout.screenPaddingX,
    gap: spacing.md,
  },
  footnote: { textAlign: 'center' },
});
