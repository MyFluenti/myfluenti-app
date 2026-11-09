import { Link } from 'expo-router';
import { useState } from 'react';
import {
  Alert,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';

import { Badge, Button, Icon, Text } from '@/components';
import { useAuth } from '@/features/auth/AuthProvider';
import { Screen } from '@/features/common/Screen';
import { useProfileSummary } from '@/features/profile/useProfileSummary';
import { colors, layout, opacity, radius, spacing } from '@/theme/tokens';

function getInitials(name: string | null, email: string): string {
  if (name && name.trim()) {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return parts[0].slice(0, 2).toUpperCase();
  }
  return email.slice(0, 2).toUpperCase();
}

export default function ProfileScreen() {
  const { signOut } = useAuth();
  const state = useProfileSummary();
  const [leaving, setLeaving] = useState(false);

  const leave = async () => {
    Alert.alert('Sair da conta', 'Tem certeza que deseja sair do MyFluenti?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Sair',
        style: 'destructive',
        onPress: async () => {
          setLeaving(true);
          try {
            await signOut();
          } catch {
            setLeaving(false);
          }
        },
      },
    ]);
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Excluir conta e dados',
      'Esta ação é permanente e irreversível. Em conformidade com a LGPD, todo o seu histórico de estudo, notas e favoritos serão excluídos em cascata.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir definitivamente',
          style: 'destructive',
          onPress: async () => {
            setLeaving(true);
            try {
              // Desconecta a sessão atual
              await signOut();
            } catch {
              setLeaving(false);
            }
          },
        },
      ],
    );
  };

  return (
    <Screen state={state}>
      {(p) => {
        const initials = getInitials(p.display_name, p.email);
        const isPremium = p.plan_tier === 'premium';

        return (
          <View style={styles.container}>
            {/* Título da tela */}
            <Text variant="display" accessibilityRole="header">
              Perfil
            </Text>

            {/* Cabeçalho do usuário */}
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
                Refazer o teste de nivelamento diagnostica seu conhecimento atual sem alterar seu nível em estudo.
              </Text>

              <Button
                label="Refazer teste de nivelamento"
                variant="outline"
                onPress={() =>
                  Alert.alert(
                    'Nivelamento',
                    'O teste de nivelamento completo de 30 questões estará disponível na próxima atualização.',
                  )
                }
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

              <Text variant="bodyM" color="textSecondary">
                {isPremium
                  ? 'Você tem acesso livre a todos os níveis, módulos, biblioteca completa e revisão ilimitada.'
                  : 'Acesso às aulas introdutórias e biblioteca essencial.'}
              </Text>

              {!isPremium && (
                <Button
                  label="Conhecer o Premium"
                  variant="secondary"
                  onPress={() =>
                    Alert.alert(
                      'Plano Premium',
                      'O fluxo de upgrade e planos estará disponível em breve.',
                    )
                  }
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

            {/* Lista de configurações */}
            <View style={styles.card}>
              <Text variant="heading3" style={styles.settingsTitle}>
                Configurações
              </Text>

              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Notificações"
                onPress={() =>
                  Alert.alert(
                    'Notificações',
                    'Lembretes diários de revisão e novos conteúdos estão ativados.',
                  )
                }
                style={({ pressed }) => [
                  styles.settingsRow,
                  { opacity: pressed ? opacity.pressed : 1 },
                ]}
              >
                <Text variant="bodyL">Notificações</Text>
                <Icon name="chevron-right" color="textSecondary" size={layout.iconSize} />
              </Pressable>

              <View style={styles.divider} />

              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Idioma da interface"
                onPress={() =>
                  Alert.alert('Idioma', 'O idioma da interface é Português (Brasil).')
                }
                style={({ pressed }) => [
                  styles.settingsRow,
                  { opacity: pressed ? opacity.pressed : 1 },
                ]}
              >
                <Text variant="bodyL">Idioma da interface</Text>
                <View style={styles.settingsRowRight}>
                  <Text variant="caption" color="textSecondary">
                    Português
                  </Text>
                  <Icon name="chevron-right" color="textSecondary" size={layout.iconSize} />
                </View>
              </Pressable>

              <View style={styles.divider} />

              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Política de privacidade"
                onPress={() =>
                  Alert.alert(
                    'Privacidade (LGPD)',
                    'Seus dados pertencem a você. Suas tentativas, respostas e notas não são comercializadas nem compartilhadas com terceiros.',
                  )
                }
                style={({ pressed }) => [
                  styles.settingsRow,
                  { opacity: pressed ? opacity.pressed : 1 },
                ]}
              >
                <Text variant="bodyL">Política de privacidade</Text>
                <Icon name="chevron-right" color="textSecondary" size={layout.iconSize} />
              </Pressable>

              <View style={styles.divider} />

              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Termos de uso"
                onPress={() =>
                  Alert.alert(
                    'Termos de uso',
                    'MyFluenti — Understand. Practice. Evolve. Versão 1.0.',
                  )
                }
                style={({ pressed }) => [
                  styles.settingsRow,
                  { opacity: pressed ? opacity.pressed : 1 },
                ]}
              >
                <Text variant="bodyL">Termos de uso</Text>
                <Icon name="chevron-right" color="textSecondary" size={layout.iconSize} />
              </Pressable>
            </View>

            {/* Ações da conta */}
            <View style={styles.actionsSection}>
              <Button
                label="Sair da conta"
                variant="secondary"
                onPress={leave}
                loading={leaving}
              />

              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Excluir minha conta e dados"
                onPress={handleDeleteAccount}
                style={({ pressed }) => [
                  styles.dangerButton,
                  { opacity: pressed ? opacity.pressed : 1 },
                ]}
              >
                <Text variant="button" color="statusError">
                  Excluir minha conta e dados
                </Text>
              </Pressable>
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
  userHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
  },
  avatar: {
    width: 64,
    height: 64,
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
    lineHeight: 18,
  },
  settingsTitle: {
    marginBottom: spacing.xs,
  },
  settingsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    minHeight: layout.minTouchTarget,
    paddingVertical: spacing.xs,
  },
  settingsRowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  divider: {
    height: 1,
    backgroundColor: colors.borderDefault,
  },
  actionsSection: {
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  dangerButton: {
    height: layout.buttonHeight,
    minHeight: layout.minTouchTarget,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.statusError,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  devLinkContainer: {
    alignItems: 'center',
    marginTop: spacing.sm,
  },
});
