/**
 * プロジェクトで使用する定義済みカラーを集約した定数。
 * 共通カラーとシーン別パレットを切り分けることで、
 * グラフィックモジュール同士の色調整を一元管理する。
 */
export const ColorPalette = {
  common: {
    white: '#FFFFFF',
    black: '#000000',
    yellow: '#FFFF00',
    blueLight: '#9BE7FF',
    blueDeep: '#003B8E',
    greyHighlight: '#E5E5E5',
  },
  scenes: {
    sunny: {
      base: '#D21E3C',
      highlight: '#E5E5E5',
    },
    cloud: {
      base: '#FFFFFF',
      abstract: '#FFFFFF',
      detailed: '#FFFFFF',
      overlay: '#FFFFFF',
      glitchLine: '#FFFFFF',
    },
    wave: {
      monochromeLight: '#FFFFFF',
      monochromeDark: '#FFFFFF',
      oceanLight: '#2DA9FF',
      oceanDark: '#FFFFFF',
      accent: '#FFFFFF',
    },
    umbrella: {
      allowed: ['#D21E3C', '#FF7A1F', '#FFD100', '#FFFFFF'],
    },
    thunder: {
      bolt: '#FFD100',
      highlight: '#FF7A1F',
    },
    sushi: {
      rice: '#FFFFFF',
      nori: '#000000',
      conveyor: '#FF7A1F',
      accent: '#D21E3C',
      neta: {
        maguro: {
          base: '#D21E3C',
          stripe: '#FFFFFF',
        },
        salmon: {
          base: '#FF7A1F',
          stripe: '#FFFFFF',
        },
        tamago: {
          base: '#FFD100',
        },
      },
    },
    sushiText: {
      background: '#000000',
      palette: ['#FF7A1F', '#D21E3C', '#FFD100', '#FFFFFF', '#000000', '#003B8E'],
    },
    flowText: {
      allowed: ['#FF7A1F', '#D21E3C', '#FFD100', '#FFFFFF', '#000000', '#003B8E'],
    },
  },
} as const;