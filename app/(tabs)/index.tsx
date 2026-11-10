import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { Badge, Button, NoProgressState, ProgressBar, Text } from '@/components';
import { useAuth } from '@/features/auth/AuthProvider';
import { Screen } from '@/features/common/Screen';
import { useCourseOverview } from '@/features/course/useCourseOverview';
import { lessonsProgressText, moduleTitle } from '@/features/course/format';
import { useProfileSummary } from '@/features/profile/useProfileSummary';
import { colors, opacity, radius, spacing } from '@/theme/tokens';

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const state = useProfileSummary();
  // O card "Continuar estudando" é opcional: se o curso falhar, o resto da tela segue.
  const course = useCourseOverview();

  const authName = (user?.user_metadata as { display_name?: string } | undefined)?.display_name;

  return (
    <Screen state={state}>
      {(p) => {
        const name = p.display_name ?? authName;
        const hasProgress =
          p.progress.lessons_completed > 0 ||
          p.progress.modules_completed > 0 ||
          p.current_level !== null;

        // Quem decide o que está em andamento ou disponível é o backend (state).
        const modules = course.data ?? [];
        const current =
          modules.find((m) => m.state === 'in_progress') ??
          modules.find((m) => m.state === 'available');
        const inProgress = current?.state === 'in_progress';

        return (
          <View style={styles.container}>
            <View style={styles.header}>
              <Text variant="display" accessibilityRole="header">
                {name ? `Olá, ${name}` : 'Olá'}
              </Text>
              <Text variant="bodyM" color="textSecondary">
                Vamos continuar de onde parou.
              </Text>
            </View>

            {!hasProgress ? (
              <NoProgressState onStart={() => router.push('/course')} />
            ) : (
              <>
                {current ? (
                  <View style={styles.section}>
                    <Text variant="heading3">
                      {inProgress ? 'Continuar estudando' : 'Próximo módulo'}
                    </Text>
                    <View style={styles.heroCard}>
                      <View style={styles.heroHeader}>
                        <Text variant="heading3" style={styles.flex}>
                          {moduleTitle(current)}
                        </Text>
                        {inProgress ? <Badge variant="in_progress" /> : null}
                      </View>
                      <Text variant="bodyM" color="textSecondary">
                        {lessonsProgressText(current)}
                      </Text>
                      <ProgressBar
                        value={current.progress_pct}
                        accessibilityLabel={`Progresso do módulo: ${Math.round(current.progress_pct)}%`}
                      />
                    </View>
                    {/* TODO: ir direto para a próxima aula quando a rota de aula existir. */}
                    <Button
                      label="Continuar aula"
                      onPress={() =>
                        router.push({
                          pathname: '/course/[moduleId]',
                          params: { moduleId: current.module_id, title: moduleTitle(current) },
                        })
                      }
                    />
                  </View>
                ) : null}

                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={
                    p.review.due_today > 0
                      ? `Revisão do dia, ${p.review.due_today} ${p.review.due_today === 1 ? 'item' : 'itens'} para revisar hoje`
                      : 'Revisão do dia, nada para revisar hoje'
                  }
                  onPress={() => router.navigate('/practice')}
                  style={({ pressed }) => [styles.card, { opacity: pressed ? opacity.pressed : 1 }]}
                >
                  <View style={styles.flex}>
                    <Text variant="heading3">Revisão do dia</Text>
                    <Text variant="bodyM" color="textSecondary">
                      {p.review.due_today > 0
                        ? `${p.review.due_today} ${p.review.due_today === 1 ? 'item' : 'itens'} para revisar hoje`
                        : 'Nada para revisar hoje'}
                    </Text>
                  </View>
                  {p.review.due_today > 0 ? (
                    <Badge
                      variant="in_progress"
                      label={`${p.review.due_today} ${p.review.due_today === 1 ? 'item' : 'itens'}`}
                    />
                  ) : null}
                </Pressable>
              </>
            )}

            <View style={styles.section}>
              <Text variant="heading3">Biblioteca</Text>
              <View style={styles.columns}>
                <LibraryShortcut
                  title="Gramática"
                  subtitle="Tópicos e regras"
                  onPress={() => router.navigate({ pathname: '/library', params: { type: 'grammar' } })}
                />
                <LibraryShortcut
                  title="Vocabulário"
                  subtitle="Palavras e usos"
                  onPress={() => router.navigate({ pathname: '/library', params: { type: 'vocabulary' } })}
                />
              </View>
            </View>
          </View>
        );
      }}
    </Screen>
  );
}

function LibraryShortcut({
  title,
  subtitle,
  onPress,
}: {
  title: string;
  subtitle: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${title}, ${subtitle}`}
      onPress={onPress}
      style={({ pressed }) => [styles.shortcut, { opacity: pressed ? opacity.pressed : 1 }]}
    >
      <Text variant="heading3">{title}</Text>
      <Text variant="caption" color="textSecondary">
        {subtitle}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.xl,
    paddingBottom: spacing['2xl'],
  },
  flex: { flex: 1 },
  header: {
    gap: spacing.xs,
  },
  section: {
    gap: spacing.md,
  },
  heroCard: {
    backgroundColor: colors.brandPrimarySubtle,
    borderColor: colors.brandPrimary,
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: spacing.xl,
    gap: spacing.md,
  },
  heroHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.bgSurface,
    borderColor: colors.borderDefault,
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: spacing.xl,
  },
  columns: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  shortcut: {
    flex: 1,
    backgroundColor: colors.bgSurface,
    borderColor: colors.borderDefault,
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.xs,
  },
});
