/** Chave local (AsyncStorage) da animação de boas-vindas já vista. Não é segredo. */
export const WELCOME_ANIMATION_SEEN_KEY = 'welcome_animation_seen';

/**
 * Como a tela de boas-vindas abre:
 * - `loading`: ainda lendo a flag (a tela fica vazia, para não piscar o estado final);
 * - `animate`: primeira abertura, animação completa;
 * - `fade`: primeira abertura com "reduzir movimento", só um fade curto;
 * - `static`: animação já vista, tela parada no estado final (tela 01).
 */
export type IntroMode = 'loading' | 'animate' | 'fade' | 'static';

export function introModeFor(seen: boolean | null, reduceMotion: boolean): IntroMode {
  if (seen === null) return 'loading';
  if (seen) return 'static';
  return reduceMotion ? 'fade' : 'animate';
}

/** Armazenamento mínimo, para testar sem o AsyncStorage real. */
export type FlagStorage = {
  getItem: (key: string) => Promise<string | null>;
  setItem: (key: string, value: string) => Promise<void>;
};

/** Lê a flag. Falha de leitura conta como "já vista": melhor não animar do que travar. */
export async function readSeen(storage: FlagStorage): Promise<boolean> {
  try {
    return (await storage.getItem(WELCOME_ANIMATION_SEEN_KEY)) === '1';
  } catch {
    return true;
  }
}

export async function markSeen(storage: FlagStorage): Promise<void> {
  try {
    await storage.setItem(WELCOME_ANIMATION_SEEN_KEY, '1');
  } catch {
    // Sem armazenamento: a animação volta na próxima abertura, sem outro efeito.
  }
}
