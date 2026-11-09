import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import {
  Badge,
  EmptyState,
  Icon,
  Input,
  ProgressBar,
  Text,
} from '@/components';
import { Screen } from '@/features/common/Screen';
import { useLibrarySearch } from '@/features/library/useLibrarySearch';
import { colors, layout, opacity, radius, spacing } from '@/theme/tokens';
import type { LibrarySearchItem, LibraryType } from '@/types/contract';

export default function LibraryScreen() {
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<LibraryType>('grammar');
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');

  // Debounce da busca (300ms)
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(query);
    }, 300);
    return () => clearTimeout(handler);
  }, [query]);

  const filters = useMemo(
    () => ({
      type: activeTab,
      query: debouncedQuery,
      limit: 50,
    }),
    [activeTab, debouncedQuery],
  );

  const state = useLibrarySearch(filters);

  return (
    <Screen state={state}>
      {(result) => (
        <>
          {/* Cabeçalho */}
          <View style={styles.header}>
            <Text variant="display" accessibilityRole="header">
              Biblioteca
            </Text>
            <Text variant="bodyL" color="textSecondary">
              Consulte quando quiser, sem seguir o curso.
            </Text>
          </View>

          {/* Segmento de abas: Gramática e Vocabulário */}
          <View
            style={styles.segmentContainer}
            accessibilityRole="tablist"
            accessibilityLabel="Tipo de conteúdo"
          >
            <Pressable
              accessibilityRole="tab"
              accessibilityLabel="Aba Gramática"
              accessibilityState={{ selected: activeTab === 'grammar' }}
              onPress={() => setActiveTab('grammar')}
              style={({ pressed }) => [
                styles.segmentTab,
                activeTab === 'grammar' && styles.segmentTabActive,
                { opacity: pressed ? opacity.pressed : 1 },
              ]}
            >
              <Text
                variant="button"
                color={activeTab === 'grammar' ? 'textPrimary' : 'textSecondary'}
              >
                Gramática
              </Text>
            </Pressable>

            <Pressable
              accessibilityRole="tab"
              accessibilityLabel="Aba Vocabulário"
              accessibilityState={{ selected: activeTab === 'vocabulary' }}
              onPress={() => setActiveTab('vocabulary')}
              style={({ pressed }) => [
                styles.segmentTab,
                activeTab === 'vocabulary' && styles.segmentTabActive,
                { opacity: pressed ? opacity.pressed : 1 },
              ]}
            >
              <Text
                variant="button"
                color={activeTab === 'vocabulary' ? 'textPrimary' : 'textSecondary'}
              >
                Vocabulário
              </Text>
            </Pressable>
          </View>

          {/* Campo de busca */}
          <Input
            label="Buscar"
            placeholder={
              activeTab === 'grammar'
                ? 'Buscar tópico (ex.: Simple Present, can...)'
                : 'Buscar palavra ou tradução'
            }
            value={query}
            onChangeText={setQuery}
          />

          {/* Lista de itens ou estado vazio */}
          {result.items.length === 0 ? (
            <EmptyState
              title="Nenhum resultado para a busca"
              message={
                debouncedQuery.trim()
                  ? `Não encontramos nada para "${debouncedQuery.trim()}".`
                  : activeTab === 'grammar'
                    ? 'Nenhum tópico de gramática disponível no momento.'
                    : 'Nenhum vocabulário cadastrado no momento.'
              }
            />
          ) : (
            <View style={styles.list}>
              {result.items.map((item: LibrarySearchItem) => {
                const hasMastery = item.mastery_pct !== null && item.mastery_pct > 0;

                return (
                  <Pressable
                    key={item.id}
                    accessibilityRole="button"
                    accessibilityLabel={[item.title, item.subtitle, item.locked ? 'Disponível no plano Premium' : null]
                      .filter(Boolean)
                      .join('. ')}
                    onPress={() =>
                      router.push({
                        pathname: '/library/[type]/[id]',
                        params: { type: item.type, id: item.id },
                      })
                    }
                    style={({ pressed }) => [
                      styles.itemCard,
                      { opacity: pressed ? opacity.pressed : 1 },
                    ]}
                  >
                    <View style={styles.cardHeader}>
                      <Text variant="heading3" style={styles.cardTitle}>
                        {item.title}
                      </Text>
                      <View style={styles.badges}>
                        {item.locked ? (
                          <Icon name="lock" color="brandPrimaryLight" size={spacing.lg} />
                        ) : null}
                        <Badge variant={item.access_tier === 'premium' ? 'premium' : 'free'} />
                      </View>
                    </View>

                    {item.subtitle ? (
                      <Text variant="bodyM" color="textSecondary" numberOfLines={2}>
                        {item.subtitle}
                      </Text>
                    ) : null}

                    {item.part_of_speech ? (
                      <Text variant="caption" color="textSecondary">
                        {item.part_of_speech}
                      </Text>
                    ) : null}

                    {hasMastery && (
                      <View style={styles.masteryContainer}>
                        <View style={styles.masteryTextRow}>
                          <Text variant="caption" color="textSecondary">
                            Domínio
                          </Text>
                          <Text variant="caption" color="brandPrimaryLight">
                            {Math.round(item.mastery_pct!)}%
                          </Text>
                        </View>
                        <ProgressBar
                          value={item.mastery_pct!}
                          accessibilityLabel={`Domínio: ${Math.round(item.mastery_pct!)}%`}
                        />
                      </View>
                    )}
                  </Pressable>
                );
              })}
            </View>
          )}
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    gap: spacing.xs,
  },
  segmentContainer: {
    flexDirection: 'row',
    backgroundColor: colors.bgSurface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.borderDefault,
    padding: spacing.xs,
    gap: spacing.xs,
  },
  segmentTab: {
    flex: 1,
    height: layout.minTouchTarget,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentTabActive: {
    backgroundColor: colors.bgElevated,
  },
  list: {
    gap: spacing.md,
  },
  itemCard: {
    backgroundColor: colors.bgSurface,
    borderColor: colors.borderDefault,
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  cardTitle: {
    flex: 1,
  },
  badges: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  masteryContainer: {
    marginTop: spacing.xs,
    gap: spacing.xs,
  },
  masteryTextRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
});
