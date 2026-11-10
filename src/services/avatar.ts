import type { AvatarConfig } from '@/features/avatar/types';
import { isValidAvatarConfig, toAvatarConfig } from '@/features/avatar/validate';

import { AppError } from './errors';
import { rpc } from './rpc';

/**
 * Grava o avatar pela RPC `update_my_avatar` (única via; UPDATE direto é negado).
 * `null` limpa e volta ao avatar padrão. O parâmetro é sempre enviado.
 * Devolve o que o banco gravou (`avatar_config`).
 */
export async function updateMyAvatar(config: AvatarConfig | null): Promise<AvatarConfig | null> {
  // Só evita enviar lixo: quem valida de verdade é o backend.
  if (config !== null && !isValidAvatarConfig(config)) {
    throw new AppError({ kind: 'known', code: 'invalid_avatar_config' });
  }
  const result = await rpc<{ avatar_config: unknown }>('update_my_avatar', { p_config: config });
  return toAvatarConfig(result?.avatar_config);
}
