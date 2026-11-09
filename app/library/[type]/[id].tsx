import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import {
  Alert,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';

import {
  Badge,
  Icon,
  ProgressBar,
  Text,
} from '@/components';
import { Screen } from '@/features/common/Screen';
import { useLibraryItem } from '@/features/library/useLibraryItem';
import {
  addPhraseFavorite,
  removePhraseFavorite,
  toggleWordFavorite,
} from '@/services/favorites';
import { toAppError } from '@/services/errors';
import { colors, layout, opacity, radius, spacing } from '@/theme/tokens';
import type {
  LibraryGrammarItem,
  LibraryType,
  LibraryVocabularyItem,
} from '@/types/contract';

export default function LibraryItemDetailScreen() {
  const router = useRouter();
  const { type, id } = useLocalSearchParams<{ type: LibraryType; id: string }>();

  const state = useLibraryItem(type, id);

  // Estados locais para favoritos reativos
  const [wordFavorite, setWordFavorite] = useState<boolean | null>(null);
  const [favoriteExamples, setFavoriteExamples] = useState<Record<string, boolean>>({});

  const handleToggleWordFav = async (vocabId: string, currentVal: boolean) => {
    const nextVal = !currentVal;
    setWordFavorite(nextVal);
    try {
      await toggleWordFavorite(vocabId, nextVal);
    } catch (e) {
      setWordFavorite(currentVal);
      Alert.alert('Erro ao favoritar', toAppError(e).message);
    }
  };

  const handleToggleExampleFav = async (exampleId: string, currentVal: boolean) => {
    const nextVal = !currentVal;
    setFavoriteExamples((prev) => ({ ...prev, [exampleId]: nextVal }));
    try {
      if (nextVal) {
        await addPhraseFavorite(exampleId);
      } else {
        await removePhraseFavorite(exampleId);
      }
    } catch (e) {
      setFavoriteExamples((prev) => ({ ...prev, [exampleId]: currentVal }));
      Alert.alert('Erro ao favoritar frase', toAppError(e).message);
    }
  };

  return (
    <Screen state={state}>
      {(item) => {
        const isGrammar = item.type === 'grammar';
        const grammar = isGrammar ? (item as LibraryGrammarItem) : null;
        const vocab = !isGrammar ? (item as LibraryVocabularyItem) : null;

        const isWordFav =
          vocab !== null
            ? wordFavorite !== null
              ? wordFavorite
              : vocab.is_favorite
            : false;

        return (
          <>
            {/* Cabeçalho de navegação */}
            <View style={styles.topNav}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Voltar"
                onPress={() => router.back()}
                style={({ pressed }) => [styles.backButton, { opacity: pressed ? opacity.pressed : 1 }]}
              >
                <Icon name="arrow-left" color="textPrimary" size={layout.iconSize} />
              </Pressable>
              <Text variant="heading3" style={styles.navTitle} numberOfLines={1}>
                {isGrammar ? 'Gramática' : 'Vocabulário'}
              </Text>
              <Badge variant={item.access_tier === 'premium' ? 'premium' : 'free'} />
            </View>

            {/* Conteúdo de Gramática */}
            {grammar && (
              <View style={styles.detailContainer}>
                <View style={styles.mainInfo}>
                  <Text variant="display">{grammar.title}</Text>
                  {grammar.category ? (
                    <Text variant="label" color="textSecondary">
                      {grammar.category}
                    </Text>
                  ) : null}
                  {grammar.summary ? (
                    <Text variant="bodyL" color="textSecondary">
                      {grammar.summary}
                    </Text>
                  ) : null}
                </View>

                {grammar.mastery && (
                  <View style={styles.card}>
                    <Text variant="heading3">Domínio do tópico</Text>
                    <View style={styles.masteryRow}>
                      <Text variant="caption" color="textSecondary">
                        Aproveitamento acumulado
                      </Text>
                      <Text variant="heading3" color="brandPrimaryLight">
                        {Math.round(grammar.mastery.pct)}%
                      </Text>
                    </View>
                    <ProgressBar
                      value={grammar.mastery.pct}
                      accessibilityLabel={`Domínio: ${Math.round(grammar.mastery.pct)}%`}
                    />
                    <Text variant="caption" color="textSecondary">
                      {grammar.mastery.correct} acertos em {grammar.mastery.attempts} tentativas
                    </Text>
                  </View>
                )}

                {/* Exibição do conteúdo explicativo se disponível */}
                {typeof grammar.content === 'string' && grammar.content.length > 0 && (
                  <View style={styles.card}>
                    <Text variant="bodyL">{grammar.content}</Text>
                  </View>
                )}
              </View>
            )}

            {/* Conteúdo de Vocabulário */}
            {vocab && (
              <View style={styles.detailContainer}>
                <View style={styles.mainInfo}>
                  <View style={styles.vocabHeaderRow}>
                    <Text variant="display" style={styles.vocabLemma}>
                      {vocab.lemma}
                    </Text>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={isWordFav ? 'Desfavoritar palavra' : 'Favoritar palavra'}
                      onPress={() => handleToggleWordFav(vocab.id, isWordFav)}
                      style={({ pressed }) => [
                        styles.favButton,
                        { opacity: pressed ? opacity.pressed : 1 },
                      ]}
                    >
                      <Text variant="button" color={isWordFav ? 'statusWarning' : 'textSecondary'}>
                        {isWordFav ? '★ Favorito' : '☆ Favoritar'}
                      </Text>
                    </Pressable>
                  </View>

                  {vocab.part_of_speech ? (
                    <Text variant="label" color="textSecondary">
                      {vocab.part_of_speech}
                    </Text>
                  ) : null}

                  <Text variant="heading1" color="brandPrimaryLight">
                    {vocab.meaning_pt}
                  </Text>
                </View>

                {/* Formas verbais / variações */}
                {vocab.forms.length > 0 && (
                  <View style={styles.card}>
                    <Text variant="heading3">Formas</Text>
                    <View style={styles.formsGrid}>
                      {vocab.forms.map((f, i) => (
                        <View key={i} style={styles.formItem}>
                          <Text variant="caption" color="textSecondary">
                            {f.label}
                          </Text>
                          <Text variant="bodyL">{f.text}</Text>
                          {f.meaning_pt ? (
                            <Text variant="caption" color="textSecondary">
                              {f.meaning_pt}
                            </Text>
                          ) : null}
                        </View>
                      ))}
                    </View>
                  </View>
                )}

                {/* Exemplos práticos */}
                {vocab.examples.length > 0 && (
                  <View style={styles.card}>
                    <Text variant="heading3">Frases de exemplo</Text>
                    <View style={styles.examplesList}>
                      {vocab.examples.map((ex) => {
                        const isPhraseFav =
                          favoriteExamples[ex.id] !== undefined
                            ? favoriteExamples[ex.id]
                            : ex.is_favorite;

                        return (
                          <View key={ex.id} style={styles.exampleItem}>
                            <View style={styles.exampleTexts}>
                              <Text variant="bodyL">{ex.en}</Text>
                              <Text variant="bodyM" color="textSecondary">
                                {ex.pt}
                              </Text>
                            </View>
                            <Pressable
                              accessibilityRole="button"
                              accessibilityLabel={
                                isPhraseFav ? 'Desfavoritar frase' : 'Favoritar frase'
                              }
                              onPress={() => handleToggleExampleFav(ex.id, isPhraseFav)}
                              hitSlop={spacing.sm}
                              style={styles.starPressable}
                            >
                              <Text
                                variant="heading3"
                                color={isPhraseFav ? 'statusWarning' : 'textSecondary'}
                              >
                                {isPhraseFav ? '★' : '☆'}
                              </Text>
                            </Pressable>
                          </View>
                        );
                      })}
                    </View>
                  </View>
                )}
              </View>
            )}
          </>
        );
      }}
    </Screen>
  );
}

const styles = StyleSheet.create({
  topNav: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingBottom: spacing.sm,
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
  detailContainer: {
    gap: spacing.xl,
  },
  mainInfo: {
    gap: spacing.xs,
    marginTop: spacing.sm,
  },
  vocabHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.md,
  },
  vocabLemma: {
    flex: 1,
  },
  favButton: {
    minHeight: layout.minTouchTarget,
    justifyContent: 'center',
    paddingHorizontal: spacing.sm,
  },
  card: {
    backgroundColor: colors.bgSurface,
    borderColor: colors.borderDefault,
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.md,
  },
  masteryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  formsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  formItem: {
    backgroundColor: colors.bgElevated,
    borderRadius: radius.md,
    padding: spacing.md,
    minWidth: 100,
    gap: spacing.xs,
  },
  examplesList: {
    gap: spacing.md,
  },
  exampleItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.bgElevated,
    borderRadius: radius.md,
    padding: spacing.md,
    gap: spacing.md,
  },
  exampleTexts: {
    flex: 1,
    gap: spacing.xs,
  },
  starPressable: {
    minWidth: layout.minTouchTarget,
    minHeight: layout.minTouchTarget,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
