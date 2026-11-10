import { rpc } from './rpc';

/** Palavra que o contrato exige em `delete_my_account`. A digitação fica na tela. */
const CONFIRMATION = 'EXCLUIR';

/**
 * Exclui a conta e, em cascata, todos os dados do aluno (RPC `delete_my_account`).
 * Depois do sucesso, ou de `account_not_found`, o chamador descarta a sessão local.
 */
export async function deleteMyAccount(): Promise<void> {
  await rpc<{ deleted: boolean }>('delete_my_account', { p_confirmation: CONFIRMATION });
}
