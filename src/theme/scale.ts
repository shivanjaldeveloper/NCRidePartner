import { Dimensions, PixelRatio } from 'react-native';

const { width, height } = Dimensions.get('window');

// Base design guideline (standard iPhone 14/15 width)
const guidelineBaseWidth = 390;
const guidelineBaseHeight = 844;

export const hscale = (size: number) => (width / guidelineBaseWidth) * size;

export const vscale = (size: number) => (height / guidelineBaseHeight) * size;

export const fscale = (size: number, factor = 0.5) =>
  size + (hscale(size) - size) * factor;

export const moderateVscale = (size: number, factor = 0.5) =>
  size + (vscale(size) - size) * factor;

export const rpx = (size: number) =>
  PixelRatio.roundToNearestPixel(hscale(size));

// Devanagari vowel signs (matras like ी, ो, ौ, ृ) and conjuncts sit further
// above/below the baseline than Latin diacritics. A lineHeight tighter than
// ~1.35x the font size clips them top/bottom on Android (this is what was
// happening on the Hindi/Marathi headings). Use this instead of a bare
// `lineHeight: fscale(N)` anywhere a style needs an explicit line height —
// it stays correct for en/hi/mr without special-casing per language, and a
// slightly airier line height reads completely fine for Latin text too.
// Pass the SAME (already fscale()'d) fontSize you gave that style's
// `fontSize` field.
export const safeLineHeight = (scaledFontSize: number, ratio = 1.4) =>
  Math.round(scaledFontSize * ratio);

export const SCREEN_WIDTH = width;
export const SCREEN_HEIGHT = height;
