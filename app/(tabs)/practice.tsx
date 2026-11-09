import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { Button, NoReviewState, Text } from '@/components';
import { Screen } from '@/features/common/Screen';
import { useReviewQueue } from '@/features/review/useReviewQueue';
import { colors, radius, spacing } from '@/theme/tokens';

export default function PracticeScreen() {
  const router = useRouter();
  const state = useReviewQueue();

  return (
    <Screen state={state}>
      {(queue) => (
        <>
          <Text variant="display" accessibilityRole="header">
            Revisão
          </Text>

          {queue.due_count === 0 ? (
            <NoReviewState onGoToCourse={() => router.navigate('/course')} />
          ) : (
            <View style={styles.container}>
              {/* Card principal com contagem de hoje */}
              <View style={styles.heroCard}>
                <View style={styles.heroContent}>
                  <Text variant="heading1">
                    {queue.due_count === 1 ? '1 item para hoje' : `${queue.due_count} itens para hoje`}
                  </Text>
                  <Text variant="bodyM" color="textSecondary">
                    Tempo estimado: {Math.max(1, Math.round(queue.due_count * 0.5))} min
                  </Text>
                </View>
                <Button
                  label="Começar revisão"
                  onPress={() => router.push('/review/session')}
                />
              </View>

              {/* Card de revisões futuras */}
              <View style={styles.card}>
                <Text variant="heading3" style={styles.cardTitle}>
                  Próximas revisões
                </Text>
                <View style={styles.row}>
                  <Text variant="bodyM" color="textSecondary">
                    Amanhã
                  </Text>
                  <Text variant="heading3">
                    {queue.upcoming.tomorrow} {queue.upcoming.tomorrow === 1 ? 'item' : 'itens'}
                  </Text>
                </View>
                <View style={styles.divider} />
                <View style={styles.row}>
                  <Text variant="bodyM" color="textSecondary">
                    Próximos 7 dias
                  </Text>
                  <Text variant="heading3">
                    {queue.upcoming.next_7_days} {queue.upcoming.next_7_days === 1 ? 'item' : 'itens'}
                  </Text>
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
            </View>
          )}
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.lg,
  },
  heroCard: {
    backgroundColor: colors.bgSurface,
    borderColor: colors.borderDefault,
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
  divider: {
    height: 1,
    backgroundColor: colors.borderDefault,
  },
});
