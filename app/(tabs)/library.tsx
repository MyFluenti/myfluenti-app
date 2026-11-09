import { EmptyState, Text } from '@/components';
import { Screen } from '@/features/common/Screen';
import { useLibrarySearch } from '@/features/library/useLibrarySearch';

export default function LibraryScreen() {
  const state = useLibrarySearch(20);

  return (
    <Screen state={state}>
      {(result) => (
        <>
          <Text variant="display" accessibilityRole="header">
            Biblioteca
          </Text>
          {result.items.length === 0 ? (
            <EmptyState title="Nenhum resultado para a busca" />
          ) : (
            <Text variant="bodyM" color="textSecondary">
              {result.total} itens na biblioteca.
            </Text>
          )}
        </>
      )}
    </Screen>
  );
}
