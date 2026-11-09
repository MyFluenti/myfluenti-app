import { StyleSheet, View } from 'react-native';

import { colors, layout, radius } from '@/theme/tokens';

export type ProgressBarProps = {
  /** 0 a 100. Fora da faixa (ou NaN) vira 0 ou 100. */
  value: number;
  /** Rótulo para leitor de tela. Padrão: "Progresso". */
  accessibilityLabel?: string;
};

export function clampProgress(value: number): number {
  if (Number.isNaN(value)) return 0;
  return Math.min(100, Math.max(0, value));
}

export function ProgressBar({ value, accessibilityLabel = 'Progresso' }: ProgressBarProps) {
  const now = clampProgress(value);
  const done = now >= 100;

  return (
    <View
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={accessibilityLabel}
      accessibilityValue={{ min: 0, max: 100, now: Math.round(now) }}
      style={styles.track}
    >
      <View
        style={[
          styles.fill,
          { width: `${now}%`, backgroundColor: done ? colors.statusSuccess : colors.brandPrimary },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    height: layout.progressHeight,
    borderRadius: radius.full,
    backgroundColor: colors.bgElevated,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: radius.full,
  },
});
