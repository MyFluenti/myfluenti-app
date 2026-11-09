import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import {
  Button,
  NoProgressState,
  Text,
} from '@/components';
import { useAuth } from '@/features/auth/AuthProvider';
import { Screen } from '@/features/common/Screen';
import { useProfileSummary } from '@/features/profile/useProfileSummary';
import { colors, radius, spacing } from '@/theme/tokens';

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const state = useProfileSummary();

  const authName = (user?.user_metadata as { display_name?: string } | undefined)?.display_name;

  return (
    <Screen state={state}>
      {(p) => {
        const name = p.display_name ?? authName;
        const hasProgress =
          p.progress.lessons_completed > 0 ||
          p.progress.modules_completed > 0 ||
          p.current_level !== null;

        return (
          <View style={styles.container}>
            {/* Cabeçalho de Boas-Vindas */}
            <View style={styles.header}>
              <Text variant="display" accessibilityRole="header">
                Início
              </Text>
              <Text variant="bodyL" color="textSecondary">
                {name ? `Olá, ${name}.` : 'Olá.'} Vamos entender o inglês, um passo de cada vez.
              </Text>
            </View>

            {!hasProgress ? (
              <NoProgressState onStart={() => router.push('/course')} />
            ) : (
              <View style={styles.content}>
                {/* Card 1: Continuar Curso */}
                <View style={styles.heroCard}>
                  <View style={styles.cardHeader}>
                    <Text variant="caption" color="brandPrimaryLight">
                      SEU CURSO
                    </Text>
                    <Text variant="heading2">
                      {p.current_level
                        ? `${p.current_level.code} · ${p.current_level.title}`
                        : 'Curso em andamento'}
                    </Text>
                    <Text variant="bodyM" color="textSecondary">
                      {p.progress.lessons_completed}{' '}
                      {p.progress.lessons_completed === 1 ? 'aula concluída' : 'aulas concluídas'} ·{' '}
                      {p.progress.modules_completed}{' '}
                      {p.progress.modules_completed === 1 ? 'módulo concluído' : 'módulos concluídos'}
                    </Text>
                  </View>
                  <Button
                    label="Continuar curso"
                    onPress={() => router.push('/course')}
                  />
                </View>

                {/* Card 2: Revisão do Dia (se houver itens) */}
                {p.review.due_today > 0 && (
                  <View style={styles.card}>
                    <View style={styles.cardHeader}>
                      <Text variant="caption" color="textSecondary">
                        REVISÃO ESPAÇADA
                      </Text>
                      <Text variant="heading2">
                        {p.review.due_today}{' '}
                        {p.review.due_today === 1
                          ? 'item para revisar hoje'
                          : 'itens para revisar hoje'}
                      </Text>
                      <Text variant="bodyM" color="textSecondary">
                        Mantenha o conteúdo estudado ativo na sua memória.
                      </Text>
                    </View>
                    <Button
                      label="Revisar agora"
                      variant="secondary"
                      onPress={() => router.push('/review/session')}
                    />
                  </View>
                )}

                {/* Card 3: Biblioteca Livre */}
                <View style={styles.card}>
                  <View style={styles.cardHeader}>
                    <Text variant="caption" color="textSecondary">
                      CONSULTA LIVRE
                    </Text>
                    <Text variant="heading2">Biblioteca de estudos</Text>
                    <Text variant="bodyM" color="textSecondary">
                      Consulte regras gramaticais e expanda seu vocabulário sem seguir o curso sequencial.
                    </Text>
                  </View>
                  <Button
                    label="Explorar biblioteca"
                    variant="outline"
                    onPress={() => router.push('/library')}
                  />
                </View>
              </View>
            )}
          </View>
        );
      }}
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.xl,
    paddingBottom: spacing['2xl'],
  },
  header: {
    gap: spacing.xs,
  },
  content: {
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
  card: {
    backgroundColor: colors.bgSurface,
    borderColor: colors.borderDefault,
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: spacing.xl,
    gap: spacing.lg,
  },
  cardHeader: {
    gap: spacing.xs,
  },
});
