/**
 * Testes do avatar montável.
 *
 * `fixtures/avatar.reference.js` é cópia, sem alterações, do gerador de referência aprovado
 * (pasta de handoff do avatar, em _handoff/avatar/avatar.js). Serve só de oráculo: o port TS
 * (`../render.ts`) precisa gerar a mesma saída com `clip: true`.
 */
import { DEFAULT, NAMES, random, render } from '../render';
import type { AvatarConfig } from '../types';
import { AVATAR_MAX, isValidAvatarConfig, toAvatarConfig } from '../validate';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const reference = require('./fixtures/avatar.reference.js') as {
  render: (cfg: object, size: number, opts?: { label?: string }) => string;
};

/** Normaliza o contador global de ids (`mfa12` -> `mfaN`). */
const norm = (svg: string) => svg.replace(/mfa\d+/g, 'mfaN');

/** PRNG com semente fixa (mulberry32), para os sorteios serem reprodutíveis. */
function seeded(seed: number): () => number {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const PARTS = Object.keys(AVATAR_MAX) as (keyof typeof AVATAR_MAX)[];

function cases(): { name: string; cfg: AvatarConfig }[] {
  const out: { name: string; cfg: AvatarConfig }[] = [{ name: 'DEFAULT', cfg: DEFAULT }];
  const zeros = { ...DEFAULT };
  const maxes = { ...DEFAULT };
  for (const p of PARTS) {
    zeros[p] = 0;
    maxes[p] = AVATAR_MAX[p];
  }
  out.push({ name: 'todos no mínimo', cfg: zeros }, { name: 'todos no máximo', cfg: maxes });
  for (const p of PARTS) {
    out.push({ name: `${p} mín`, cfg: { ...DEFAULT, [p]: 0 } });
    out.push({ name: `${p} máx`, cfg: { ...DEFAULT, [p]: AVATAR_MAX[p] } });
  }
  for (let hair = 0; hair <= AVATAR_MAX.hair; hair++) {
    for (let acc = 0; acc <= AVATAR_MAX.acc; acc++) {
      out.push({ name: `hair ${hair} x acc ${acc}`, cfg: { ...DEFAULT, hair, acc } });
    }
  }
  const rng = seeded(20261109);
  for (let i = 0; i < 20; i++) out.push({ name: `aleatória ${i}`, cfg: random(rng) });
  return out;
}

describe('render com clip: true', () => {
  test.each(cases().map((c) => [c.name, c.cfg] as const))('igual ao gerador de referência: %s', (_n, cfg) => {
    for (const size of [60, 112, 160]) {
      expect(norm(render(cfg, size, { clip: true }))).toBe(norm(reference.render(cfg, size)));
    }
  });

  test('label customizado igual ao de referência', () => {
    const label = 'Pré-visualização do avatar';
    expect(norm(render(DEFAULT, 160, { clip: true, label }))).toBe(
      norm(reference.render(DEFAULT, 160, { label })),
    );
  });

  test.each(cases().map((c) => [c.name, c.cfg] as const))(
    'o id do clipPath é o mesmo do url(#...): %s',
    (_n, cfg) => {
      const svg = render(cfg, 112, { clip: true });
      const def = /<clipPath id="(mfa\d+)"/.exec(svg);
      const use = /clip-path="url\(#(mfa\d+)\)"/.exec(svg);
      expect(def).not.toBeNull();
      expect(use).not.toBeNull();
      expect(use![1]).toBe(def![1]);
    },
  );

  test('gera clipPath com id mfaN único por chamada', () => {
    const a = /clipPath id="(mfa\d+)"/.exec(render(DEFAULT, 10, { clip: true }));
    const b = /clipPath id="(mfa\d+)"/.exec(render(DEFAULT, 10, { clip: true }));
    expect(a).not.toBeNull();
    expect(b).not.toBeNull();
    expect(a![1]).not.toBe(b![1]);
  });
});

describe('render com clip: false', () => {
  /** Referência sem o clip: tira <defs>...</defs> e troca <g clip-path=...> por <g>. */
  const stripClip = (svg: string) =>
    svg.replace(/<defs>.*?<\/defs>/, '').replace(/<g clip-path="url\(#mfa\d+\)">/, '<g>');

  test.each(cases().map((c) => [c.name, c.cfg] as const))(
    'igual à referência sem o clip: %s',
    (_n, cfg) => {
      expect(render(cfg, 112, { clip: false })).toBe(stripClip(reference.render(cfg, 112)));
    },
  );

  test.each(cases().map((c) => [c.name, c.cfg] as const))('sem defs nem clip-path: %s', (_n, cfg) => {
    const svg = render(cfg, 112, { clip: false });
    expect(svg).not.toMatch(/clipPath/i);
    expect(svg).not.toMatch(/clip-path/);
    expect(svg).not.toMatch(/<defs/);
    expect(svg.startsWith('<svg')).toBe(true);
    expect(svg.endsWith('</svg>')).toBe(true);
  });
});

describe('render: label e config inválida', () => {
  test('escapa o label no aria-label', () => {
    for (const clip of [true, false]) {
      const svg = render(DEFAULT, 10, { clip, label: 'a"><script' });
      expect(svg).toContain('aria-label="a&quot;&gt;&lt;script"');
      expect(svg).not.toContain('<script');
    }
    const all = render(DEFAULT, 10, { label: `&<>"'` });
    expect(all).toContain('aria-label="&amp;&lt;&gt;&quot;&#39;"');
  });

  test.each([null, undefined, {}, { ...DEFAULT, skin: 9 }, 'x'])(
    'config inválida desenha o DEFAULT: %p',
    (bad) => {
      expect(norm(render(bad, 112))).toBe(norm(render(DEFAULT, 112)));
    },
  );
});

describe('isValidAvatarConfig', () => {
  const valid = { ...DEFAULT };

  test('aceita config válida e os extremos', () => {
    expect(isValidAvatarConfig(valid)).toBe(true);
    expect(isValidAvatarConfig({ v: 1, skin: 0, hair: 0, hairColor: 0, eyes: 0, mouth: 0, acc: 0, outfit: 0, bg: 0 })).toBe(true);
    expect(isValidAvatarConfig({ v: 1, skin: 4, hair: 5, hairColor: 4, eyes: 2, mouth: 1, acc: 2, outfit: 4, bg: 4 })).toBe(true);
  });

  test.each(['v', ...PARTS])('rejeita chave faltando: %s', (key) => {
    const copy: Record<string, unknown> = { ...valid };
    delete copy[key];
    expect(isValidAvatarConfig(copy)).toBe(false);
  });

  test('rejeita chave extra', () => {
    expect(isValidAvatarConfig({ ...valid, extra: 1 })).toBe(false);
  });

  test.each(PARTS)('rejeita fora da faixa: %s', (p) => {
    expect(isValidAvatarConfig({ ...valid, [p]: AVATAR_MAX[p] + 1 })).toBe(false);
    expect(isValidAvatarConfig({ ...valid, [p]: -1 })).toBe(false);
  });

  test('rejeita versão diferente de 1', () => {
    expect(isValidAvatarConfig({ ...valid, v: 2 })).toBe(false);
    expect(isValidAvatarConfig({ ...valid, v: 0 })).toBe(false);
    expect(isValidAvatarConfig({ ...valid, v: '1' })).toBe(false);
  });

  test('rejeita float', () => {
    expect(isValidAvatarConfig({ ...valid, skin: 1.5 })).toBe(false);
    expect(isValidAvatarConfig({ ...valid, hair: 0.1 })).toBe(false);
  });

  test('rejeita string, NaN e Infinity no lugar de inteiro', () => {
    expect(isValidAvatarConfig({ ...valid, skin: '1' })).toBe(false);
    expect(isValidAvatarConfig({ ...valid, skin: Number.NaN })).toBe(false);
    expect(isValidAvatarConfig({ ...valid, skin: Number.POSITIVE_INFINITY })).toBe(false);
    expect(isValidAvatarConfig({ ...valid, skin: null })).toBe(false);
  });

  test.each([null, undefined, 1, 'x', true, [], [1, 2, 3]])('rejeita não objeto: %p', (v) => {
    expect(isValidAvatarConfig(v)).toBe(false);
  });

  test('toAvatarConfig devolve null para dado inválido', () => {
    expect(toAvatarConfig(valid)).toBe(valid);
    expect(toAvatarConfig({ ...valid, skin: 9 })).toBeNull();
    expect(toAvatarConfig(null)).toBeNull();
  });
});

describe('random e DEFAULT', () => {
  test('random() gera config válida em 1000 sorteios', () => {
    for (let i = 0; i < 1000; i++) expect(isValidAvatarConfig(random())).toBe(true);
  });

  test('random() com semente fixa também é válida e reprodutível', () => {
    const a = random(seeded(7));
    const b = random(seeded(7));
    expect(a).toEqual(b);
    expect(isValidAvatarConfig(a)).toBe(true);
  });

  test('DEFAULT é válido e tem v: 1', () => {
    expect(DEFAULT.v).toBe(1);
    expect(isValidAvatarConfig(DEFAULT)).toBe(true);
  });

  test('NAMES cobre exatamente a faixa de cada peça', () => {
    for (const p of PARTS) expect(NAMES[p]).toHaveLength(AVATAR_MAX[p] + 1);
  });
});
