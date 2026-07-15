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

export const SCREEN_WIDTH = width;
export const SCREEN_HEIGHT = height;
