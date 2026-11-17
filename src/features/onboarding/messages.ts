import { toAppError } from '@/services/errors';

/**
 * Mensagem para erros das RPCs antigas do nivelamento (migration 003), que usam
 * mensagens em português sem código estável: o match é só pelo SQLSTATE.
 */
export function placementErrorMessage(e: unknown, now: Date = new Date()): string {
  const error = toAppError(e);
  if (error.kind === 'placement_retry_too_soon') return retryTooSoonMessage(error.availableAt, now);
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

const DAY_MS = 24 * 60 * 60 * 1000;

function formatDay(date: Date): string {
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
}

/**
 * Carência do nivelamento (migration 013): o backend decide o prazo e manda a data em que
 * o próximo teste libera. O app só conta os dias até ela e mostra a data.
 */
export function retryTooSoonMessage(
  availableAt: string | null,
  now: Date,
  format: (date: Date) => string = formatDay,
): string {
  const when = availableAt ? new Date(availableAt) : null;
  if (!when || Number.isNaN(when.getTime())) {
    return 'O próximo teste de nivelamento ainda não está disponível. Tente de novo em alguns dias.';
  }
  const days = Math.max(1, Math.ceil((when.getTime() - now.getTime()) / DAY_MS));
  return `O próximo teste de nivelamento fica disponível em ${days} ${days === 1 ? 'dia' : 'dias'} (a partir de ${format(when)}).`;
}
