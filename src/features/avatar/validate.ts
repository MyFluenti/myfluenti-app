import type { AvatarConfig, AvatarPart } from './types';

/** Maior índice válido de cada peça. Mesmas faixas da validação do banco. */
export const AVATAR_MAX: Record<AvatarPart, number> = {
  skin: 4,
  hair: 5,
  hairColor: 4,
  eyes: 2,
  mouth: 1,
  acc: 2,
  outfit: 4,
  bg: 4,
};

const PARTS = Object.keys(AVATAR_MAX) as AvatarPart[];

/**
 * Objeto simples, chaves exatas (sem faltar nem sobrar), `v` igual a 1 e inteiros dentro da faixa.
 * O banco é quem valida de verdade; aqui só evitamos enviar ou desenhar lixo.
 */
export function isValidAvatarConfig(value: unknown): value is AvatarConfig {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return false;
  const obj = value as Record<string, unknown>;
  const keys = Object.keys(obj);
  if (keys.length !== PARTS.length + 1) return false;
  if (!('v' in obj) || obj.v !== 1) return false;
  return PARTS.every((part) => {
    const n = obj[part];
    return typeof n === 'number' && Number.isInteger(n) && n >= 0 && n <= AVATAR_MAX[part];
  });
}

/** Config lida do banco: válida vira tipada; qualquer outra coisa vira null (avatar padrão). */
export function toAvatarConfig(value: unknown): AvatarConfig | null {
  return isValidAvatarConfig(value) ? value : null;
}
