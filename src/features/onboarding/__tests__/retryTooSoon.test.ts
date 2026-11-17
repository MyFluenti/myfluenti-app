import { toAppError } from '@/services/errors';

import { placementErrorMessage, retryTooSoonMessage } from '../messages';

jest.mock('@/services/supabase', () => ({ supabase: {} }));

const iso = '2026-11-24T22:36:40Z';
const fmt = () => '24/11';

describe('toAppError: placement_retry_too_soon', () => {
  it('reads the stable message and the date in the hint', () => {
    const error = toAppError({ code: 'P0001', message: 'placement_retry_too_soon', hint: iso });
    expect(error.kind).toBe('placement_retry_too_soon');
    expect(error.availableAt).toBe(iso);
  });

  it('keeps the error even without a valid hint', () => {
    const error = toAppError({ code: 'P0001', message: 'placement_retry_too_soon', hint: 'x' });
    expect(error.kind).toBe('placement_retry_too_soon');
    expect(error.availableAt).toBeNull();
  });
});

describe('retryTooSoonMessage', () => {
  it('counts whole days up to the date sent by the backend', () => {
    const now = new Date('2026-11-17T22:36:40Z');
    expect(retryTooSoonMessage(iso, now, fmt)).toBe(
      'O próximo teste de nivelamento fica disponível em 7 dias (a partir de 24/11).',
    );
  });

  it('rounds a partial day up and uses the singular', () => {
    const now = new Date('2026-11-24T10:00:00Z');
    expect(retryTooSoonMessage(iso, now, fmt)).toBe(
      'O próximo teste de nivelamento fica disponível em 1 dia (a partir de 24/11).',
    );
  });

  it('falls back to a generic text without a date', () => {
    expect(retryTooSoonMessage(null, new Date(), fmt)).toMatch(/ainda não está disponível/);
  });
});

describe('placementErrorMessage', () => {
  it('turns the cooldown error into the days message', () => {
    const now = new Date('2026-11-20T22:36:40Z');
    const message = placementErrorMessage(
      { code: 'P0001', message: 'placement_retry_too_soon', hint: iso },
      now,
    );
    expect(message).toMatch(/fica disponível em 4 dias/);
  });
});
