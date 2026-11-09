import type {
  LibraryFilters,
  LibraryItem,
  LibrarySearchResult,
  LibraryType,
} from '@/types/contract';

import { rpc } from './rpc';

export function searchLibrary(filters: LibraryFilters = {}): Promise<LibrarySearchResult> {
  return rpc<LibrarySearchResult>('search_library', {
    ...(filters.type !== undefined && { p_type: filters.type }),
    ...(filters.levelCode !== undefined && { p_level_code: filters.levelCode }),
    ...(filters.query !== undefined && { p_query: filters.query }),
    ...(filters.category !== undefined && { p_category: filters.category }),
    ...(filters.limit !== undefined && { p_limit: filters.limit }),
    ...(filters.offset !== undefined && { p_offset: filters.offset }),
  });
}

/** Lança `premium_required` (item Premium sem plano) ou `item_not_found`. */
export function getLibraryItem(type: LibraryType, id: string): Promise<LibraryItem> {
  return rpc<LibraryItem>('get_library_item', { p_type: type, p_id: id });
}
