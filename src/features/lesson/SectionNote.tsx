import { useRef, useState, type ComponentRef, type Ref } from 'react';
import type { TextInput } from 'react-native';
import { StyleSheet, View } from 'react-native';

import { Input, Text } from '@/components';
import { toAppError } from '@/services/errors';
import { createNote, deleteNote, updateNote, type Note } from '@/services/notes';
import { spacing } from '@/theme/tokens';

/** Mesmo limite que o backend vai validar em `user_notes.body` (2000 caracteres). */
export const NOTE_MAX_LENGTH = 2000;

type SaveState = 'idle' | 'saving' | 'saved' | 'error';

export type SectionNoteProps = {
  lessonId: string;
  sectionId: string;
  note: Note | null;
  onChange: (note: Note | null) => void;
  inputRef?: Ref<ComponentRef<typeof TextInput>>;
};

/**
 * Nota do aluno sobre uma seção da aula (`user_notes` com `lesson_id` e
 * `lesson_section_id`). Salva ao sair do campo: cria, atualiza ou, se ficar vazia, apaga.
 */
export function SectionNote({ lessonId, sectionId, note, onChange, inputRef }: SectionNoteProps) {
  const [text, setText] = useState(note?.body ?? '');
  const [state, setState] = useState<SaveState>('idle');
  const [error, setError] = useState<string | undefined>();
  // O texto inicial vem da nota salva; a tela monta um SectionNote por seção (key).
  const saving = useRef(false);

  const save = async () => {
    if (saving.current) return;
    const body = text.trim();
    if (body === (note?.body ?? '').trim()) return;
    saving.current = true;
    setState('saving');
    setError(undefined);
    try {
      if (!body) {
        if (note) await deleteNote(note.id);
        onChange(null);
      } else if (note) {
        onChange(await updateNote(note.id, { body }));
      } else {
        onChange(await createNote({ lessonId, lessonSectionId: sectionId }, body));
      }
      setState('saved');
    } catch (e) {
      setState('error');
      setError(toAppError(e).message);
    } finally {
      saving.current = false;
    }
  };

  return (
    <View style={styles.root}>
      <Input
        ref={inputRef}
        label="Sua nota"
        placeholder="Escreva uma nota sobre esta seção"
        value={text}
        onChangeText={(value) => {
          setText(value);
          if (state !== 'idle') setState('idle');
        }}
        onBlur={() => void save()}
        multiline
        maxLength={NOTE_MAX_LENGTH}
        error={error}
      />
      {state === 'saving' || state === 'saved' ? (
        <Text variant="caption" color="textSecondary" accessibilityLiveRegion="polite">
          {state === 'saving' ? 'Salvando…' : 'Nota salva'}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: spacing.xs },
});
