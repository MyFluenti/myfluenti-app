/** Configuração do avatar montável, versão 1. Todas as chaves são obrigatórias e só há inteiros. */
export type AvatarConfig = {
  v: 1;
  skin: number;
  hair: number;
  hairColor: number;
  eyes: number;
  mouth: number;
  acc: number;
  outfit: number;
  bg: number;
};

/** Chaves das peças escolhíveis (todas, menos a versão). */
export type AvatarPart = Exclude<keyof AvatarConfig, 'v'>;
