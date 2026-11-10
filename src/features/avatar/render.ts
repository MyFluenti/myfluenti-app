import type { AvatarConfig } from './types';
import { isValidAvatarConfig } from './validate';

// Port fiel do gerador de referência (config -> string SVG).
// As paletas são exclusivas do avatar: não entram nos tokens globais.
export const SKIN = ['#F6D5BC', '#E9B791', '#C68A5E', '#8F5E3E', '#5E3A28'];
export const HAIR = ['#2B2230', '#6B4A2E', '#D9A441', '#8B78F6', '#C9CAD3'];
export const OUTFIT = ['#8B78F6', '#55C7A5', '#F0B866', '#F07A8A', '#4A4E69'];
export const BG = ['#2A2547', '#16322F', '#3A1F2A', '#242735', '#3A3020'];
const INK = '#1A1B22';

export const NAMES = {
  skin: ['Pele 1', 'Pele 2', 'Pele 3', 'Pele 4', 'Pele 5'],
  hair: ['Curto', 'Lateral', 'Longo', 'Cacheado', 'Coque', 'Sem cabelo'],
  hairColor: ['Preto', 'Castanho', 'Loiro', 'Violeta', 'Grisalho'],
  eyes: ['Olhos redondos', 'Olhos felizes', 'Piscadinha'],
  mouth: ['Sorriso', 'Sorriso aberto'],
  acc: ['Sem acessório', 'Óculos', 'Fones'],
  outfit: ['Violeta', 'Menta', 'Âmbar', 'Rosa', 'Grafite'],
  bg: ['Violeta', 'Verde', 'Vinho', 'Grafite', 'Âmbar'],
} as const;

export const DEFAULT: AvatarConfig = {
  v: 1,
  skin: 1,
  hair: 0,
  hairColor: 1,
  eyes: 0,
  mouth: 0,
  acc: 0,
  outfit: 0,
  bg: 0,
};

function shade(hex: string, a: number): string {
  const n = parseInt(hex.slice(1), 16);
  const r = Math.round((n >> 16) * (1 - a));
  const g = Math.round(((n >> 8) & 255) * (1 - a));
  const b = Math.round((n & 255) * (1 - a));
  return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}

function hairBack(style: number, c: string): string {
  if (style === 2) {
    return '<path d="M27 47C24 24 37 16 50 16C63 16 76 24 73 47L75 78C75 83 67 83 67 78L66 54L34 54L33 78C33 83 25 83 25 78Z" fill="' + c + '"/>';
  }
  if (style === 3) {
    return '<g fill="' + c + '"><circle cx="33" cy="34" r="11"/><circle cx="45" cy="25" r="11.5"/><circle cx="57" cy="25" r="11.5"/><circle cx="68" cy="34" r="11"/><circle cx="29" cy="47" r="8"/><circle cx="71" cy="47" r="8"/></g>';
  }
  return '';
}

function hairFront(style: number, c: string): string {
  switch (style) {
    case 0:
      return '<path d="M31 45C29 27 39 21 50 21C61 21 71 27 69 45C66 38 60 34 50 34C40 34 34 38 31 45Z" fill="' + c + '"/>';
    case 1:
      return '<path d="M30 47C26 26 40 18 53 19C65 20 73 30 70 47C68 40 64 36 58 34C52 39 41 39 33 43Z" fill="' + c + '"/>';
    case 2:
      return '<path d="M31 45C30 29 40 24 50 24C60 24 70 29 69 45C64 37 58 34 50 34C42 34 36 37 31 45Z" fill="' + c + '"/>';
    case 3:
      return '<path d="M30 44C29 28 38 22 50 22C62 22 71 28 70 44C64 37 58 34 50 34C42 34 36 37 30 44Z" fill="' + c + '"/><g fill="' + c + '"><circle cx="40" cy="31" r="5.5"/><circle cx="50" cy="28.5" r="6"/><circle cx="60" cy="31" r="5.5"/></g>';
    case 4:
      return '<path d="M31 45C29 27 39 21 50 21C61 21 71 27 69 45C66 38 60 34 50 34C40 34 34 38 31 45Z" fill="' + c + '"/><circle cx="50" cy="15" r="8" fill="' + c + '"/>';
    default:
      return '';
  }
}

function eyes(kind: number): string {
  const dot = (x: number) => '<circle cx="' + x + '" cy="47" r="2.5" fill="' + INK + '"/>';
  const arc = (x: number) =>
    '<path d="M' + (x - 3.5) + ' 48.5Q' + x + ' 43.5 ' + (x + 3.5) + ' 48.5" fill="none" stroke="' + INK + '" stroke-width="2.4" stroke-linecap="round"/>';
  if (kind === 1) return arc(42) + arc(58);
  if (kind === 2) return dot(42) + arc(58);
  return dot(42) + dot(58);
}

function mouth(kind: number): string {
  if (kind === 1) {
    return '<path d="M43 55.5Q50 65 57 55.5Z" fill="' + INK + '" stroke="' + INK + '" stroke-width="1.6" stroke-linejoin="round"/>';
  }
  return '<path d="M43.5 56Q50 62 56.5 56" fill="none" stroke="' + INK + '" stroke-width="2.2" stroke-linecap="round"/>';
}

function accessory(kind: number): string {
  if (kind === 1) {
    return '<g fill="#F4F4F7" fill-opacity=".12" stroke="' + INK + '" stroke-width="2"><rect x="35" y="41" width="13" height="10.5" rx="4.5"/><rect x="52" y="41" width="13" height="10.5" rx="4.5"/></g><path d="M48 45.5H52" stroke="' + INK + '" stroke-width="2" stroke-linecap="round"/>';
  }
  if (kind === 2) {
    return '<path d="M28.5 48C26 20 74 20 71.5 48" fill="none" stroke="#B9ACFF" stroke-width="4" stroke-linecap="round"/><rect x="24" y="44" width="9" height="15" rx="4.5" fill="#B9ACFF"/><rect x="67" y="44" width="9" height="15" rx="4.5" fill="#B9ACFF"/>';
  }
  return '';
}

function escapeAttr(v: string): string {
  return v
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export type RenderOptions = {
  /**
   * true: saída idêntica à do gerador de referência, com clipPath de id único (`mfaN`).
   * false: sem defs nem clip-path; o recorte circular fica por conta de quem desenha.
   */
  clip?: boolean;
  label?: string;
  /**
   * false: omite role e aria-label do <svg>. Use com SvgXml (react-native-svg), que repassa
   * `aria-label` ao DOM como `ariaLabel` (atributo inválido); a acessibilidade fica na View.
   */
  a11yAttrs?: boolean;
};

let uid = 0;

/** Só o gerador de SVG: config inválida (ou ausente) desenha o DEFAULT. */
export function render(
  cfg: unknown,
  size: number,
  { clip = true, label, a11yAttrs = true }: RenderOptions = {},
): string {
  // Defesa em profundidade: sem isso, índice fora da faixa geraria SVG com "undefined".
  const c = isValidAvatarConfig(cfg) ? cfg : DEFAULT;
  const skin = SKIN[c.skin];
  const hair = HAIR[c.hairColor];
  let s =
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="' + size + '" height="' + size + '"' + (a11yAttrs ? ' role="img" aria-label="' + escapeAttr(label || 'Avatar') + '"' : '') + '>';
  if (clip) {
    const id = 'mfa' + ++uid;
    s += '<defs><clipPath id="' + id + '"><circle cx="50" cy="50" r="50"/></clipPath></defs>';
    s += '<g clip-path="url(#' + id + ')">';
  } else {
    s += '<g>';
  }
  s += '<rect width="100" height="100" fill="' + BG[c.bg] + '"/>';
  s += hairBack(c.hair, hair);
  s += '<path d="M14 100C14 80 30 70 50 70C70 70 86 80 86 100Z" fill="' + OUTFIT[c.outfit] + '"/>';
  s += '<rect x="43" y="56" width="14" height="19" rx="7" fill="' + shade(skin, 0.1) + '"/>';
  s += '<path d="M41 70L50 82L59 70Z" fill="' + shade(skin, 0.1) + '"/>';
  s += '<circle cx="31" cy="48" r="4.2" fill="' + skin + '"/><circle cx="69" cy="48" r="4.2" fill="' + skin + '"/>';
  s += '<ellipse cx="50" cy="46" rx="19" ry="21" fill="' + skin + '"/>';
  s += '<circle cx="37" cy="54" r="3.4" fill="#F07A8A" fill-opacity=".28"/><circle cx="63" cy="54" r="3.4" fill="#F07A8A" fill-opacity=".28"/>';
  s += eyes(c.eyes) + mouth(c.mouth);
  s += hairFront(c.hair, hair);
  s += accessory(c.acc);
  s += '</g></svg>';
  return s;
}

/** Sorteia uma config válida. `rng` existe para os testes usarem uma semente fixa. */
export function random(rng: () => number = Math.random): AvatarConfig {
  const r = (n: number) => Math.floor(rng() * n);
  return {
    v: 1,
    skin: r(5),
    hair: r(6),
    hairColor: r(5),
    eyes: r(3),
    mouth: r(2),
    acc: r(3),
    outfit: r(5),
    bg: r(5),
  };
}
