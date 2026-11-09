import { Link, useRouter } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { Badge, Button, Icon, Text } from '@/components';
import { notify } from '@/features/common/dialogs';
import { Screen } from '@/features/common/Screen';
import { useProfileSummary } from '@/features/profile/useProfileSummary';
import { colors, layout, opacity, radius, spacing, typography } from '@/theme/tokens';

/** Iniciais do nome; sem nome, do e-mail; sem nenhum dos dois, "?". */
function getInitials(name: string | null | undefined, email: string | null | undefined): string {
  const trimmed = name?.trim();
  if (trimmed) {
    const parts = trimmed.split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return parts[0].slice(0, 2).toUpperCase();
  }
  const fromEmail = email?.trim().slice(0, 2).toUpperCase();
  return fromEmail || '?';
}

export default function ProfileScreen() {
  const router = useRouter();
  const state = useProfileSummary();

  return (
    <Screen state={state}>
      {(p) => {
        const initials = getInitials(p.display_name, p.email);
        const isPremium = p.plan_tier === 'premium';

        return (
          <View style={styles.container}>
            {/* Cabeçalho com Título e Engrenagem de Configurações */}
            <View style={styles.headerRow}>
              <Text variant="display" accessibilityRole="header">
                Perfil
              </Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Abrir configurações"
                onPress={() => router.push('/profile/settings')}
                style={({ pressed }) => [
                  styles.settingsButton,
                  { opacity: pressed ? opacity.pressed : 1 },
                ]}
              >
                <Icon name="settings" color="textPrimary" size={layout.iconSize} />
              </Pressable>
            </View>

            {/* Cabeçalho do usuário com botão Editar Perfil */}
            <View style={styles.userCard}>
              <View style={styles.userHeader}>
                <View style={styles.avatar}>
                  <Text variant="heading2" color="brandPrimaryLight">
                    {initials}
                  </Text>
                </View>
                <View style={styles.userInfo}>
                  <Text variant="heading2" numberOfLines={1}>
                    {p.display_name ?? 'Estudante'}
                  </Text>
                  <Text variant="bodyM" color="textSecondary" numberOfLines={1}>
                    {p.email}
                  </Text>
                </View>
              </View>

              <Button
                label="Editar perfil"
                variant="outline"
                onPress={() => router.push('/profile/edit')}
              />
            </View>

            {/* Card: Seu nível atual */}
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.cardTitleGroup}>
                  <Text variant="caption" color="textSecondary">
                    NÍVEL EM ESTUDO
                  </Text>
                  <Text variant="heading2">
                    {p.current_level
                      ? `${p.current_level.code} · ${p.current_level.title}`
                      : 'Nenhum nível definido'}
                  </Text>
                </View>
                {p.current_level ? (
                  <View style={styles.levelBadge}>
                    <Text variant="heading3" color="brandPrimaryLight">
                      {p.current_level.code}
                    </Text>
                  </View>
                ) : null}
              </View>

              <Text variant="bodyM" color="textSecondary">
                {p.placement.completed
                  ? 'Refazer o teste de nivelamento diagnostica seu conhecimento atual sem alterar seu nível em estudo.'
                  : 'O teste de nivelamento ajuda a descobrir por onde começar.'}
              </Text>

              {/* TODO: abrir o nivelamento quando a rota existir. */}
              <Button
                label={p.placement.completed ? 'Refazer o teste de nivelamento' : 'Fazer o nivelamento'}
                variant="outline"
                onPress={() => notify('Nivelamento', 'O teste de nivelamento estará disponível em breve.')}
              />
            </View>

            {/* Card: Plano */}
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.cardTitleGroup}>
                  <Text variant="caption" color="textSecondary">
                    PLANO DE ACESSO
                  </Text>
                  <Text variant="heading2">
                    {isPremium ? 'Plano Premium' : 'Plano Gratuito'}
                  </Text>
                </View>
                <Badge variant={isPremium ? 'premium' : 'free'} />
              </View>

              {!isPremium && (
                <Button
                  label="Conhecer o Premium"
                  variant="secondary"
                  onPress={() => notify('Plano Premium', 'A assinatura ainda não está disponível no app.')}
                />
              )}
            </View>

            {/* Card: Seu progresso geral */}
            <View style={styles.card}>
              <Text variant="heading3">Seu progresso</Text>

              <View style={styles.statsGrid}>
                <View style={styles.statBox}>
                  <Text variant="caption" color="textSecondary">
                    Aulas concluídas
                  </Text>
                  <Text variant="heading1">{p.progress.lessons_completed}</Text>
                </View>
                <View style={styles.statBox}>
                  <Text variant="caption" color="textSecondary">
                    Módulos concluídos
                  </Text>
                  <Text variant="heading1">{p.progress.modules_completed}</Text>
                </View>
                <View style={styles.statBox}>
                  <Text variant="caption" color="textSecondary">
                    Na revisão
                  </Text>
                  <Text variant="heading1">{p.review.total_scheduled}</Text>
                </View>
                <View style={styles.statBox}>
                  <Text variant="caption" color="textSecondary">
                    Favoritos
                  </Text>
                  <Text variant="heading1">{p.favorites_count}</Text>
                </View>
              </View>

              <View style={styles.divider} />

              <Text variant="caption" color="textSecondary" style={styles.masteryDisclaimer}>
                * O domínio de conteúdo é um indicador pedagógico de estudo e fixação, não medindo fluência real no idioma.
              </Text>
            </View>

            {/* Showcase link em DEV */}
            {__DEV__ ? (
              <View style={styles.devLinkContainer}>
                <Link href="/dev/showcase" accessibilityRole="link">
                  <Text variant="caption" color="textSecondary">
                    Dev: showcase de componentes
                  </Text>
                </Link>
              </View>
            ) : null}
          </View>
        );
      }}
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.xl,
    paddingBottom: spacing['3xl'],
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  settingsButton: {
    minWidth: layout.minTouchTarget,
    minHeight: layout.minTouchTarget,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userCard: {
    backgroundColor: colors.bgSurface,
    borderColor: colors.borderDefault,
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: spacing.xl,
    gap: spacing.lg,
  },
  userHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
  },
  avatar: {
    width: layout.avatarSize,
    height: layout.avatarSize,
    borderRadius: radius.full,
    backgroundColor: colors.brandPrimarySubtle,
    borderWidth: 1,
    borderColor: colors.brandPrimary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userInfo: {
    flex: 1,
    gap: spacing.xs,
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  cardTitleGroup: {
    flex: 1,
    gap: spacing.xs,
  },
  levelBadge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    backgroundColor: colors.brandPrimarySubtle,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.brandPrimary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  statBox: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: colors.bgElevated,
    borderRadius: radius.md,
    padding: spacing.md,
    gap: spacing.xs,
  },
  masteryDisclaimer: {
    lineHeight: typography.caption.lineHeight,
  },
  divider: {
    height: 1,
    backgroundColor: colors.borderDefault,
  },
  devLinkContainer: {
    alignItems: 'center',
    marginTop: spacing.sm,
  },
});
