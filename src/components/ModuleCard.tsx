import { Pressable, StyleSheet, View } from 'react-native';

import { colors, layout, opacity, radius, spacing } from '@/theme/tokens';

import { Badge } from './Badge';
import { Icon } from './icons';
import { ProgressBar, clampProgress } from './ProgressBar';
import { Text } from './Text';

export type ModuleStatus = 'locked' | 'premium' | 'available' | 'in_progress' | 'completed';

export type ModuleCardProps = {
  title: string;
  description: string;
  status: ModuleStatus;
  /** 0 a 100. Usado em available, in_progress e completed (completed assume 100). */
  progress?: number;
  /** locked fica desabilitado; premium continua tocável (o app abre a tela de plano). */
  onPress?: () => void;
};

const LOCKED_TEXT = 'Conclua o módulo anterior';
const PREMIUM_TEXT = 'Disponível no plano Premium';

export function ModuleCard({ title, description, status, progress = 0, onPress }: ModuleCardProps) {
  const locked = status === 'locked';
  const premium = status === 'premium';
  const blocked = locked || premium;
  const value = status === 'completed' ? 100 : clampProgress(progress);
  const message = locked ? LOCKED_TEXT : premium ? PREMIUM_TEXT : null;

  const statusLabel = locked
    ? LOCKED_TEXT
    : premium
      ? PREMIUM_TEXT
      : status === 'completed'
        ? 'Concluído'
        : status === 'in_progress'
          ? `Em andamento, ${Math.round(value)}%`
          : 'Disponível';

  const borderColor =
    status === 'in_progress' ? colors.brandPrimary : premium ? colors.brandPrimarySubtle : colors.borderDefault;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${title}. ${description}. ${statusLabel}`}
      accessibilityState={{ disabled: locked }}
      disabled={locked}
      onPress={onPress}
      style={({ pressed }) => [styles.base, { borderColor, opacity: pressed ? opacity.pressed : 1 }]}
    >
      <View style={styles.header}>
        <Text variant="heading2" color={locked ? 'textSecondary' : 'textPrimary'} style={styles.title}>
          {title}
        </Text>
        {premium && <Badge variant="premium" />}
        {status === 'completed' && <Badge variant="completed" />}
        {status === 'in_progress' && <Badge variant="in_progress" />}
      </View>
      <Text variant="bodyM" color="textSecondary">
        {description}
      </Text>
      {message ? (
        <View style={styles.message}>
          <Icon name="lock" color={premium ? 'brandPrimaryLight' : 'textSecondary'} size={spacing.lg} />
          <Text variant="label" color={premium ? 'brandPrimaryLight' : 'textSecondary'}>
            {message}
          </Text>
        </View>
      ) : (
        !blocked && <ProgressBar value={value} accessibilityLabel={`Progresso do módulo ${title}`} />
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: layout.minTouchTarget,
    borderRadius: radius.lg,
    borderWidth: 1,
    backgroundColor: colors.bgSurface,
    padding: spacing.lg,
    gap: spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  title: { flex: 1 },
  message: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
});
