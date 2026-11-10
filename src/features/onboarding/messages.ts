import { toAppError } from '@/services/errors';

/**
 * Mensagem para erros das RPCs antigas do nivelamento (migration 003), que usam
 * mensagens em português sem código estável: o match é só pelo SQLSTATE.
 */
export function placementErrorMessage(e: unknown): string {
  const error = toAppError(e);
  if (error.kind !== 'unknown') return error.message;
  switch (error.code) {
    case 'P0002':
      // start_placement_attempt sem teste publicado, ou select_starting_level em nível sem módulos.
      return 'Esse conteúdo ainda não está disponível. Tente de novo mais tarde.';
    case '22023':
      return 'Esse nível está acima do recomendado. Escolha o recomendado ou um nível abaixo.';
    case '55000':
      return 'Esse teste já foi encerrado.';
    default:
      return error.message;
  }
}
