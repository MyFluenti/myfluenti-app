import type { Database } from '@/types/database';

import { assertOk, unwrap } from './errors';
import { requireUserId } from './session';
import { supabase } from './supabase';

type NotesTable = Database['public']['Tables']['user_notes'];

export type Note = NotesTable['Row'];

/** Exatamente um alvo. `lessonSectionId` só vale junto com `lessonId`. */
export type NoteTarget =
  | { lessonId: string; lessonSectionId?: string }
  | { grammarTopicId: string }
  | { vocabularyId: string };

export type NoteFilter = { lessonId?: string; grammarTopicId?: string; vocabularyId?: string };

export async function listNotes(filter: NoteFilter = {}): Promise<Note[]> {
  let q = supabase.from('user_notes').select('*').order('updated_at', { ascending: false });
  if (filter.lessonId) q = q.eq('lesson_id', filter.lessonId);
  if (filter.grammarTopicId) q = q.eq('grammar_topic_id', filter.grammarTopicId);
  if (filter.vocabularyId) q = q.eq('vocabulary_id', filter.vocabularyId);
  return unwrap(await q);
}

export async function createNote(target: NoteTarget, body: string): Promise<Note> {
  const userId = await requireUserId();
  const row: NotesTable['Insert'] = { user_id: userId, body };
  if ('lessonId' in target) {
    row.lesson_id = target.lessonId;
    if (target.lessonSectionId) row.lesson_section_id = target.lessonSectionId;
  } else if ('grammarTopicId' in target) {
    row.grammar_topic_id = target.grammarTopicId;
  } else {
    row.vocabulary_id = target.vocabularyId;
  }
  return unwrap(await supabase.from('user_notes').insert(row).select().single());
}

/** No update, só `body` e `lesson_section_id` podem mudar. */
export async function updateNote(
  id: string,
  patch: { body?: string; lessonSectionId?: string | null },
): Promise<Note> {
  const update: NotesTable['Update'] = {};
  if (patch.body !== undefined) update.body = patch.body;
  if (patch.lessonSectionId !== undefined) update.lesson_section_id = patch.lessonSectionId;
  return unwrap(await supabase.from('user_notes').update(update).eq('id', id).select().single());
}

export async function deleteNote(id: string): Promise<void> {
  assertOk(await supabase.from('user_notes').delete().eq('id', id));
}
