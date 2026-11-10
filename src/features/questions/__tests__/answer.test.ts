import {
  EMPTY_DRAFT,
  answerModeOf,
  canSubmitDraft,
  toAnswerPayload,
  wordOrderTokens,
  type AnswerableQuestion,
} from '../answer';

const options = [
  { id: 'b', text: 'eats', position: 2 },
  { id: 'a', text: 'eat', position: 1 },
];

const q = (question_type: string, prompt_data: unknown = { v: 1 }, opts = options): AnswerableQuestion => ({
  question_type,
  prompt_data,
  options: opts,
});

describe('answerModeOf', () => {
  it('uses options for multiple_choice', () => {
    expect(answerModeOf(q('multiple_choice'))).toBe('options');
  });

  it('uses text for fill_blank and translation, even with options', () => {
    expect(answerModeOf(q('fill_blank', { v: 1, sentence: 'I ___ it.' }))).toBe('text');
    expect(answerModeOf(q('translation', { v: 1, text: 'Eu como.' }))).toBe('text');
  });

  it('uses word_order only when tokens are valid', () => {
    expect(answerModeOf(q('word_order', { v: 1, tokens: ['I', 'eat'] }, []))).toBe('word_order');
    expect(answerModeOf(q('word_order', { v: 1, tokens: [] }, []))).toBe('text');
    expect(answerModeOf(q('word_order', { v: 1, tokens: ['I', 3] }, []))).toBe('text');
    expect(answerModeOf(q('word_order', null, []))).toBe('text');
  });

  it('falls back to options or text for unknown types', () => {
    expect(answerModeOf(q('error_identification'))).toBe('options');
    expect(answerModeOf(q('something_new', { v: 2 }, []))).toBe('text');
  });
});

describe('wordOrderTokens', () => {
  it('keeps the server order untouched', () => {
    const tokens = ['book', 'I', 'a', 'read'];
    expect(wordOrderTokens({ prompt_data: { v: 1, tokens } })).toEqual(tokens);
  });

  it('rejects non-object prompt_data', () => {
    expect(wordOrderTokens({ prompt_data: ['a'] })).toBeNull();
    expect(wordOrderTokens({ prompt_data: 'x' })).toBeNull();
  });
});

describe('toAnswerPayload', () => {
  it('sends option_id for options', () => {
    const mc = q('multiple_choice');
    expect(toAnswerPayload(mc, EMPTY_DRAFT)).toBeNull();
    expect(toAnswerPayload(mc, { ...EMPTY_DRAFT, optionId: 'a' })).toEqual({ option_id: 'a' });
  });

  it('ignores an option id that is not in the question', () => {
    expect(toAnswerPayload(q('multiple_choice'), { ...EMPTY_DRAFT, optionId: 'zzz' })).toBeNull();
  });

  it('trims text but does not normalize it', () => {
    const fb = q('fill_blank', { v: 1, sentence: 'I ___ it.' });
    expect(toAnswerPayload(fb, { ...EMPTY_DRAFT, text: '   ' })).toBeNull();
    expect(toAnswerPayload(fb, { ...EMPTY_DRAFT, text: "  Don’t Eat  " })).toEqual({
      text: "Don’t Eat",
    });
  });

  it('joins word_order tokens in the chosen order', () => {
    const wo = q('word_order', { v: 1, tokens: ['book', 'I', 'a', 'read'] }, []);
    expect(toAnswerPayload(wo, EMPTY_DRAFT)).toBeNull();
    expect(toAnswerPayload(wo, { ...EMPTY_DRAFT, tokens: ['I', 'read', 'a', 'book'] })).toEqual({
      text: 'I read a book',
    });
  });

  it('only reads the field of the current mode', () => {
    const mc = q('multiple_choice');
    expect(toAnswerPayload(mc, { ...EMPTY_DRAFT, text: 'eat' })).toBeNull();
  });
});

describe('canSubmitDraft', () => {
  it('matches the payload availability', () => {
    const mc = q('multiple_choice');
    expect(canSubmitDraft(mc, EMPTY_DRAFT)).toBe(false);
    expect(canSubmitDraft(mc, { ...EMPTY_DRAFT, optionId: 'b' })).toBe(true);
  });
});
