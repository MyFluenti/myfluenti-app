import { Alert, Platform } from 'react-native';

// Alert.alert não faz nada na web (react-native-web). Aqui a web usa window.confirm e
// window.alert, e o nativo usa Alert.alert.

export type ConfirmOptions = {
  title: string;
  message?: string;
  confirmLabel: string;
  cancelLabel?: string;
  /** Estilo destrutivo no nativo (ex.: sair). */
  destructive?: boolean;
};

/** Pergunta ao aluno e resolve true se ele confirmar. Fechar o diálogo conta como cancelar. */
export function confirm(options: ConfirmOptions): Promise<boolean> {
  const { title, message, confirmLabel, cancelLabel = 'Cancelar', destructive } = options;

  if (Platform.OS === 'web') {
    const text = message ? `${title}\n\n${message}` : title;
    return Promise.resolve(typeof window !== 'undefined' ? window.confirm(text) : false);
  }

  return new Promise((resolve) => {
    Alert.alert(
      title,
      message,
      [
        { text: cancelLabel, style: 'cancel', onPress: () => resolve(false) },
        {
          text: confirmLabel,
          style: destructive ? 'destructive' : 'default',
          onPress: () => resolve(true),
        },
      ],
      { cancelable: true, onDismiss: () => resolve(false) },
    );
  });
}

/** Aviso simples, sem escolha. Não bloqueia o fluxo no nativo. */
export function notify(title: string, message?: string): void {
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined') window.alert(message ? `${title}\n\n${message}` : title);
    return;
  }
  Alert.alert(title, message);
}
