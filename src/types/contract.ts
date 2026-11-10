// Tipos dos retornos jsonb das RPCs, escritos a partir de
// myfluenti-docs/docs/dados/api.md (o supabase gen types devolve `Json` para jsonb).
// Não são gerados: se o contrato mudar, atualize aqui junto com api.md.

import type { Database } from './database';

type Fn = Database['public']['Functions'];

export type CourseModule = Fn['get_course_overview']['Returns'][number];
export type ModuleLesson = Fn['get_module_lessons']['Returns'][number];

export type ModuleState = 'locked_plan' | 'locked' | 'available' | 'in_progress' | 'completed';
export type AccessTier = 'free' | 'premium';

/** Resposta do aluno. Múltipla escolha ou texto. */
export type AnswerPayload = { option_id: string } | { text: string };

export type PlacementResult = {
  score_pct: number;
  recommended_level_id: string;
  recommended_level_code: string;
  competency_breakdown: unknown;
};

export type PlacementCompetency = 'vocabulary' | 'grammar' | 'reading' | 'construction';

export type PlacementQuestion = {
  id: string;
  question_type: string;
  prompt: string;
  prompt_data: unknown;
  options: { id: string; text: string; position: number }[];
};

/** Retorno de get_placement_items (api.md 9.2). Sem acerto, peso ou explicação. */
export type PlacementItems = {
  attempt: {
    id: string;
    status: 'in_progress';
    placement_test_id: string;
    total_questions: number;
    answered_count: number;
  };
  items: {
    position: number;
    competency: string;
    answered: boolean;
    question: PlacementQuestion;
  }[];
};

/** Linha própria de user_placement_attempts (select permitido pelo RLS). */
export type PlacementAttemptRow = {
  id: string;
  status: string;
  score_pct: number | null;
  recommended_level_id: string | null;
  competency_breakdown: unknown;
};

export type Level = { id: string; code: string; title: string; position: number };

export type LessonAnswerResult = {
  is_correct: boolean;
  awarded_points: number;
  max_points: number;
  explanation: string | null;
};

export type LessonFinishResult = {
  score_pct: number;
  passed: boolean;
  score_ok: boolean;
  sections_complete: boolean;
  all_questions_answered: boolean;
  module_completed: boolean;
};

export type LibraryType = 'grammar' | 'vocabulary';

export type LibraryFilters = {
  type?: LibraryType;
  levelCode?: string;
  query?: string;
  category?: string;
  limit?: number;
  offset?: number;
};

export type LibrarySearchItem = {
  type: LibraryType;
  id: string;
  slug: string | null;
  title: string;
  subtitle: string | null;
  category: string | null;
  part_of_speech: string | null;
  level_code: string | null;
  access_tier: AccessTier;
  locked: boolean;
  mastery_pct: number | null;
  is_favorite: boolean;
};

export type LibrarySearchResult = {
  items: LibrarySearchItem[];
  total: number;
  limit: number;
  offset: number;
  has_more: boolean;
};

export type LibraryGrammarItem = {
  type: 'grammar';
  id: string;
  slug: string;
  title: string;
  category: string | null;
  summary: string | null;
  content: unknown;
  level_code: string | null;
  access_tier: AccessTier;
  mastery: { pct: number; attempts: number; correct: number; last_practiced_at: string | null } | null;
  notes_count: number;
};

export type LibraryVocabularyItem = {
  type: 'vocabulary';
  id: string;
  lemma: string;
  part_of_speech: string | null;
  meaning_pt: string;
  level_code: string | null;
  access_tier: AccessTier;
  forms: { label: string; text: string; meaning_pt: string | null }[];
  examples: { id: string; en: string; pt: string; is_favorite: boolean }[];
  is_favorite: boolean;
  is_learned: boolean;
  notes_count: number;
};

export type LibraryItem = LibraryGrammarItem | LibraryVocabularyItem;

export type FavoriteKind = 'word' | 'phrase';

export type FavoriteItem = {
  kind: FavoriteKind;
  id: string;
  title: string | null;
  subtitle: string | null;
  vocabulary_id: string;
  access_tier: AccessTier;
  locked: boolean;
  favorited_at: string;
};

export type FavoritesResult = {
  items: FavoriteItem[];
  total: number;
  has_more: boolean;
};

export type ReviewQuestionOption = { id: string; text: string; position: number };

export type ReviewQueueItem =
  | {
      schedule_id: string;
      item_type: 'vocabulary';
      due_at: string;
      vocabulary: {
        id: string;
        lemma: string;
        part_of_speech: string | null;
        meaning_pt: string;
        examples: { id: string; en: string; pt: string }[];
      };
    }
  | {
      schedule_id: string;
      item_type: 'question';
      due_at: string;
      question: {
        id: string;
        question_type: string;
        prompt: string;
        prompt_data: Record<string, unknown>;
        options: ReviewQuestionOption[];
      };
    }
  | {
      schedule_id: string;
      item_type: 'grammar_topic';
      due_at: string;
      grammar_topic: { id: string; slug: string; title: string; summary: string | null };
    };

export type ReviewQueue = {
  due_count: number;
  locked_count: number;
  items: ReviewQueueItem[];
  upcoming: { tomorrow: number; next_7_days: number };
  next_due_at: string | null;
};

export type ReviewAnswerResult = { is_correct: boolean; explanation: string | null };

export type ReviewRecordResult = {
  next_review_in_days: number;
  ease_factor: number;
  repetitions: number;
};

export type ReviewSummary = {
  session_id: string;
  reviewed_count: number;
  hard: number;
  good: number;
  easy: number;
  correct: number;
  incorrect: number;
  remaining_due: number;
  next_due_at: string | null;
};

export type ProfileSummary = {
  display_name: string | null;
  email: string;
  /** Objeto v1 ou null (avatar padrão). Vem do banco; valide antes de usar. */
  avatar_config: unknown;
  current_level: { id: string; code: string; title: string } | null;
  plan_tier: AccessTier;
  placement: {
    completed: boolean;
    last_recommended_level_code: string | null;
    last_completed_at: string | null;
  };
  progress: { lessons_completed: number; modules_completed: number };
  mastery: {
    grammar_topic_id: string;
    slug: string;
    title: string;
    mastery_pct: number;
    attempts: number;
  }[];
  review: { due_today: number; total_scheduled: number };
  favorites_count: number;
  notes_count: number;
};

// get_lesson_content (api.md, seção 9.1). O gabarito nunca vem: só a correção de
// questões já respondidas nesta tentativa.
export type LessonQuestionAnswer = {
  is_correct: boolean;
  awarded_points: number;
  explanation: string | null;
};

export type LessonQuestion = {
  id: string;
  position: number;
  question_type: string;
  prompt: string;
  prompt_data: unknown;
  is_assessed: boolean;
  max_points: number;
  options: { id: string; text: string; position: number }[];
  answer: LessonQuestionAnswer | null;
};

export type LessonSection = {
  id: string;
  position: number;
  section_type: string;
  title: string | null;
  content: unknown;
  is_required: boolean;
  viewed: boolean;
};

export type LessonExercise = {
  id: string;
  position: number;
  title: string | null;
  instructions: string | null;
  is_assessed: boolean;
  questions: LessonQuestion[];
};

export type LessonContent = {
  attempt: { id: string; status: string; lesson_version_id: string; version_number: number };
  lesson: { id: string; module_id: string; position: number; title: string; objective: string | null };
  sections: LessonSection[];
  exercises: LessonExercise[];
  other_questions: LessonQuestion[];
  progress: {
    sections_required: number;
    sections_viewed: number;
    questions_assessed: number;
    questions_answered: number;
  };
};
