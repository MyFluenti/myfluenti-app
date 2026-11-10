import { Pressable, StyleSheet, View } from 'react-native';

import { colors, layout, opacity, radius, spacing, type ColorToken } from '@/theme/tokens';

import { joinLabel } from './a11y';
import { ProgressBar, clampProgress } from './ProgressBar';
import { Text } from './Text';

export type ModuleStatus = 'locked' | 'premium' | 'available' | 'in_progress' | 'completed';

export type ModuleCardProps = {
  title: string;
  /** Linha de apoio (ex.: contagem de aulas). Em locked e premium dá lugar à mensagem de bloqueio. */
  description: string;
  status: ModuleStatus;
  /** 0 a 100. Mostrado em in_progress e completed (completed assume 100). */
  progress?: number;
  /** locked fica desabilitado; premium continua tocável (o app abre a tela de plano). */
  onPress?: () => void;
};

const LOCKED_TEXT = 'Conclua o módulo anterior';
const PREMIUM_TEXT = 'Disponível no plano Premium';

const statusConfig: Record<
  ModuleStatus,
  { label: string; labelColor: ColorToken; bg: string; border: string; titleColor: ColorToken }
> = {
  locked: {
    label: 'Bloqueado',
    labelColor: 'textSecondary',
    bg: colors.bgSurface,
    border: colors.borderDefault,
    titleColor: 'textSecondary',
  },
  premium: {
    label: 'Premium',
    labelColor: 'brandPrimaryLight',
    bg: colors.bgSurface,
    border: colors.brandPrimary,
    titleColor: 'textPrimary',
  },
  available: {
    label: 'Disponível',
    labelColor: 'brandPrimaryLight',
    bg: colors.bgSurface,
    border: colors.borderDefault,
    titleColor: 'textPrimary',
  },
  in_progress: {
    label: 'Em andamento',
    labelColor: 'brandPrimaryLight',
    bg: colors.brandPrimarySubtle,
    border: colors.brandPrimary,
    titleColor: 'textPrimary',
  },
  completed: {
    label: 'Concluído',
    labelColor: 'statusSuccess',
    bg: colors.bgSurface,
    border: colors.statusSuccess,
    titleColor: 'textPrimary',
  },
};

export function ModuleCard({ title, description, status, progress = 0, onPress }: ModuleCardProps) {
  const c = statusConfig[status];
  const locked = status === 'locked';
  const value = status === 'completed' ? 100 : clampProgress(progress);
  const showProgress = status === 'in_progress' || status === 'completed';
  const line = locked ? LOCKED_TEXT : status === 'premium' ? PREMIUM_TEXT : description;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={joinLabel(title, c.label, line)}
      accessibilityState={{ disabled: locked }}
      disabled={locked}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        { backgroundColor: c.bg, borderColor: c.border, opacity: pressed ? opacity.pressed : 1 },
      ]}
    >
      <View style={styles.header}>
        <Text variant="heading3" color={c.titleColor} style={styles.title}>
          {title}
        </Text>
        <Text variant="caption" color={c.labelColor}>
          {c.label}
        </Text>
      </View>
      <Text variant="bodyM" color="textSecondary">
        {line}
      </Text>
      {showProgress ? (
        <ProgressBar value={value} accessibilityLabel={`Progresso do módulo ${title}`} />
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: layout.minTouchTarget,
    borderRadius: radius.lg,
    borderWidth: layout.borderWidth,
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
});
