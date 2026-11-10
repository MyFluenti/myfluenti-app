import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { Button, NoReviewState, Text } from '@/components';
import { Screen } from '@/features/common/Screen';
import { useReviewQueue } from '@/features/review/useReviewQueue';
import { colors, radius, spacing } from '@/theme/tokens';

function itemsText(n: number): string {
  return `${n} ${n === 1 ? 'item' : 'itens'}`;
}

export default function PracticeScreen() {
  const router = useRouter();
  const state = useReviewQueue();

  return (
    <Screen state={state}>
      {(queue) => (
        <>
          <View style={styles.header}>
            <Text variant="display" accessibilityRole="header">
              Revisão
            </Text>
            <Text variant="bodyM" color="textSecondary">
              Reforce o que você já estudou, no tempo certo.
            </Text>
          </View>

          {queue.due_count === 0 ? (
            <NoReviewState onGoToCourse={() => router.navigate('/course')} />
          ) : (
            <View style={styles.container}>
              <View style={styles.heroCard}>
                <View style={styles.heroContent}>
                  <Text variant="caption" color="brandPrimaryLight">
                    PARA HOJE
                  </Text>
                  <Text variant="display">{itemsText(queue.due_count)}</Text>
                </View>
                <Button label="Começar revisão" onPress={() => router.push('/review/session')} />
              </View>

              <View style={styles.card}>
                <Text variant="heading3" style={styles.cardTitle}>
                  Próximas revisões
                </Text>
                <View style={styles.row}>
                  <Text variant="bodyM" color="textSecondary">
                    Amanhã
                  </Text>
                  <Text variant="label">{itemsText(queue.upcoming.tomorrow)}</Text>
                </View>
                <View style={styles.row}>
                  <Text variant="bodyM" color="textSecondary">
                    Próximos 7 dias
                  </Text>
                  <Text variant="label">{itemsText(queue.upcoming.next_7_days)}</Text>
                </View>
              </View>

              {queue.locked_count > 0 && (
                <Text variant="caption" color="textSecondary">
                  {queue.locked_count}{' '}
                  {queue.locked_count === 1
                    ? 'item de conteúdo Premium aguardando desbloqueio.'
                    : 'itens de conteúdo Premium aguardando desbloqueio.'}
                </Text>
              )}

              <Text variant="caption" color="textSecondary" style={styles.footnote}>
                A revisão não bloqueia nenhum módulo. Estude no seu ritmo.
              </Text>
            </View>
          )}
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    gap: spacing.xs,
  },
  container: {
    gap: spacing.lg,
  },
  heroCard: {
    backgroundColor: colors.brandPrimarySubtle,
    borderColor: colors.brandPrimary,
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: spacing.xl,
    gap: spacing.xl,
  },
  heroContent: {
    gap: spacing.xs,
  },
  card: {
    backgroundColor: colors.bgSurface,
    borderColor: colors.borderDefault,
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.md,
  },
  cardTitle: {
    marginBottom: spacing.xs,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  footnote: {
    textAlign: 'center',
  },
});
