/** Visual language from cocina-portena-v19 prototype */
export const colors = {
  bg: '#fef6e8',
  surface: '#fffdf5',
  border: '#e2c088',
  accent: '#c96a20',
  gold: '#a04e00',
  text: '#2d1400',
  muted: '#9a7050',
  dim: '#c4a480',
  green: '#2a6e2a',
  red: '#b82020',
  greenLt: '#e6f4e6',
  redLt: '#fce8e8',
  badgeBg: '#fff4e0',
  badgeBorder: '#f0c070',
  white: '#ffffff',
  progTrack: '#e8d8c0',
};

export const radii = {
  card: 20,
  btn: 14,
  pill: 99,
};

/**
 * CAT_ORDER_V4 — grid order (2 cols x 6 rows), left to right, top to bottom:
 *   alimentos       | carnes
 *   frutas          | vegetais
 *   padaria         | fast-food
 *   bebidas         | utensílios
 *   mercado         | falsas amigas
 *   frases e expressões | rodízio (mix de todas as categorias — sempre o último botão)
 */
export const CC: Record<string, { bg: string; c: string; b: string }> = {
  alimentos: { bg: '#fff8e6', c: '#7a5c00', b: '#f0c070' },
  carnes: { bg: '#ffeaea', c: '#8b0000', b: '#f09090' },
  frutas: { bg: '#fff0fb', c: '#8b006b', b: '#e890d8' },
  vegetais: { bg: '#efffef', c: '#1a6b1a', b: '#70c470' },
  padaria: { bg: '#fff4ec', c: '#7a3800', b: '#e8a060' },
  'fast-food': { bg: '#fffae0', c: '#7a5a00', b: '#d4b030' },
  bebidas: { bg: '#e8f4ff', c: '#003a7a', b: '#80b8e8' },
  'utensílios': { bg: '#f0f0f8', c: '#303068', b: '#9898c8' },
  mercado: { bg: '#eef8ee', c: '#1a5a1a', b: '#70b870' },
  'falsas amigas': { bg: '#fff0f0', c: '#8b0020', b: '#e89090' },
  'frases e expressões': { bg: '#eef0ff', c: '#242b8a', b: '#98a4e8' },
  'rodízio': { bg: '#fff3e6', c: '#8a3200', b: '#e89860' },
};

export const CAT_ICON: Record<string, string> = {
  alimentos: '🍽',
  carnes: '🥩',
  frutas: '🍎',
  vegetais: '🥦',
  padaria: '🍞',
  'fast-food': '🍔',
  bebidas: '🍺',
  'utensílios': '🔪',
  mercado: '🛒',
  'falsas amigas': '⚠️',
  'frases e expressões': '🗣',
  'rodízio': '🍢',
};

export const ALL_CATEGORIES = Object.keys(CC);

/**
 * Categoria especial: não tem itens próprios em items.json. Ao ser selecionada,
 * mistura palavras e frases de TODAS as categorias em um único deck. Sempre
 * renderizada como o último botão do cardápio.
 */
export const MIX_CATEGORY = 'rodízio';

export const CHEF_LEVELS = [
  { name: 'Novato', min: 0, max: 30, icon: '🧑‍🍳' },
  { name: 'Ajudante', min: 30, max: 80, icon: '👨‍🍳' },
  { name: 'Sous-Chef', min: 80, max: 180, icon: '🍳' },
  { name: 'Chef', min: 180, max: 350, icon: '👨‍🏫' },
  { name: 'Chef Executivo', min: 350, max: 600, icon: '⭐' },
  { name: 'Estrela Michelin', min: 600, max: Infinity, icon: '🌟' },
] as const;

export const MAX_LIVES = 5;
export const MAX_RANKING = 5;
