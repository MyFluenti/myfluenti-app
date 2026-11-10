import { Link, useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useRef } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Badge, Button, Icon, Text } from '@/components';
import { Avatar } from '@/features/avatar/Avatar';
import { toAvatarConfig } from '@/features/avatar/validate';
import { notify } from '@/features/common/dialogs';
import { Screen } from '@/features/common/Screen';
import { useProfileSummary } from '@/features/profile/useProfileSummary';
import { colors, layout, opacity, radius, spacing, typography } from '@/theme/tokens';

export default function ProfileScreen() {
  const router = useRouter();
  const state = useProfileSummary();
  const { refresh } = state;
  const firstFocus = useRef(true);

  // Ao voltar do editor de avatar (ou de qualquer tela), recarrega mantendo o conteúdo.
  useFocusEffect(
    useCallback(() => {
      if (firstFocus.current) {
        firstFocus.current = false;
        return;
      }
      refresh();
    }, [refresh]),
  );

  return (
    <Screen state={state}>
      {(p) => {
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
                <View style={styles.avatarWrap}>
                  <Avatar config={toAvatarConfig(p.avatar_config)} size={layout.avatarProfile} />
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Editar avatar"
                    onPress={() => router.push('/profile/avatar')}
                    style={({ pressed }) => [
                      styles.editBadge,
                      { opacity: pressed ? opacity.pressed : 1 },
                    ]}
                  >
                    <Icon name="pencil" color="textOnPrimary" size={spacing.xl} />
                  </Pressable>
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

            {/* Card: nível em estudo */}
            <View style={styles.card}>
              <View style={styles.rowBetween}>
                <Text variant="bodyL" color="textSecondary">
                  Seu nível de estudo
                </Text>
                {p.current_level ? (
                  <View style={styles.levelBadge}>
                    <Text variant="label" color="brandPrimaryLight">
                      {p.current_level.code}
                    </Text>
                  </View>
                ) : (
                  <Text variant="label" color="textSecondary">
                    Sem nível
                  </Text>
                )}
              </View>

              <Text variant="caption" color="textSecondary">
                {p.placement.completed
                  ? 'Refazer o teste não muda o nível em que você estuda.'
                  : 'O teste de nivelamento ajuda a descobrir por onde começar.'}
              </Text>

              {/* TODO: abrir o nivelamento quando a rota existir. */}
              <Button
                label={p.placement.completed ? 'Refazer nivelamento' : 'Fazer o nivelamento'}
                variant="outline"
                onPress={() => notify('Nivelamento', 'O teste de nivelamento estará disponível em breve.')}
              />
            </View>

            {/* Card: plano atual (só o nome do plano, sem descrever o escopo) */}
            <View style={[styles.card, styles.rowBetween]}>
              <Text variant="bodyL" color="textSecondary">
                Plano atual
              </Text>
              <Badge variant={isPremium ? 'premium' : 'free'} />
            </View>

            {/* Card: progresso */}
            <View style={styles.card}>
              <Text variant="heading3">Seu progresso</Text>
              <View style={styles.rowBetween}>
                <Text variant="bodyM" color="textSecondary">
                  Aulas concluídas
                </Text>
                <Text variant="label">{p.progress.lessons_completed}</Text>
              </View>
              <View style={styles.rowBetween}>
                <Text variant="bodyM" color="textSecondary">
                  Módulos concluídos
                </Text>
                <Text variant="label">{p.progress.modules_completed}</Text>
              </View>
              <View style={styles.rowBetween}>
                <Text variant="bodyM" color="textSecondary">
                  Itens em revisão
                </Text>
                <Text variant="label">{p.review.total_scheduled}</Text>
              </View>
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
    alignItems: 'center',
    gap: spacing.md,
  },
  avatarWrap: {
    width: layout.avatarProfile,
    height: layout.avatarProfile,
  },
  editBadge: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: layout.minTouchTarget,
    height: layout.minTouchTarget,
    borderRadius: radius.full,
    backgroundColor: colors.brandPrimary,
    borderWidth: layout.borderWidth * 3,
    borderColor: colors.bgSurface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userInfo: {
    alignItems: 'center',
    gap: spacing.xs,
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.md,
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
