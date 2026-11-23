/**
 * Como a tela de boas-vindas abre. Ela só aparece sem sessão, e toda vez que aparece toca a
 * abertura (decisão do Gabriel, 23/11: "sempre que estiver deslogado"; não há flag local):
 * - `animate`: animação completa (tela 49);
 * - `fade`: com "reduzir movimento" ligado, só um fade curto da tela final.
 */
export type IntroMode = 'animate' | 'fade';

export function introModeFor(reduceMotion: boolean): IntroMode {
  return reduceMotion ? 'fade' : 'animate';
}
