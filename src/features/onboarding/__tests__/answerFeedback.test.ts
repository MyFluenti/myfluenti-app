import { parsePlacementAnswer } from '@/services/placement';

import { PLACEMENT_FEEDBACK_MS, placementFeedback } from '../answerFeedback';

jest.mock('@/services/supabase', () => ({ supabase: {} }));

describe('parsePlacementAnswer', () => {
  it('reads only is_correct', () => {
    expect(parsePlacementAnswer({ is_correct: true })).toEqual({ is_correct: true });
    expect(parsePlacementAnswer({ is_correct: false })).toEqual({ is_correct: false });
  });

  it('ignores anything else that might come back', () => {
    expect(parsePlacementAnswer({ is_correct: true, explanation: 'x' })).toEqual({ is_correct: true });
  });

  it('returns null for an older backend (void) or a malformed result', () => {
    expect(parsePlacementAnswer(null)).toBeNull();
    expect(parsePlacementAnswer('')).toBeNull();
    expect(parsePlacementAnswer({})).toBeNull();
    expect(parsePlacementAnswer({ is_correct: 'true' })).toBeNull();
    expect(parsePlacementAnswer([{ is_correct: true }])).toBeNull();
  });
});

describe('placementFeedback', () => {
  it('shows "Certo!" in green on a correct answer', () => {
    expect(placementFeedback({ is_correct: true })).toEqual({ tone: 'success', text: 'Certo!' });
  });

  it('marks a wrong answer as "Incorreto" in red, without the answer key', () => {
    const feedback = placementFeedback({ is_correct: false });
    expect(feedback).toEqual({ tone: 'error', text: 'Incorreto' });
    expect(feedback?.text).not.toMatch(/resposta certa|correta/i);
  });

  it('shows nothing when the backend did not send the result', () => {
    expect(placementFeedback(null)).toBeNull();
  });

  it('keeps the notice short', () => {
    expect(PLACEMENT_FEEDBACK_MS).toBeGreaterThan(0);
    expect(PLACEMENT_FEEDBACK_MS).toBeLessThanOrEqual(1500);
  });
});
