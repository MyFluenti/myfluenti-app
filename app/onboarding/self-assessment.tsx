import { useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AnswerOption, Button, ErrorState, LoadingState, Text } from '@/components';
import { FlowScreen } from '@/features/common/FlowScreen';
import { useOnboarding } from '@/features/onboarding/OnboardingProvider';
import { useAsync } from '@/hooks/useAsync';
import { toAppError } from '@/services/errors';
import { listLevels } from '@/services/levels';
import { spacing } from '@/theme/tokens';

/**
 * Tela 16: autoavaliação. Grava `profiles.self_assessed_level_id` (update permitido) e
 * segue para a introdução do nivelamento. A autoavaliação não define o nível de estudo.
 */
export default function SelfAssessmentScreen() {
  const router = useRouter();
  const { selfAssessedLevelId, saveSelfAssessment } = useOnboarding();
  const levels = useAsync(useCallback(() => listLevels(), []));
  const [selected, setSelected] = useState<string | null>(selfAssessedLevelId);
  const [saving, setSaving] = useState<'level' | 'unknown' | null>(null);
  const [error, setError] = useState<string | undefined>();

  const save = async (levelId: string | null) => {
    setError(undefined);
    setSaving(levelId ? 'level' : 'unknown');
    try {
      await saveSelfAssessment(levelId);
      router.push('/placement/intro');
    } catch (e) {
      setError(toAppError(e).message);
    } finally {
      setSaving(null);
    }
  };

  let body;
  if (levels.loading) {
    body = <LoadingState />;
  } else if (levels.error || !levels.data) {
    body =
      levels.error?.kind === 'network' ? (
        <ErrorState onRetry={levels.reload} />
      ) : (
        <ErrorState title="Algo deu errado" message={levels.error?.message} onRetry={levels.reload} />
      );
  } else {
    body = (
      <View style={styles.list} accessibilityRole="radiogroup">
        {levels.data.map((level) => (
          <AnswerOption
            key={level.id}
            label={`${level.code} · ${level.title}`}
            state={selected === level.id ? 'selected' : 'normal'}
            disabled={saving !== null}
            onPress={() => setSelected(level.id)}
          />
        ))}
      </View>
    );
  }

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
            label="Continuar"
            onPress={() => selected && void save(selected)}
            disabled={!selected || saving !== null}
            loading={saving === 'level'}
          />
          <Button
            label="Não sei meu nível"
            variant="secondary"
            onPress={() => void save(null)}
            disabled={saving !== null}
            loading={saving === 'unknown'}
          />
        </>
      }
    >
      <View style={styles.intro}>
        <Text variant="heading1" accessibilityRole="header">
          Qual é o seu nível hoje?
        </Text>
        <Text variant="bodyM" color="textSecondary">
          Escolha o que mais combina com você. No próximo passo, o teste confirma o seu ponto de
          partida.
        </Text>
      </View>
      {body}
    </FlowScreen>
  );
}

const styles = StyleSheet.create({
  intro: { gap: spacing.sm, marginTop: spacing.xl },
  list: { gap: spacing.md },
});
