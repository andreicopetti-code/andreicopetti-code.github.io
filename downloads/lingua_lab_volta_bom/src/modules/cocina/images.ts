import type { ImageSourcePropType } from 'react-native';

/** ART_ASSETS_V1 — static requires for Metro bundler */
export const ORBE_WIZARD = require('../../../assets/cocina/orbe-wizard.png') as ImageSourcePropType;

export const CAT_IMAGE: Record<string, ImageSourcePropType> = {
  alimentos: require('../../../assets/cocina/cat-alimentos.png'),
  carnes: require('../../../assets/cocina/cat-carnes.png'),
  frutas: require('../../../assets/cocina/cat-frutas.png'),
  verduras: require('../../../assets/cocina/cat-verduras.png'),
  padaria: require('../../../assets/cocina/cat-padaria.png'),
  'fast-food': require('../../../assets/cocina/cat-fast-food.png'),
  bebidas: require('../../../assets/cocina/cat-bebidas.png'),
  'utensílios': require('../../../assets/cocina/cat-utensilios.png'),
  mercado: require('../../../assets/cocina/cat-mercado.png'),
  'expressões': require('../../../assets/cocina/cat-expressoes.png'),
  'falsas amigas': require('../../../assets/cocina/cat-falsas-amigas.png'),
};
