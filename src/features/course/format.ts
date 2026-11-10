import type { CourseModule } from '@/types/contract';

/** "Módulo 2 · Simple Present": posição vinda do backend + título do módulo. */
export function moduleTitle(m: Pick<CourseModule, 'position' | 'title'>): string {
  return `Módulo ${m.position} · ${m.title}`;
}

/**
 * Em andamento ou concluído: "3 de 5 aulas" (concluídas de obrigatórias, mesmo com 0).
 * Demais estados: "5 aulas".
 */
export function lessonsProgressText(
  m: Pick<CourseModule, 'completed_lessons' | 'required_lessons' | 'state'>,
): string {
  const total = m.required_lessons;
  const noun = total === 1 ? 'aula' : 'aulas';
  return m.state === 'in_progress' || m.state === 'completed'
    ? `${m.completed_lessons} de ${total} ${noun}`
    : `${total} ${noun}`;
}
