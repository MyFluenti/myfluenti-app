import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Button, ErrorState, LoadingState, Text } from '@/components';
import { FlowScreen } from '@/features/common/FlowScreen';
import { placementErrorMessage } from '@/features/onboarding/messages';
import { useOnboarding } from '@/features/onboarding/OnboardingProvider';
import { useLeaveOnboarding } from '@/features/onboarding/useLeaveOnboarding';
import { useAsync } from '@/hooks/useAsync';
import { listLevels } from '@/services/levels';
import * as placement from '@/services/placement';
import { colors, layout, radius, spacing } from '@/theme/tokens';
import type { Level } from '@/types/contract';

const COMPETENCIES = [
  { key: 'vocabulary', label: 'Vocabulário' },
  { key: 'grammar', label: 'Gramática' },
  { key: 'reading', label: 'Interpretação' },
  { key: 'construction', label: 'Construção' },
] as const;

/** Lê o `pct` de cada competência como veio do backend; ignora o que não reconhece. */
function competencyPct(breakdown: unknown, key: string): number | null {
  if (typeof breakdown !== 'object' || breakdown === null) return null;
  const entry = (breakdown as Record<string, unknown>)[key];
  if (typeof entry !== 'object' || entry === null) return null;
  const pct = Number((entry as Record<string, unknown>).pct);
  return Number.isFinite(pct) ? pct : null;
}

/** Só para exibir: trunca, para nunca mostrar mais do que o aluno fez. */
const formatPct = (pct: number) => `${Math.floor(pct)}%`;

/**
 * Tela 03: resultado do nivelamento. O nível recomendado e as porcentagens vêm do
 * backend (`finish_placement_attempt`, gravados na tentativa). Na porta de entrada, o
 * aluno escolhe começar no recomendado ou abaixo; o backend valida (`select_starting_level`).
 * Ao refazer o teste pelo Perfil, o resultado não muda o nível em estudo.
 */
export default function PlacementResultScreen() {
  const router = useRouter();
  const { attemptId } = useLocalSearchParams<{ attemptId: string }>();
  const { status, complete } = useOnboarding();
  const [finishing, setFinishing] = useState(false);
  // Mantém o modo de porta de entrada até sair da tela (o status vira done antes).
  const onboarding = status !== 'done' || finishing;
  const leave = useLeaveOnboarding();

  const state = useAsync(
    useCallback(async () => {
      const [attempt, levels] = await Promise.all([placement.getAttempt(attemptId), listLevels()]);
      return { attempt, levels };
    }, [attemptId]),
  );

  const [choosing, setChoosing] = useState<string | null>(null);
  const [showLower, setShowLower] = useState(false);
  const [error, setError] = useState<string | undefined>();

  const start = async (level: Level) => {
    setError(undefined);
    setChoosing(level.id);
    setFinishing(true);
    try {
      await complete(level.id, attemptId);
      leave();
    } catch (e) {
      setFinishing(false);
      setError(placementErrorMessage(e));
    } finally {
      setChoosing(null);
    }
  };

  if (state.loading) {
    return (
      <FlowScreen>
        <LoadingState />
      </FlowScreen>
    );
  }

  const attempt = state.data?.attempt;
  const levels = state.data?.levels ?? [];
  const recommended = levels.find((l) => l.id === attempt?.recommended_level_id);

  if (state.error || !attempt || attempt.status !== 'completed' || !recommended) {
    return (
      <FlowScreen>
        {state.error?.kind === 'network' ? (
          <ErrorState onRetry={state.reload} />
        ) : (
          <ErrorState
            title="Resultado indisponível"
            message={state.error?.message ?? 'Não encontramos o resultado deste teste.'}
            onRetry={state.reload}
          />
        )}
      </FlowScreen>
    );
  }

  const lower = levels.filter((l) => l.position < recommended.position);
  const busy = choosing !== null;

  let footer;
  if (onboarding) {
    footer = (
      <>
        {error ? (
          <Text variant="bodyM" color="statusError" accessibilityLiveRegion="polite">
            {error}
          </Text>
        ) : null}
        <Button
          label={`Começar no ${recommended.code}`}
          onPress={() => start(recommended)}
          loading={choosing === recommended.id}
          disabled={busy}
        />
        {lower.length === 1 ? (
          <Button
            label={`Prefiro começar no ${lower[0].code}`}
            variant="secondary"
            onPress={() => start(lower[0])}
            loading={choosing === lower[0].id}
            disabled={busy}
          />
        ) : lower.length > 1 && !showLower ? (
          <Button
            label="Prefiro começar em um nível abaixo"
            variant="secondary"
            onPress={() => setShowLower(true)}
            disabled={busy}
          />
        ) : null}
        {lower.length > 1 && showLower
          ? lower.map((level) => (
              <Button
                key={level.id}
                label={`Começar no ${level.code}`}
                variant="secondary"
                onPress={() => start(level)}
                loading={choosing === level.id}
                disabled={busy}
              />
            ))
          : null}
      </>
    );
  } else {
    footer = (
      <Button
        label="Voltar ao perfil"
        onPress={() => router.replace('/profile')}
      />
    );
  }

  return (
    <FlowScreen footer={footer}>
      <View style={styles.hero} accessible accessibilityLabel={`Seu nível recomendado: ${recommended.code}, ${recommended.title}`}>
        <Text variant="bodyM" color="textSecondary">
          Seu nível recomendado
        </Text>
        <View style={styles.badge}>
          <Text variant="display" color="brandPrimaryLight">
            {recommended.code}
          </Text>
        </View>
        <Text variant="heading3">{recommended.title}</Text>
      </View>

      <View style={styles.list}>
        {COMPETENCIES.map(({ key, label }) => {
          const pct = competencyPct(attempt.competency_breakdown, key);
          if (pct === null) return null;
          return (
            <View
              key={key}
              style={styles.row}
              accessible
              accessibilityLabel={`${label}: ${formatPct(pct)}`}
            >
              <Text variant="bodyM">{label}</Text>
              <Text variant="label" color="brandPrimaryLight">
                {formatPct(pct)}
              </Text>
            </View>
          );
        })}
      </View>

      <Text variant="caption" color="textSecondary" style={styles.center}>
        Este teste é um diagnóstico, não uma certificação.
      </Text>
      {!onboarding ? (
        <Text variant="bodyM" color="textSecondary" style={styles.center}>
          Refazer o teste não muda o nível em que você estuda.
        </Text>
      ) : null}
    </FlowScreen>
  );
}

const BADGE_SIZE = layout.levelBadgeSize;

const styles = StyleSheet.create({
  hero: { alignItems: 'center', gap: spacing.md, marginTop: spacing['2xl'] },
  badge: {
    width: BADGE_SIZE,
    height: BADGE_SIZE,
    borderRadius: radius.full,
    borderWidth: layout.borderWidthStrong,
    borderColor: colors.brandPrimary,
    backgroundColor: colors.brandPrimarySubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  list: { gap: spacing.sm },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.bgSurface,
    borderColor: colors.borderDefault,
    borderWidth: layout.borderWidth,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  center: { textAlign: 'center' },
});
