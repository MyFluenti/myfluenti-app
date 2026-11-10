import { useEffect, useState } from 'react';
import {
  AccessibilityInfo,
  ActivityIndicator,
  Animated,
  StyleSheet,
  View,
} from 'react-native';

import { colors, layout, radius, spacing } from '@/theme/tokens';

import { Button } from './Button';
import { Icon } from './icons';
import { Text } from './Text';

// ---------- Esqueleto ----------

function SkeletonBlock({ height, width, round = radius.lg }: { height: number; width?: `${number}%`; round?: number }) {
  const [pulse] = useState(() => new Animated.Value(1));
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    let mounted = true;
    AccessibilityInfo.isReduceMotionEnabled().then((v) => mounted && setReduceMotion(v));
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (reduceMotion) {
      pulse.setValue(1);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 0.5, duration: 800, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 800, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [pulse, reduceMotion]);

  return <Animated.View style={[styles.skeleton, { height, width, borderRadius: round, opacity: pulse }]} />;
}

// ---------- LoadingState ----------

export type LoadingStateProps = {
  /** skeleton (padrão): blocos de cartão. spinner: indicador central. */
  variant?: 'skeleton' | 'spinner';
  message?: string;
};

export function LoadingState({ variant = 'skeleton', message = 'Carregando' }: LoadingStateProps) {
  return (
    <View accessible accessibilityRole="progressbar" accessibilityLabel={message} accessibilityState={{ busy: true }} style={styles.fill}>
      {variant === 'spinner' ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.brandPrimary} />
          <Text variant="bodyM" color="textSecondary">
            {message}
          </Text>
        </View>
      ) : (
        <View style={styles.skeletonList}>
          <View style={styles.skeletonHeader}>
            <SkeletonBlock height={spacing['2xl'] + spacing.xs} width="55%" round={radius.md} />
            <SkeletonBlock height={spacing.lg} width="75%" round={radius.sm} />
          </View>
          <SkeletonBlock height={layout.skeletonHeroHeight} />
          <SkeletonBlock height={layout.skeletonCardHeight} />
          <SkeletonBlock height={layout.skeletonCardHeight} />
          <SkeletonBlock height={layout.skeletonCardHeight} />
        </View>
      )}
    </View>
  );
}

// ---------- EmptyState (base) ----------

export type EmptyStateProps = {
  title: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
  /** Ícone decorativo no topo: check (violeta) ou alert (atenção). Sem ícone por padrão. */
  icon?: 'check' | 'alert';
};

export function EmptyState({ title, message, actionLabel, onAction, icon }: EmptyStateProps) {
  return (
    <View style={styles.center}>
      {icon === 'check' ? (
        <View style={[styles.iconCircle, { backgroundColor: colors.brandPrimarySubtle, borderColor: colors.brandPrimary }]}>
          <Icon name="check" color="brandPrimaryLight" size={spacing['3xl']} />
        </View>
      ) : null}
      {icon === 'alert' ? (
        <View style={[styles.iconCircle, { backgroundColor: colors.bgElevated, borderColor: colors.statusWarning }]}>
          <Icon name="alert" color="statusWarning" size={spacing['3xl']} />
        </View>
      ) : null}
      <Text variant="heading2" style={styles.centerText} accessibilityRole="header">
        {title}
      </Text>
      {message ? (
        <Text variant="bodyM" color="textSecondary" style={styles.centerText}>
          {message}
        </Text>
      ) : null}
      {actionLabel && onAction ? (
        <View style={styles.action}>
          <Button label={actionLabel} onPress={onAction} />
        </View>
      ) : null}
    </View>
  );
}

// ---------- ErrorState ----------

export type ErrorStateProps = {
  title?: string;
  message?: string;
  onRetry: () => void;
};

export function ErrorState({
  title = 'Sem conexão',
  message = 'Não conseguimos carregar agora. Seu progresso está salvo. Confira a internet e tente de novo.',
  onRetry,
}: ErrorStateProps) {
  return <EmptyState title={title} message={message} actionLabel="Tentar de novo" onAction={onRetry} icon="alert" />;
}

// ---------- NoReviewState ----------

export type NoReviewStateProps = { onGoToCourse: () => void };

export function NoReviewState({ onGoToCourse }: NoReviewStateProps) {
  return (
    <EmptyState
      title="Nada para revisar hoje"
      message="Quando você errar ou concluir aulas, os itens aparecem aqui no melhor momento para rever."
      actionLabel="Ir para o curso"
      onAction={onGoToCourse}
      icon="check"
    />
  );
}

// ---------- NoProgressState ----------

export type NoProgressStateProps = { onStart: () => void };

export function NoProgressState({ onStart }: NoProgressStateProps) {
  return (
    <EmptyState
      title="Você ainda não começou"
      message="Seu progresso aparece aqui depois da primeira aula."
      actionLabel="Ir para o curso"
      onAction={onStart}
    />
  );
}

// ---------- PremiumState ----------

export type PremiumStateProps = { onSeePlan?: () => void };

export function PremiumState({ onSeePlan }: PremiumStateProps) {
  return (
    <EmptyState
      title="Disponível no plano Premium"
      message="Este conteúdo faz parte do plano Premium."
      actionLabel={onSeePlan ? 'Ver plano' : undefined}
      onAction={onSeePlan}
    />
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    padding: spacing['2xl'],
  },
  centerText: { textAlign: 'center' },
  action: { alignSelf: 'stretch', marginTop: spacing.sm },
  skeletonList: { gap: spacing.md },
  skeletonHeader: { gap: spacing.sm, marginBottom: spacing.md },
  iconCircle: {
    width: layout.stateIconSize,
    height: layout.stateIconSize,
    borderRadius: radius.full,
    borderWidth: layout.borderWidthStrong,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  skeleton: { borderRadius: radius.lg, backgroundColor: colors.bgElevated },
});
