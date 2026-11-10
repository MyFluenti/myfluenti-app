import { useEffect, useRef, useState, type ComponentRef, type Ref } from 'react';
import type { TextInput } from 'react-native';
import { StyleSheet, View } from 'react-native';

import { Input, Text } from '@/components';
import { spacing } from '@/theme/tokens';

import type { NoteSaveState } from './useSectionNotes';

/** Mesmo limite que o backend valida em `user_notes.body` (2000 caracteres). */
export const NOTE_MAX_LENGTH = 2000;

/** Espera depois da última tecla antes de salvar. */
const SAVE_DELAY_MS = 800;

export type SectionNoteProps = {
  /** Texto salvo quando o campo montou (a tela monta um campo por seção, com key). */
  initialText: string;
  saveState: NoteSaveState;
  /** Grava o texto (a fila fica na tela, não aqui). */
  onSave: (text: string) => void;
  inputRef?: Ref<ComponentRef<typeof TextInput>>;
};

/**
 * Campo "Sua nota" de uma seção. Salva pouco depois de o aluno parar de digitar, ao sair
 * do campo e ao desmontar (trocar de seção ou sair da aula), para não perder texto.
 */
export function SectionNote({ initialText, saveState, onSave, inputRef }: SectionNoteProps) {
  const [text, setText] = useState(initialText);
  const latestText = useRef(initialText);
  const latestSave = useRef(onSave);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    latestSave.current = onSave;
  }, [onSave]);

  const flush = () => {
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
    }
    latestSave.current(latestText.current);
  };

  // Ao desmontar, grava o que ficou no campo (a fila ignora se nada mudou).
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
      latestSave.current(latestText.current);
    },
    [],
  );

  const status =
    saveState.status === 'saving' ? 'Salvando…' : saveState.status === 'saved' ? 'Nota salva' : null;

  return (
    <View style={styles.root}>
      <Input
        ref={inputRef}
        label="Sua nota"
        placeholder="Escreva uma nota sobre esta seção"
        value={text}
        onChangeText={(value) => {
          setText(value);
          latestText.current = value;
          if (timer.current) clearTimeout(timer.current);
          timer.current = setTimeout(flush, SAVE_DELAY_MS);
        }}
        onBlur={flush}
        multiline
        maxLength={NOTE_MAX_LENGTH}
        error={saveState.status === 'error' ? saveState.error : undefined}
      />
      {status ? (
        <Text variant="caption" color="textSecondary" accessibilityLiveRegion="polite">
          {status}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: spacing.xs },
});
