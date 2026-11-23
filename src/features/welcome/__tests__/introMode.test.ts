import { introModeFor } from '../introMode';

describe('introModeFor', () => {
  it('animates whenever the welcome screen opens', () => {
    expect(introModeFor(false)).toBe('animate');
  });

  it('only fades when reduce motion is on', () => {
    expect(introModeFor(true)).toBe('fade');
  });
});
