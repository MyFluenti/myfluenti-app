import { useCallback, useRef, useState } from 'react';

import { toAppError } from '@/services/errors';
import { createNote, deleteNote, updateNote, type Note } from '@/services/notes';

export type NoteSaveState = { status: 'idle' | 'saving' | 'saved' | 'error'; error?: string };

/**
 * Notas por seção da aula (`user_notes` com `lesson_id` e `lesson_section_id`). Fica na
 * tela da aula, não no campo: o campo desmonta ao trocar de seção, e o salvamento
 * precisa terminar mesmo assim. As gravações de uma seção rodam em fila, então nunca
 * há dois `insert` para a mesma seção nem uma versão antiga gravada depois da nova.
 */
export function useSectionNotes(lessonId: string | undefined, loaded: Note[] | null) {
  // Nota mais recente por seção (o que o banco tem depois da última gravação).
  const latest = useRef<Record<string, Note | null>>({});
  const queue = useRef<Record<string, Promise<void>>>({});
  const [, setVersion] = useState(0);
  const [saveState, setSaveState] = useState<Record<string, NoteSaveState>>({});

  const noteFor = useCallback(
    (sectionId: string): Note | null => {
      if (sectionId in latest.current) return latest.current[sectionId];
      return loaded?.find((n) => n.lesson_section_id === sectionId) ?? null;
    },
    [loaded],
  );

  const save = useCallback(
    (sectionId: string, text: string): Promise<void> => {
      if (!lessonId) return Promise.resolve();
      const run = async () => {
        const note = noteFor(sectionId);
        const body = text.trim();
        if (body === (note?.body ?? '').trim()) return;
        setSaveState((prev) => ({ ...prev, [sectionId]: { status: 'saving' } }));
        try {
          let next: Note | null;
          if (!body) {
            if (note) await deleteNote(note.id);
            next = null;
          } else if (note) {
            next = await updateNote(note.id, { body });
          } else {
            next = await createNote({ lessonId, lessonSectionId: sectionId }, body);
          }
          latest.current[sectionId] = next;
          setVersion((v) => v + 1);
          setSaveState((prev) => ({ ...prev, [sectionId]: { status: 'saved' } }));
        } catch (e) {
          setSaveState((prev) => ({
            ...prev,
            [sectionId]: { status: 'error', error: toAppError(e).message },
          }));
        }
      };
      const chained = (queue.current[sectionId] ?? Promise.resolve()).then(run);
      queue.current[sectionId] = chained.catch(() => {});
      return chained;
    },
    [lessonId, noteFor],
  );

  const stateFor = (sectionId: string): NoteSaveState => saveState[sectionId] ?? { status: 'idle' };

  return { noteFor, save, stateFor };
}
