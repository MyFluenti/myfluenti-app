import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Button, Icon, Input, Text } from '@/components';
import { useAuth } from '@/features/auth/AuthProvider';
import { notify } from '@/features/common/dialogs';
import { KeyboardAwareScreen } from '@/features/common/KeyboardAwareScreen';
import { toAppError } from '@/services/errors';
import { colors, layout, opacity, radius, spacing } from '@/theme/tokens';

/** Palavra que o aluno precisa digitar, exatamente (maiúsculas, sem espaços). */
const CONFIRM_WORD = 'EXCLUIR';

const DELETED_ITEMS = [
  'Seu progresso nos cursos e nos níveis',
  'Suas tentativas de aulas e do teste de nivelamento',
  'Seu histórico e a fila de revisão',
  'Seus favoritos e suas notas',
  'Seu perfil e a sua conta de acesso',
];

export default function DeleteAccountScreen() {
  const router = useRouter();
  const { deleteAccount } = useAuth();
  const [typed, setTyped] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | undefined>();

  const canDelete = typed === CONFIRM_WORD && !deleting;

  const handleDelete = async () => {
    if (!canDelete) return;
    setError(undefined);
    setDeleting(true);
    try {
      await deleteAccount();
      // A sessão foi descartada: o guard do layout já leva à entrada de login.
      notify('Conta excluída', 'Sua conta e seus dados foram excluídos.');
    } catch (e) {
      setError(toAppError(e).message);
      setDeleting(false);
    }
  };

  return (
    <KeyboardAwareScreen>
      <View style={styles.topNav}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Voltar às configurações"
          disabled={deleting}
          onPress={() => router.back()}
          style={({ pressed }) => [styles.backButton, { opacity: pressed ? opacity.pressed : 1 }]}
        >
          <Icon name="arrow-left" color="textPrimary" size={layout.iconSize} />
        </Pressable>
        <Text variant="heading2" style={styles.navTitle}>
          Excluir conta
        </Text>
      </View>

      <View style={styles.content}>
        <View style={styles.card}>
          <Text variant="heading3" accessibilityRole="header">
            Esta ação não pode ser desfeita
          </Text>
          <Text variant="bodyL" color="textSecondary">
            Ao excluir sua conta, apagamos definitivamente:
          </Text>
          {DELETED_ITEMS.map((item) => (
            <Text key={item} variant="bodyL" color="textSecondary">
              {`•  ${item}`}
            </Text>
          ))}
        </View>

        <View style={styles.card}>
          <Input
            label={`Digite ${CONFIRM_WORD} para confirmar`}
            value={typed}
            onChangeText={(v) => {
              setTyped(v);
              if (error) setError(undefined);
            }}
            editable={!deleting}
            autoCapitalize="characters"
            autoCorrect={false}
            autoComplete="off"
            returnKeyType="done"
            onSubmitEditing={handleDelete}
            accessibilityHint="O botão de exclusão só é habilitado quando o texto é exatamente EXCLUIR"
          />
          {error ? (
            <View style={styles.errorBox} accessibilityLiveRegion="polite">
              <Text variant="bodyL" color="statusError">
                {error}
              </Text>
              <Text variant="caption" color="textSecondary">
                Sua conta não foi excluída. Você pode tentar de novo.
              </Text>
            </View>
          ) : null}
        </View>

        <View style={styles.actions}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Excluir minha conta e dados"
            accessibilityHint={canDelete ? 'Exclui a conta de forma definitiva' : `Digite ${CONFIRM_WORD} para habilitar`}
            accessibilityState={{ disabled: !canDelete, busy: deleting }}
            disabled={!canDelete}
            onPress={handleDelete}
            style={({ pressed }) => [
              styles.dangerButton,
              !canDelete && !deleting && styles.dangerButtonDisabled,
              { opacity: pressed ? opacity.pressed : 1 },
            ]}
          >
            <Text variant="bodyL" color={canDelete || deleting ? 'statusError' : 'textSecondary'}>
              {deleting ? 'Excluindo...' : error ? 'Tentar de novo' : 'Excluir minha conta e dados'}
            </Text>
          </Pressable>
          <Button
            label="Cancelar"
            variant="secondary"
            disabled={deleting}
            onPress={() => router.back()}
          />
        </View>
      </View>
    </KeyboardAwareScreen>
  );
}

const styles = StyleSheet.create({
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
  navTitle: { flex: 1 },
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
    gap: spacing.md,
  },
  errorBox: { gap: spacing.xs },
  actions: { gap: spacing.md },
  dangerButton: {
    height: layout.buttonHeight,
    minHeight: layout.minTouchTarget,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.statusError,
    backgroundColor: colors.statusErrorSubtle,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  dangerButtonDisabled: {
    borderColor: colors.borderDefault,
    backgroundColor: colors.bgSurface,
  },
});
