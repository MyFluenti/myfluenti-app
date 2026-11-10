import type { LessonContent, LessonQuestion, LessonSection } from '@/types/contract';

import { buildSteps, readyToFinish, resumeIndex, sectionLabel } from '../steps';

const section = (id: string, position: number, viewed = false): LessonSection => ({
  id,
  position,
  section_type: 'explanation',
  title: id,
  content: { v: 1, blocks: [] },
  is_required: true,
  viewed,
});

const question = (id: string, position: number, answered = false): LessonQuestion => ({
  id,
  position,
  question_type: 'multiple_choice',
  prompt: id,
  prompt_data: { v: 1 },
  is_assessed: true,
  max_points: 1,
  options: [],
  answer: answered ? { is_correct: true, awarded_points: 1, explanation: null } : null,
});

const content = (overrides: Partial<LessonContent> = {}): LessonContent => ({
  attempt: { id: 'a', status: 'in_progress', lesson_version_id: 'v', version_number: 1 },
  lesson: { id: 'l', module_id: 'm', position: 1, title: 'Aula', objective: null },
  sections: [section('s2', 2), section('s1', 1)],
  exercises: [
    {
      id: 'e2',
      position: 2,
      title: null,
      instructions: null,
      is_assessed: true,
      questions: [question('q3', 1)],
    },
    {
      id: 'e1',
      position: 1,
      title: null,
      instructions: 'Complete a frase:',
      is_assessed: true,
      questions: [question('q2', 2), question('q1', 1)],
    },
  ],
  other_questions: [question('q4', 1)],
  progress: { sections_required: 2, sections_viewed: 0, questions_assessed: 4, questions_answered: 0 },
  ...overrides,
});

const ids = (c: LessonContent) =>
  buildSteps(c).map((s) => (s.kind === 'section' ? s.section.id : s.question.id));

describe('buildSteps', () => {
  it('orders sections, then exercise questions, then questions outside exercises', () => {
    expect(ids(content())).toEqual(['s1', 's2', 'q1', 'q2', 'q3', 'q4']);
  });

  it('numbers sections and questions separately', () => {
    const steps = buildSteps(content());
    expect(steps[1]).toMatchObject({ kind: 'section', number: 2, total: 2 });
    expect(steps[2]).toMatchObject({ kind: 'question', number: 1, total: 4 });
    expect(steps[5]).toMatchObject({ kind: 'question', number: 4, total: 4, exercise: null });
  });

  it('keeps the exercise of each question (for its instructions)', () => {
    const steps = buildSteps(content());
    const first = steps[2];
    expect(first.kind === 'question' && first.exercise?.instructions).toBe('Complete a frase:');
  });

  it('handles a lesson without questions', () => {
    expect(ids(content({ exercises: [], other_questions: [] }))).toEqual(['s1', 's2']);
  });
});

describe('resumeIndex', () => {
  it('starts at the first unviewed section', () => {
    const c = content({ sections: [section('s1', 1, true), section('s2', 2)] });
    expect(resumeIndex(buildSteps(c), false)).toBe(1);
  });

  it('starts at the first unanswered question once every section was viewed', () => {
    const c = content({
      sections: [section('s1', 1, true), section('s2', 2, true)],
      other_questions: [],
      exercises: [
        {
          id: 'e1',
          position: 1,
          title: null,
          instructions: null,
          is_assessed: true,
          questions: [question('q1', 1, true), question('q2', 2)],
        },
      ],
    });
    expect(resumeIndex(buildSteps(c), false)).toBe(3);
  });

  it('starts from the beginning in a new attempt (sections viewed before, no answer yet)', () => {
    const c = content({ sections: [section('s1', 1, true), section('s2', 2, true)] });
    expect(resumeIndex(buildSteps(c), false)).toBe(0);
  });

  it('returns the number of steps when nothing is left', () => {
    const c = content({
      sections: [section('s1', 1, true)],
      exercises: [],
      other_questions: [question('q1', 1, true)],
    });
    expect(resumeIndex(buildSteps(c), false)).toBe(2);
  });

  it('opens a closed attempt from the beginning', () => {
    expect(resumeIndex(buildSteps(content()), true)).toBe(0);
  });
});

describe('readyToFinish', () => {
  const p = (sv: number, qa: number) => ({
    sections_required: 2,
    sections_viewed: sv,
    questions_assessed: 3,
    questions_answered: qa,
  });

  it('only when the backend reports every required section viewed and every question answered', () => {
    expect(readyToFinish(p(2, 3))).toBe(true);
    expect(readyToFinish(p(1, 3))).toBe(false);
    expect(readyToFinish(p(2, 2))).toBe(false);
  });
});

describe('sectionLabel', () => {
  it('maps known section types and hides unknown ones', () => {
    expect(sectionLabel('examples')).toBe('Exemplos');
    expect(sectionLabel('whatever')).toBeNull();
  });
});
