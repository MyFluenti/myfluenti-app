/**
 * Aproveitamento mínimo para concluir a aula, **só para exibir** nas telas de resultado
 * (regra oficial do MVP no CLAUDE.md). Quem decide é `finish_lesson_attempt`, que não
 * devolve esse valor. Se a regra mudar, este texto precisa mudar junto; o ideal é o
 * backend passar a devolver o mínimo (pendência registrada no PR da Fase 2).
 */
export const LESSON_PASS_PCT_FOR_DISPLAY = 80;

/** Trunca para nunca mostrar mais do que o aluno fez (79,99 vira 79%). */
export const formatScore = (pct: number) => `${Math.floor(pct)}%`;
