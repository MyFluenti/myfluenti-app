import { useRouter } from 'expo-router';
import { useEffect, useState, type ReactNode } from 'react';
import { AccessibilityInfo, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button, ErrorState, Icon, LoadingState, Text } from '@/components';
import { useAuth } from '@/features/auth/AuthProvider';
import { Avatar } from '@/features/avatar/Avatar';
import { BG, DEFAULT, HAIR, NAMES, OUTFIT, SKIN, random } from '@/features/avatar/render';
import type { AvatarConfig, AvatarPart } from '@/features/avatar/types';
import { toAvatarConfig } from '@/features/avatar/validate';
import { notify } from '@/features/common/dialogs';
import { useProfileSummary } from '@/features/profile/useProfileSummary';
import { updateMyAvatar } from '@/services/avatar';
import { toAppError } from '@/services/errors';
import { colors, layout, opacity, radius, spacing, type ColorToken } from '@/theme/tokens';

type TabKey = 'pele' | 'cabelo' | 'rosto' | 'extras' | 'cores';

const TABS: { key: TabKey; label: string }[] = [
  { key: 'pele', label: 'Pele' },
  { key: 'cabelo', label: 'Cabelo' },
  { key: 'rosto', label: 'Rosto' },
  { key: 'extras', label: 'Extras' },
  { key: 'cores', label: 'Cores' },
];

/** "Sem cabelo": a cor do cabelo não tem efeito. */
const BALD = 5;

export default function AvatarEditorScreen() {
  const router = useRouter();
  const { signOutLocal } = useAuth();
  const state = useProfileSummary();
  const unauthenticated = state.error?.kind === 'not_authenticated';

  // Sessão inválida: volta ao login em vez de mostrar erro (como na casca das telas).
  useEffect(() => {
    if (unauthenticated) signOutLocal().catch(() => {});
  }, [unauthenticated, signOutLocal]);

  let body;
  if (state.loading || unauthenticated) {
    body = <LoadingState variant="spinner" />;
  } else if (state.error) {
    body = (
      <View style={styles.stateBox}>
        <ErrorState
          title={state.error.kind === 'network' ? undefined : 'Algo deu errado'}
          message={state.error.kind === 'network' ? undefined : state.error.message}
          onRetry={state.reload}
        />
        <Button label="Cancelar" variant="secondary" onPress={() => router.back()} />
      </View>
    );
  } else if (state.data) {
    // Config inválida vinda do banco: parte do avatar padrão.
    body = (
      <Editor
        initial={toAvatarConfig(state.data.avatar_config) ?? DEFAULT}
        onClose={() => router.back()}
        onUnauthenticated={() => signOutLocal().catch(() => {})}
      />
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      {body}
    </SafeAreaView>
  );
}

type EditorProps = {
  initial: AvatarConfig;
  onClose: () => void;
  onUnauthenticated: () => void;
};

function Editor({ initial, onClose, onUnauthenticated }: EditorProps) {
  const [draft, setDraft] = useState<AvatarConfig>(initial);
  const [tab, setTab] = useState<TabKey>('cabelo');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | undefined>();

  const pick = (part: AvatarPart, index: number) => {
    if (saving) return;
    setError(undefined);
    setDraft((d) => ({ ...d, [part]: index }));
  };

  const handleSave = async () => {
    if (saving) return;
    setSaving(true);
    setError(undefined);
    try {
      await updateMyAvatar(draft);
      notify('Avatar salvo');
      onClose();
    } catch (e) {
      const appError = toAppError(e);
      if (appError.kind === 'not_authenticated') onUnauthenticated();
      setError(appError.message);
      AccessibilityInfo.announceForAccessibility(appError.message);
      setSaving(false);
    }
  };

  const section = (title: string, part: AvatarPart, body: ReactNode) => (
    <View style={styles.section} key={part}>
      <View style={styles.sectionHeader}>
        <Text variant="label" color="textSecondary">
          {title}
        </Text>
        <Text variant="caption" color="brandPrimaryLight">
          {NAMES[part][draft[part]]}
        </Text>
      </View>
      {body}
    </View>
  );

  const tiles = (part: AvatarPart) => (
    <View style={styles.grid}>
      {NAMES[part].map((name, i) => (
        <Tile
          key={name}
          name={name}
          selected={draft[part] === i}
          config={{ ...draft, [part]: i }}
          disabled={saving}
          onPress={() => pick(part, i)}
        />
      ))}
    </View>
  );

  const swatches = (part: AvatarPart, palette: string[], check: ColorToken, disabled = false) => (
    <View style={styles.swatches}>
      {NAMES[part].map((name, i) => (
        <Swatch
          key={name}
          name={name}
          color={palette[i]}
          check={check}
          selected={draft[part] === i}
          disabled={disabled || saving}
          onPress={() => pick(part, i)}
        />
      ))}
    </View>
  );

  return (
    <View style={styles.editor}>
      <View style={styles.bar}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Cancelar"
          accessibilityHint="Descarta as mudanças e volta ao perfil"
          accessibilityState={{ disabled: saving }}
          disabled={saving}
          onPress={onClose}
          style={({ pressed }) => [styles.barButton, { opacity: pressed ? opacity.pressed : 1 }]}
        >
          <Text variant="bodyM" color="textSecondary">
            Cancelar
          </Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Sortear"
          accessibilityHint="Escolhe peças ao acaso"
          accessibilityState={{ disabled: saving }}
          disabled={saving}
          onPress={() => {
            setError(undefined);
            setDraft(random());
          }}
          style={({ pressed }) => [styles.barButton, { opacity: pressed ? opacity.pressed : 1 }]}
        >
          <Icon name="dice" color="brandPrimaryLight" size={layout.iconSize - spacing.xs} />
          <Text variant="label" color="brandPrimaryLight">
            Sortear
          </Text>
        </Pressable>
      </View>

      <View style={styles.preview}>
        <View style={styles.previewRing}>
          <Avatar
            config={draft}
            size={layout.avatarPreview}
            accessibilityLabel="Pré-visualização do avatar"
          />
        </View>
      </View>

      <View accessibilityRole="tablist" style={styles.tabsWrap}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabs}
        >
          {TABS.map((t) => {
            const selected = tab === t.key;
            return (
              <Pressable
                key={t.key}
                accessibilityRole="tab"
                accessibilityLabel={t.label}
                accessibilityState={{ selected }}
                onPress={() => setTab(t.key)}
                style={({ pressed }) => [
                  styles.tab,
                  selected && styles.tabSelected,
                  { opacity: pressed ? opacity.pressed : 1 },
                ]}
              >
                <Text variant="label" color={selected ? 'brandPrimaryLight' : 'textSecondary'}>
                  {t.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      <ScrollView
        style={styles.panel}
        contentContainerStyle={styles.panelContent}
        accessibilityRole="none"
      >
        {tab === 'pele' && section('Tom de pele', 'skin', swatches('skin', SKIN, 'textOnPrimary'))}
        {tab === 'cabelo' && (
          <>
            {section('Estilo', 'hair', tiles('hair'))}
            {section(
              'Cor do cabelo',
              'hairColor',
              swatches('hairColor', HAIR, 'textOnPrimary', draft.hair === BALD),
            )}
          </>
        )}
        {tab === 'rosto' && (
          <>
            {section('Olhos', 'eyes', tiles('eyes'))}
            {section('Boca', 'mouth', tiles('mouth'))}
          </>
        )}
        {tab === 'extras' && section('Acessório', 'acc', tiles('acc'))}
        {tab === 'cores' && (
          <>
            {section('Roupa', 'outfit', swatches('outfit', OUTFIT, 'textOnPrimary'))}
            {section('Fundo', 'bg', swatches('bg', BG, 'textPrimary'))}
          </>
        )}
      </ScrollView>

      {error ? (
        <View style={styles.errorBox} accessibilityLiveRegion="polite">
          <Text variant="bodyM" color="statusError">
            {error}
          </Text>
        </View>
      ) : null}

      <Button label="Salvar avatar" loading={saving} onPress={handleSave} style={styles.save} />
    </View>
  );
}

type TileProps = {
  name: string;
  selected: boolean;
  config: AvatarConfig;
  disabled: boolean;
  onPress: () => void;
};

function Tile({ name, selected, config, disabled, onPress }: TileProps) {
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityLabel={name}
      accessibilityState={{ selected, checked: selected, disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.tile,
        selected && styles.tileSelected,
        { opacity: pressed ? opacity.pressed : 1 },
      ]}
    >
      <Avatar config={config} size={layout.avatarTile} accessibilityLabel={name} />
      <Text variant="caption" color={selected ? 'brandPrimaryLight' : 'textSecondary'}>
        {name}
      </Text>
      {selected ? (
        <View style={styles.tileCheck}>
          <Icon name="check" color="textOnPrimary" size={spacing.md} />
        </View>
      ) : null}
    </Pressable>
  );
}

type SwatchProps = {
  name: string;
  color: string;
  check: ColorToken;
  selected: boolean;
  disabled: boolean;
  onPress: () => void;
};

function Swatch({ name, color, check, selected, disabled, onPress }: SwatchProps) {
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityLabel={name}
      accessibilityState={{ selected, checked: selected, disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.swatch,
        selected && styles.swatchSelected,
        { opacity: pressed ? opacity.pressed : disabled ? opacity.muted : 1 },
      ]}
    >
      {/* A cor vem da paleta do avatar, não dos tokens do app. */}
      <View style={[styles.swatchColor, { backgroundColor: color }]}>
        {selected ? <Icon name="check" color={check} size={spacing.lg} /> : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bgBase },
  stateBox: { padding: layout.screenPaddingX, gap: spacing.md },
  editor: {
    flex: 1,
    paddingHorizontal: layout.screenPaddingX,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
  },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: layout.minTouchTarget,
  },
  barButton: {
    minHeight: layout.minTouchTarget,
    minWidth: layout.minTouchTarget,
    paddingHorizontal: spacing.xs,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  preview: {
    alignItems: 'center',
    marginTop: spacing.md,
    marginBottom: spacing.xl,
  },
  previewRing: {
    padding: spacing.xs,
    borderRadius: radius.full,
    borderWidth: layout.borderWidth * 2,
    borderColor: colors.brandPrimary,
  },
  tabsWrap: { flexGrow: 0 },
  tabs: { gap: spacing.sm },
  tab: {
    height: layout.minTouchTarget,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.full,
    borderWidth: layout.borderWidth,
    borderColor: colors.borderDefault,
    backgroundColor: colors.bgSurface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabSelected: {
    backgroundColor: colors.brandPrimarySubtle,
    borderColor: colors.brandPrimary,
  },
  panel: {
    flex: 1,
    marginTop: spacing.lg,
    backgroundColor: colors.bgSurface,
    borderColor: colors.borderDefault,
    borderWidth: layout.borderWidth,
    borderRadius: radius.lg,
  },
  panelContent: { padding: spacing.lg, gap: spacing.xl },
  section: { gap: spacing.md },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  tile: {
    flexGrow: 1,
    flexBasis: '40%',
    minHeight: layout.minTouchTarget,
    alignItems: 'center',
    gap: spacing.xs,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
    borderRadius: radius.md,
    borderWidth: layout.borderWidth * 2,
    borderColor: 'transparent',
    backgroundColor: colors.bgElevated,
  },
  tileSelected: {
    borderColor: colors.brandPrimary,
    backgroundColor: colors.brandPrimarySubtle,
  },
  tileCheck: {
    position: 'absolute',
    top: spacing.xs,
    right: spacing.xs,
    width: spacing.xl - spacing.xs / 2,
    height: spacing.xl - spacing.xs / 2,
    borderRadius: radius.full,
    backgroundColor: colors.brandPrimary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  swatches: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  swatch: {
    width: layout.minTouchTarget,
    height: layout.minTouchTarget,
    borderRadius: radius.full,
    borderWidth: layout.borderWidth * 2,
    borderColor: 'transparent',
    padding: spacing.xs / 2,
  },
  swatchSelected: { borderColor: colors.brandPrimaryLight },
  swatchColor: {
    flex: 1,
    borderRadius: radius.full,
    borderWidth: layout.borderWidth,
    borderColor: colors.borderDefault,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorBox: { marginTop: spacing.md },
  save: { marginTop: spacing.lg },
});
