import { Pressable, StyleSheet, View } from 'react-native';

import { colors, layout, opacity, radius, spacing, type ColorToken } from '@/theme/tokens';

import { joinLabel } from './a11y';
import { Icon } from './icons';
import { Text } from './Text';

export type LessonStatus = 'available' | 'in_progress' | 'completed' | 'locked';

export type LessonRowProps = {
  title: string;
  /** Posição da aula no módulo (1, 2, 3...). */
  position: number;
  status: LessonStatus;
  onPress?: () => void;
  /** Texto exibido quando bloqueada. Padrão: "Bloqueada". */
  lockedText?: string;
};

const CIRCLE = spacing['2xl'] + spacing.md; // 36

const statusText: Record<Exclude<LessonStatus, 'locked'>, string> = {
  available: 'Aula disponível',
  in_progress: 'Em andamento',
  completed: 'Concluída',
};

export function LessonRow({ title, position, status, onPress, lockedText = 'Bloqueada' }: LessonRowProps) {
  const locked = status === 'locked';
  const subtitle = locked ? lockedText : statusText[status];

  const rowBg =
    status === 'completed'
      ? colors.statusSuccessSubtle
      : status === 'in_progress'
        ? colors.brandPrimarySubtle
        : colors.bgSurface;
  const borderColor =
    status === 'completed'
      ? colors.statusSuccess
      : status === 'in_progress'
        ? colors.brandPrimary
        : colors.borderDefault;
  const subtitleColor: ColorToken =
    status === 'completed'
      ? 'statusSuccess'
      : locked
        ? 'textSecondary'
        : 'brandPrimaryLight';

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={joinLabel(`Aula ${position}: ${title}`, subtitle)}
      accessibilityState={{ disabled: locked }}
      disabled={locked}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        { backgroundColor: rowBg, borderColor, opacity: pressed ? opacity.pressed : 1 },
      ]}
    >
      <View style={styles.circle}>
        <Text variant="label" color={locked ? 'textSecondary' : 'textPrimary'}>
          {String(position)}
        </Text>
      </View>
      <View style={styles.texts}>
        <Text variant="bodyL" color={locked ? 'textSecondary' : 'textPrimary'} numberOfLines={2}>
          {title}
        </Text>
        <Text variant="caption" color={subtitleColor}>
          {subtitle}
        </Text>
      </View>
      {status === 'completed' ? (
        <Icon name="check" color="statusSuccess" size={spacing.lg} />
      ) : status === 'in_progress' ? (
        <Icon name="more" color="brandPrimaryLight" size={spacing.lg} />
      ) : locked ? (
        <Icon name="lock" color="textSecondary" size={spacing.lg} />
      ) : (
        <Icon name="chevron-right" color="brandPrimaryLight" size={spacing.lg} />
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: layout.lessonRowMinHeight,
    borderRadius: radius.lg,
    borderWidth: layout.borderWidth,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  circle: {
    width: CIRCLE,
    height: CIRCLE,
    borderRadius: radius.full,
    backgroundColor: colors.bgElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  texts: { flex: 1, gap: spacing.xs },
});
