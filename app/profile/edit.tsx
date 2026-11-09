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

import { Button, Icon, Input, LoadingState, Text } from '@/components';
import { useProfileSummary } from '@/features/profile/useProfileSummary';
import { updateProfile } from '@/services/profile';
import { toAppError } from '@/services/errors';
import { colors, layout, opacity, radius, spacing } from '@/theme/tokens';

type EditFormProps = {
  initialName: string;
  email: string;
};

function EditProfileForm({ initialName, email }: EditFormProps) {
  const router = useRouter();
  const [name, setName] = useState(initialName);
  const [nameError, setNameError] = useState<string | undefined>();
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    const trimmed = name.trim();

    if (trimmed.length === 0) {
      setNameError('O nome não pode ficar em branco.');
      return;
    }
    if (trimmed.length > 60) {
      setNameError('O nome deve ter no máximo 60 caracteres.');
      return;
    }

    setNameError(undefined);
    setSaving(true);
    try {
      await updateProfile({ display_name: trimmed });
      Alert.alert('Perfil atualizado', 'Suas alterações foram salvas com sucesso.', [
        {
          text: 'OK',
          onPress: () => router.back(),
        },
      ]);
    } catch (e) {
      Alert.alert('Erro ao atualizar', toAppError(e).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      {/* Barra superior de navegação */}
      <View style={styles.topNav}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Voltar"
          onPress={() => router.back()}
          style={({ pressed }) => [styles.backButton, { opacity: pressed ? opacity.pressed : 1 }]}
        >
          <Icon name="arrow-left" color="textPrimary" size={layout.iconSize} />
        </Pressable>
        <Text variant="heading2" style={styles.navTitle}>
          Editar perfil
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.card}>
          <Input
            label="Nome de exibição"
            placeholder="Como gostaria de ser chamado"
            value={name}
            onChangeText={(v) => {
              setName(v);
              if (nameError) setNameError(undefined);
            }}
            error={nameError}
            maxLength={60}
          />

          <View style={styles.readOnlyField}>
            <Text variant="label" color="textSecondary">
              E-mail
            </Text>
            <View style={styles.readOnlyBox}>
              <Text variant="bodyL" color="textSecondary">
                {email}
              </Text>
            </View>
            <Text variant="caption" color="textSecondary">
              O e-mail da sua conta não pode ser alterado por aqui.
            </Text>
          </View>
        </View>

        <View style={styles.actionContainer}>
          <Button
            label="Salvar alterações"
            onPress={handleSave}
            loading={saving}
            disabled={saving}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

export default function EditProfileScreen() {
  const state = useProfileSummary();

  if (state.loading) {
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <LoadingState variant="spinner" message="Carregando perfil..." />
      </SafeAreaView>
    );
  }

  return (
    <EditProfileForm
      initialName={state.data?.display_name ?? ''}
      email={state.data?.email ?? '—'}
    />
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
  },
  card: {
    backgroundColor: colors.bgSurface,
    borderColor: colors.borderDefault,
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: spacing.xl,
    gap: spacing.lg,
  },
  readOnlyField: {
    gap: spacing.xs,
  },
  readOnlyBox: {
    minHeight: layout.inputHeight,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.borderDefault,
    backgroundColor: colors.bgElevated,
    paddingHorizontal: spacing.lg,
    justifyContent: 'center',
  },
  actionContainer: {
    marginTop: spacing.md,
  },
});
