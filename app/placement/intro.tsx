import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Button, Text } from '@/components';
import { confirm } from '@/features/common/dialogs';
import { FlowScreen } from '@/features/common/FlowScreen';
import { placementErrorMessage } from '@/features/onboarding/messages';
import { useOnboarding } from '@/features/onboarding/OnboardingProvider';
import { useLeaveOnboarding } from '@/features/onboarding/useLeaveOnboarding';
import { listLevels } from '@/services/levels';
import * as placement from '@/services/placement';
import { colors, layout, radius, spacing } from '@/theme/tokens';

const FACTS = [
  {
    title: '30 questões',
    text: 'Vocabulário, gramática, interpretação e construção de frases',
  },
  {
    title: 'Pause quando quiser',
    text: 'Suas respostas ficam salvas e você continua de onde parou',
  },
  {
    title: 'Diagnóstico, não certificação',
    text: 'O resultado indica por onde começar. Você escolhe o nível de partida, igual ou abaixo do recomendado',
  },
];

/**
 * Tela 14: introdução do nivelamento. Na porta de entrada, "Agora não" começa sem o
 * teste: o nível de partida é pedido à RPC com a autoavaliação (ou o primeiro nível),
 * e o backend valida. Pelo Perfil (refazer), "Agora não" só volta.
 */
export default function PlacementIntroScreen() {
  const router = useRouter();
  const { status, selfAssessedLevelId, complete } = useOnboarding();
  const onboarding = status !== 'done';
  const leave = useLeaveOnboarding();
  const [busy, setBusy] = useState<'start' | 'skip' | null>(null);
  const [error, setError] = useState<string | undefined>();

  const startTest = async () => {
    setError(undefined);
    setBusy('start');
    try {
      const attemptId = await placement.start();
      router.push({ pathname: '/placement/[attemptId]', params: { attemptId } });
    } catch (e) {
      setError(placementErrorMessage(e));
    } finally {
      setBusy(null);
    }
  };

  const skip = async () => {
    if (!onboarding) {
      if (router.canGoBack()) router.back();
      else router.replace('/profile');
      return;
    }
    setError(undefined);
    setBusy('skip');
    try {
      const levels = await listLevels();
      const level = levels.find((l) => l.id === selfAssessedLevelId) ?? levels[0];
      if (!level) throw new Error('levels_empty');
      const ok = await confirm({
        title: 'Começar sem o teste?',
        message: `Você começa no ${level.code}. Pode fazer o teste depois, pelo Perfil.`,
        confirmLabel: `Começar no ${level.code}`,
        cancelLabel: 'Voltar',
      });
      if (!ok) return;
      await complete(level.id);
      leave();
    } catch (e) {
      setError(placementErrorMessage(e));
    } finally {
      setBusy(null);
    }
  };

  return (
    <FlowScreen
      footer={
        <>
          {error ? (
            <Text variant="bodyM" color="statusError" accessibilityLiveRegion="polite">
              {error}
            </Text>
          ) : null}
          <Button
            label="Começar teste"
            onPress={startTest}
            loading={busy === 'start'}
            disabled={busy !== null}
          />
          <Button
            label="Agora não"
            variant="secondary"
            onPress={skip}
            loading={busy === 'skip'}
            disabled={busy !== null}
          />
        </>
      }
    >
      <View style={styles.intro}>
        <Text variant="heading1" accessibilityRole="header">
          Vamos descobrir seu nível
        </Text>
        <Text variant="bodyL" color="textSecondary">
          Responda com calma. Se não souber, tudo bem.
        </Text>
      </View>
      <View style={styles.list}>
        {FACTS.map((fact) => (
          <View key={fact.title} style={styles.card} accessible>
            <Text variant="heading3">{fact.title}</Text>
            <Text variant="bodyM" color="textSecondary">
              {fact.text}
            </Text>
          </View>
        ))}
      </View>
    </FlowScreen>
  );
}

const styles = StyleSheet.create({
  intro: { gap: spacing.sm, marginTop: spacing.xl },
  list: { gap: spacing.md },
  card: {
    backgroundColor: colors.bgSurface,
    borderColor: colors.borderDefault,
    borderWidth: layout.borderWidth,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.xs,
  },
});
