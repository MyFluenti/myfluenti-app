import Constants from 'expo-constants';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button, Icon, Text } from '@/components';
import { useAuth } from '@/features/auth/AuthProvider';
import { confirm } from '@/features/common/dialogs';
import { colors, layout, opacity, radius, spacing } from '@/theme/tokens';

/** Linha desabilitada: o recurso ainda não existe. Sem promessa de funcionalidade. */
function ComingSoonRow({ label }: { label: string }) {
  return (
    <View
      style={styles.settingsRow}
      accessible
      accessibilityLabel={`${label}, em breve`}
      accessibilityState={{ disabled: true }}
    >
      <Text variant="bodyL" color="textSecondary">
        {label}
      </Text>
      <Text variant="caption" color="textSecondary">
        Em breve
      </Text>
    </View>
  );
}

export default function SettingsScreen() {
  const router = useRouter();
  const { signOut } = useAuth();
  const [leaving, setLeaving] = useState(false);
  const version = Constants.expoConfig?.version ?? '—';

  const leave = async () => {
    const ok = await confirm({
      title: 'Sair da conta',
      message: 'Tem certeza que deseja sair do MyFluenti?',
      confirmLabel: 'Sair',
      destructive: true,
    });
    if (!ok) return;
    setLeaving(true);
    try {
      await signOut();
    } catch {
      setLeaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
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
        <View style={styles.card}>
          <Text variant="caption" color="textSecondary">
            PREFERÊNCIAS
          </Text>
          <ComingSoonRow label="Notificações" />
          <View style={styles.divider} />
          <ComingSoonRow label="Idioma da interface" />
        </View>

        <View style={styles.card}>
          <Text variant="caption" color="textSecondary">
            LEGAL E SUPORTE
          </Text>
          <ComingSoonRow label="Política de privacidade" />
          <View style={styles.divider} />
          <ComingSoonRow label="Termos de uso" />
          <View style={styles.divider} />
          <View style={styles.settingsRow}>
            <Text variant="bodyL">Versão do aplicativo</Text>
            <Text variant="caption" color="textSecondary">
              {version}
            </Text>
          </View>
        </View>

        <View style={styles.actionsSection}>
          <Button label="Sair da conta" variant="secondary" onPress={leave} loading={leaving} />

          <Button
            label="Excluir minha conta e dados"
            variant="secondary"
            onPress={() => router.push('/profile/delete-account')}
            accessibilityHint="Abre uma tela de confirmação. A exclusão é definitiva."
          />
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
