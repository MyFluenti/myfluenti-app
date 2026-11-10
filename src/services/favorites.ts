import type { FavoriteKind, FavoritesResult } from '@/types/contract';

import { assertOk, unwrap } from './errors';
import { rpc } from './rpc';
import { requireUserId } from './session';
import { supabase } from './supabase';

export function getMyFavorites(
  opts: { kind?: FavoriteKind; limit?: number; offset?: number } = {},
): Promise<FavoritesResult> {
  return rpc<FavoritesResult>('get_my_favorites', {
    ...(opts.kind !== undefined && { p_kind: opts.kind }),
    ...(opts.limit !== undefined && { p_limit: opts.limit }),
    ...(opts.offset !== undefined && { p_offset: opts.offset }),
  });
}

/**
 * Favorita ou desfavorita uma palavra. `favorited_at` é do trigger: não é enviado.
 * Favoritar usa upsert; desfavoritar usa UPDATE, porque o INSERT ... ON CONFLICT
 * passa pelo WITH CHECK do insert e falharia para palavra Premium sem plano.
 */
export async function toggleWordFavorite(vocabularyId: string, isFavorite: boolean): Promise<void> {
  const userId = await requireUserId();
  if (isFavorite) {
    assertOk(
      await supabase
        .from('user_vocabulary')
        .upsert(
          { user_id: userId, vocabulary_id: vocabularyId, is_favorite: true },
          { onConflict: 'user_id,vocabulary_id' },
        ),
    );
    return;
  }
  assertOk(
    await supabase
      .from('user_vocabulary')
      .update({ is_favorite: false })
      .eq('user_id', userId)
      .eq('vocabulary_id', vocabularyId),
  );
}

/** Dos ids informados, quais frases o aluno já favoritou. */
export async function getFavoriteExampleIds(exampleIds: string[]): Promise<Set<string>> {
  if (exampleIds.length === 0) return new Set();
  const rows = unwrap(
    await supabase
      .from('user_favorite_examples')
      .select('vocabulary_example_id')
      .in('vocabulary_example_id', exampleIds),
  );
  return new Set(rows.map((r) => r.vocabulary_example_id));
}

export async function addPhraseFavorite(vocabularyExampleId: string): Promise<void> {
  const userId = await requireUserId();
  assertOk(
    await supabase
      .from('user_favorite_examples')
      .insert({ user_id: userId, vocabulary_example_id: vocabularyExampleId }),
  );
}

export async function removePhraseFavorite(vocabularyExampleId: string): Promise<void> {
  const userId = await requireUserId();
  assertOk(
    await supabase
      .from('user_favorite_examples')
      .delete()
      .eq('user_id', userId)
      .eq('vocabulary_example_id', vocabularyExampleId),
  );
}
