import { describe, it, expect } from 'vitest';
import { getContrastColor } from './contrast';

describe('getContrastColor', () => {
  it('returns black for white background', () => {
    expect(getContrastColor('#FFFFFF')).toBe('black');
  });

  it('returns white for black background', () => {
    expect(getContrastColor('#000000')).toBe('white');
  });

  it('returns black for bright yellow', () => {
    expect(getContrastColor('#FFFF00')).toBe('black');
  });

  it('returns white for dark blue', () => {
    expect(getContrastColor('#00008B')).toBe('white');
  });

  it('returns white for the default primary color #7C3AED', () => {
    expect(getContrastColor('#7C3AED')).toBe('white');
  });

  it('returns black for light gray', () => {
    expect(getContrastColor('#D3D3D3')).toBe('black');
  });

  it('returns white for dark red', () => {
    expect(getContrastColor('#8B0000')).toBe('white');
  });
});
