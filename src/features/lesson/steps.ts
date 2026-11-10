import type {
  LessonContent,
  LessonExercise,
  LessonQuestion,
  LessonSection,
} from '@/types/contract';

/**
 * Passos da tela de aula, na ordem em que o aluno percorre: seções, depois as questões
 * dos exercícios, depois as questões fora de exercício. Só organiza o que veio de
 * `get_lesson_content`; quem decide conclusão e nota é o backend.
 */
export type LessonStep =
  | { kind: 'section'; section: LessonSection; number: number; total: number }
  | {
      kind: 'question';
      question: LessonQuestion;
      exercise: LessonExercise | null;
      number: number;
      total: number;
    };

const byPosition = <T extends { position: number }>(a: T, b: T) => a.position - b.position;

export function buildSteps(content: LessonContent): LessonStep[] {
  const sections = [...content.sections].sort(byPosition);
  const questions: { question: LessonQuestion; exercise: LessonExercise | null }[] = [];
  for (const exercise of [...content.exercises].sort(byPosition)) {
    for (const question of [...exercise.questions].sort(byPosition)) {
      questions.push({ question, exercise });
    }
  }
  for (const question of [...content.other_questions].sort(byPosition)) {
    questions.push({ question, exercise: null });
  }

  return [
    ...sections.map(
      (section, i): LessonStep => ({
        kind: 'section',
        section,
        number: i + 1,
        total: sections.length,
      }),
    ),
    ...questions.map(
      ({ question, exercise }, i): LessonStep => ({
        kind: 'question',
        question,
        exercise,
        number: i + 1,
        total: questions.length,
      }),
    ),
  ];
}

/**
 * Onde retomar: a primeira seção ainda não vista ou a primeira questão sem resposta
 * nesta tentativa. `steps.length` quando não falta nada (hora de encerrar).
 * Tentativa encerrada abre do começo, só para leitura.
 */
export function resumeIndex(steps: LessonStep[], readOnly: boolean): number {
  if (readOnly) return 0;
  const index = steps.findIndex((step) =>
    step.kind === 'section' ? !step.section.viewed : step.question.answer === null,
  );
  return index === -1 ? steps.length : index;
}

/**
 * Se o progresso devolvido pelo backend já permite encerrar sem perder a tentativa:
 * `finish_lesson_attempt` encerra mesmo com pendências (questão sem resposta vale zero),
 * então o app só oferece encerrar quando o próprio backend diz que não falta nada.
 */
export function readyToFinish(progress: LessonContent['progress']): boolean {
  return (
    progress.sections_viewed >= progress.sections_required &&
    progress.questions_answered >= progress.questions_assessed
  );
}

const SECTION_LABELS: Record<string, string> = {
  intro: 'Introdução',
  explanation: 'Explicação',
  structure: 'Estrutura',
  examples: 'Exemplos',
  comparison: 'Comparação',
  summary: 'Resumo',
};

/** Rótulo da etiqueta da seção; tipo desconhecido não mostra etiqueta. */
export function sectionLabel(sectionType: string): string | null {
  return SECTION_LABELS[sectionType] ?? null;
}
