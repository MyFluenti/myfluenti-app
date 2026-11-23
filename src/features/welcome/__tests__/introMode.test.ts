import {
  WELCOME_ANIMATION_SEEN_KEY,
  introModeFor,
  markSeen,
  readSeen,
  type FlagStorage,
} from '../introMode';

const memory = (initial: Record<string, string> = {}): FlagStorage & { data: Record<string, string> } => {
  const data = { ...initial };
  return {
    data,
    getItem: async (k) => data[k] ?? null,
    setItem: async (k, v) => {
      data[k] = v;
    },
  };
};

describe('introModeFor', () => {
  it('waits while the flag is being read', () => {
    expect(introModeFor(null, false)).toBe('loading');
    expect(introModeFor(null, true)).toBe('loading');
  });

  it('animates on the first opening', () => {
    expect(introModeFor(false, false)).toBe('animate');
  });

  it('only fades on the first opening when reduce motion is on', () => {
    expect(introModeFor(false, true)).toBe('fade');
  });

  it('shows the final state once the animation was seen', () => {
    expect(introModeFor(true, false)).toBe('static');
    expect(introModeFor(true, true)).toBe('static');
  });
});

describe('seen flag', () => {
  it('is false on a fresh device and true after marking', async () => {
    const storage = memory();
    expect(await readSeen(storage)).toBe(false);
    await markSeen(storage);
    expect(storage.data[WELCOME_ANIMATION_SEEN_KEY]).toBe('1');
    expect(await readSeen(storage)).toBe(true);
  });

  it('treats a storage read failure as seen (never blocks the screen)', async () => {
    const failing: FlagStorage = {
      getItem: () => Promise.reject(new Error('x')),
      setItem: () => Promise.reject(new Error('x')),
    };
    expect(await readSeen(failing)).toBe(true);
    await expect(markSeen(failing)).resolves.toBeUndefined();
  });

  it('uses the documented key', () => {
    expect(WELCOME_ANIMATION_SEEN_KEY).toBe('welcome_animation_seen');
  });
});
