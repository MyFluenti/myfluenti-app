import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button, Icon, Text } from '@/components';
import { useAuth } from '@/features/auth/AuthProvider';
import { colors, layout, opacity, radius, spacing } from '@/theme/tokens';

export default function SettingsScreen() {
  const router = useRouter();
  const { signOut } = useAuth();
  const [leaving, setLeaving] = useState(false);

  const leave = () => {
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
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      {/* Barra superior de navegação */}
      <View style={styles.topNav}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Voltar ao perfil"
          onPress={() => router.back()}
          style={({ pressed }) => [styles.backButton, { opacity: pressed ? opacity.pressed : 1 }]}
        >
          <Icon name="arrow-left" color="textPrimary" size={layout.iconSize} />
        </Pressable>
        <Text variant="heading2" style={styles.navTitle}>
          Configurações
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Seção 1: Preferências */}
        <View style={styles.card}>
          <Text variant="caption" color="textSecondary">
            PREFERÊNCIAS
          </Text>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Notificações"
            onPress={() =>
              Alert.alert(
                'Notificações',
                'Lembretes diários de revisão e novos conteúdos estão ativados no aparelho.',
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
        </View>

        {/* Seção 2: Sobre e Legal */}
        <View style={styles.card}>
          <Text variant="caption" color="textSecondary">
            LEGAL E SUPORTE
          </Text>

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
                'MyFluenti — Understand. Practice. Evolve. Versão 1.0.0.',
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

          <View style={styles.divider} />

          <View style={styles.settingsRow}>
            <Text variant="bodyL">Versão do aplicativo</Text>
            <Text variant="caption" color="textSecondary">
              1.0.0 (MVP)
            </Text>
          </View>
        </View>

        {/* Seção 3: Ações da conta */}
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
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.bgBase,
  },
  topNav: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: layout.screenPaddingX,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderDefault,
  },
  backButton: {
    minWidth: layout.minTouchTarget,
    minHeight: layout.minTouchTarget,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navTitle: {
    flex: 1,
  },
  content: {
    padding: layout.screenPaddingX,
    gap: spacing.xl,
    paddingBottom: spacing['3xl'],
  },
  card: {
    backgroundColor: colors.bgSurface,
    borderColor: colors.borderDefault,
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: spacing.xl,
    gap: spacing.md,
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
    marginTop: spacing.md,
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
});
