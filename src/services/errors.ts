import { isAuthError } from '@supabase/supabase-js';

/** Códigos estáveis do contrato (myfluenti-docs/docs/dados/api.md). */
export const KNOWN_CODES = [
  'invalid_filter',
  'invalid_timezone',
  'invalid_rating',
  'invalid_item',
  'answer_required',
  'item_not_found',
  'session_not_found',
  'session_closed',
  'not_in_review_queue',
  'already_answered',
  'already_reviewed',
  'section_not_in_lesson',
] as const;
export type KnownCode = (typeof KNOWN_CODES)[number];

export type AppErrorInfo =
  | { kind: 'module_locked' }
  | { kind: 'premium_required' }
  | { kind: 'rating_required' }
  | { kind: 'not_authenticated' }
  | { kind: 'network' }
  | { kind: 'invalid_credentials' }
  | { kind: 'weak_password' }
  | { kind: 'email_taken' }
  | { kind: 'invalid_email' }
  | { kind: 'known'; code: KnownCode }
  | { kind: 'unknown'; code?: string };

export type AppErrorKind = AppErrorInfo['kind'];

/** Mensagens em PT-BR para a interface. Nunca incluem dados do usuário. */
const KNOWN_MESSAGES: Record<KnownCode, string> = {
  invalid_filter: 'Esse filtro não é válido. Ajuste a busca e tente de novo.',
  invalid_timezone: 'Não conseguimos identificar o fuso do seu aparelho.',
  invalid_rating: 'Essa avaliação não é válida.',
  invalid_item: 'Esse item não pôde ser registrado.',
  answer_required: 'Responda a questão antes de continuar.',
  item_not_found: 'Não encontramos esse conteúdo.',
  session_not_found: 'Essa sessão não foi encontrada. Comece de novo.',
  session_closed: 'Essa sessão já foi encerrada.',
  not_in_review_queue: 'Esse item não está disponível para revisão agora.',
  already_answered: 'Você já respondeu essa questão.',
  already_reviewed: 'Você já avaliou esse item.',
  section_not_in_lesson: 'Essa seção não pertence à aula escolhida.',
};

const MESSAGES: Record<Exclude<AppErrorKind, 'known'>, string> = {
  module_locked: 'Conclua as aulas obrigatórias do módulo anterior para liberar este.',
  premium_required: 'Disponível no plano Premium',
  rating_required: 'Escolha como foi para você: Difícil, Bom ou Fácil.',
  not_authenticated: 'Sua sessão expirou. Entre de novo para continuar.',
  network: 'Sem conexão. Verifique sua internet e tente de novo.',
  invalid_credentials: 'E-mail ou senha incorretos.',
  weak_password: 'Senha fraca. Use pelo menos 6 caracteres.',
  email_taken: 'Este e-mail já tem conta. Entre ou recupere a senha.',
  invalid_email: 'E-mail inválido.',
  unknown: 'Algo deu errado. Tente de novo em instantes.',
};

export class AppError extends Error {
  readonly info: AppErrorInfo;

  constructor(info: AppErrorInfo) {
    super(info.kind === 'known' ? KNOWN_MESSAGES[info.code] : MESSAGES[info.kind]);
    this.name = 'AppError';
    this.info = info;
  }

  get kind(): AppErrorKind {
    return this.info.kind;
  }

  /** Código original do contrato (kind 'known') ou do erro (kind 'unknown'). */
  get code(): string | undefined {
    return this.info.kind === 'known' || this.info.kind === 'unknown' ? this.info.code : undefined;
  }
}

export function isAppError(e: unknown): e is AppError {
  return e instanceof AppError;
}

type ErrorLike = {
  message?: unknown;
  code?: unknown;
  status?: unknown;
  name?: unknown;
};

const NETWORK_RE = /network request failed|failed to fetch|network error|networkerror|load failed/i;

function isKnownCode(v: string): v is KnownCode {
  return (KNOWN_CODES as readonly string[]).includes(v);
}

/**
 * Converte erro do PostgREST, do Auth ou de rede em AppError.
 * Casa pela mensagem estável do contrato; nunca registra nem repassa dados do usuário.
 */
export function toAppError(error: unknown): AppError {
  if (error instanceof AppError) return error;

  const e: ErrorLike = typeof error === 'object' && error !== null ? (error as ErrorLike) : {};
  const message = typeof e.message === 'string' ? e.message.trim() : '';
  const code = typeof e.code === 'string' ? e.code : '';
  const status = typeof e.status === 'number' ? e.status : undefined;

  // Rede: TypeError do fetch, status 0 ou erro retentável do Auth.
  if (
    (error instanceof TypeError && NETWORK_RE.test(message)) ||
    NETWORK_RE.test(message) ||
    status === 0 ||
    e.name === 'AuthRetryableFetchError'
  ) {
    return new AppError({ kind: 'network' });
  }

  if (isAuthError(error)) {
    if (code === 'invalid_credentials') return new AppError({ kind: 'invalid_credentials' });
    if (code === 'weak_password') return new AppError({ kind: 'weak_password' });
    if (code === 'user_already_exists' || code === 'email_exists') {
      return new AppError({ kind: 'email_taken' });
    }
    if (code === 'email_address_invalid') return new AppError({ kind: 'invalid_email' });
    if (e.name === 'AuthSessionMissingError') return new AppError({ kind: 'not_authenticated' });
    return new AppError({ kind: 'unknown', code: code || undefined });
  }

  // PostgrestError. Mensagem estável do contrato primeiro.
  if (message === 'module_locked') return new AppError({ kind: 'module_locked' });
  if (message === 'premium_required') return new AppError({ kind: 'premium_required' });
  if (message === 'rating_required') return new AppError({ kind: 'rating_required' });
  // Sem JWT o anon recebe 42501 "permission denied for function ..." (sem EXECUTE).
  const anonDenied = code === '42501' && /^permission denied for function/i.test(message);
  if (code === '28000' || code === 'PGRST301' || status === 401 || anonDenied) {
    return new AppError({ kind: 'not_authenticated' });
  }
  if (isKnownCode(message)) return new AppError({ kind: 'known', code: message });

  return new AppError({ kind: 'unknown', code: code || undefined });
}

/** Desembrulha `{ data, error }` do supabase-js; lança AppError em falha. */
export function unwrap<T>(result: { data: T | null; error: unknown }): T {
  if (result.error) throw toAppError(result.error);
  if (result.data === null) throw new AppError({ kind: 'unknown' });
  return result.data;
}

/** Para chamadas sem dados de retorno (void). */
export function assertOk(result: { error: unknown }): void {
  if (result.error) throw toAppError(result.error);
}

/** Executa uma chamada que pode lançar (ex.: fetch) e normaliza o erro. */
export async function guard<T>(fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch (e) {
    throw toAppError(e);
  }
}
