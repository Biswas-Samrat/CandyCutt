/**
 * @file ColorUtils.ts
 * @description Colour manipulation utilities for the game's candy theme.
 *              Handles HSL ↔ hex conversions, palette generation, and
 *              alpha-blending helpers used by texture generators and UI.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type RGB = { r: number; g: number; b: number };
export type RGBA = { r: number; g: number; b: number; a: number };
export type HSL = { h: number; s: number; l: number };

// ---------------------------------------------------------------------------
// Hex ↔ RGB
// ---------------------------------------------------------------------------

/**
 * Parses a CSS hex colour string (with or without '#') to an RGB object.
 * Supports both 3-digit (#RGB) and 6-digit (#RRGGBB) formats.
 */
export const hexToRgb = (hex: string): RGB => {
  const clean = hex.replace('#', '');
  if (clean.length === 3) {
    return {
      r: parseInt(clean[0] + clean[0], 16),
      g: parseInt(clean[1] + clean[1], 16),
      b: parseInt(clean[2] + clean[2], 16),
    };
  }
  return {
    r: parseInt(clean.slice(0, 2), 16),
    g: parseInt(clean.slice(2, 4), 16),
    b: parseInt(clean.slice(4, 6), 16),
  };
};

/** Converts an RGB object to a CSS hex colour string (e.g. '#FF6B9D'). */
export const rgbToHex = ({ r, g, b }: RGB): string =>
  '#' + [r, g, b].map((v) => Math.round(v).toString(16).padStart(2, '0')).join('').toUpperCase();

/** Converts an RGB object to a Phaser-compatible 0xRRGGBB number. */
export const rgbToPhaser = ({ r, g, b }: RGB): number =>
  (Math.round(r) << 16) | (Math.round(g) << 8) | Math.round(b);

/** Converts a Phaser 0xRRGGBB number to an RGB object. */
export const phaserToRgb = (color: number): RGB => ({
  r: (color >> 16) & 0xff,
  g: (color >> 8) & 0xff,
  b: color & 0xff,
});

/** Converts a CSS hex string to a Phaser 0xRRGGBB number. */
export const hexToPhaser = (hex: string): number =>
  rgbToPhaser(hexToRgb(hex));

/** Converts a Phaser 0xRRGGBB number to a CSS hex string. */
export const phaserToHex = (color: number): string =>
  rgbToHex(phaserToRgb(color));

// ---------------------------------------------------------------------------
// HSL ↔ RGB
// ---------------------------------------------------------------------------

/**
 * Converts HSL values to an RGB object.
 * @param h - Hue 0–360.
 * @param s - Saturation 0–100.
 * @param l - Lightness 0–100.
 */
export const hslToRgb = (h: number, s: number, l: number): RGB => {
  const sn = s / 100;
  const ln = l / 100;
  const a = sn * Math.min(ln, 1 - ln);

  const f = (n: number): number => {
    const k = (n + h / 30) % 12;
    return ln - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
  };

  return {
    r: Math.round(f(0) * 255),
    g: Math.round(f(8) * 255),
    b: Math.round(f(4) * 255),
  };
};

/** Converts an RGB object to HSL. */
export const rgbToHsl = ({ r, g, b }: RGB): HSL => {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;

  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const delta = max - min;

  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (delta !== 0) {
    s = delta / (1 - Math.abs(2 * l - 1));

    if (max === rn) h = ((gn - bn) / delta) % 6;
    else if (max === gn) h = (bn - rn) / delta + 2;
    else h = (rn - gn) / delta + 4;

    h = Math.round(h * 60);
    if (h < 0) h += 360;
  }

  return { h, s: Math.round(s * 100), l: Math.round(l * 100) };
};

/** Creates a CSS hsl() string. */
export const hslString = (h: number, s: number, l: number): string =>
  `hsl(${h}, ${s}%, ${l}%)`;

/** Creates a CSS hsla() string. */
export const hslaString = (h: number, s: number, l: number, a: number): string =>
  `hsla(${h}, ${s}%, ${l}%, ${a})`;

// ---------------------------------------------------------------------------
// Colour manipulation
// ---------------------------------------------------------------------------

/**
 * Lightens a hex colour by the given percentage (0–100).
 */
export const lighten = (hex: string, amount: number): string => {
  const hsl = rgbToHsl(hexToRgb(hex));
  return rgbToHex(hslToRgb(hsl.h, hsl.s, Math.min(100, hsl.l + amount)));
};

/**
 * Darkens a hex colour by the given percentage (0–100).
 */
export const darken = (hex: string, amount: number): string => {
  const hsl = rgbToHsl(hexToRgb(hex));
  return rgbToHex(hslToRgb(hsl.h, hsl.s, Math.max(0, hsl.l - amount)));
};

/**
 * Saturates a hex colour by the given amount (0–100).
 */
export const saturate = (hex: string, amount: number): string => {
  const hsl = rgbToHsl(hexToRgb(hex));
  return rgbToHex(hslToRgb(hsl.h, Math.min(100, hsl.s + amount), hsl.l));
};

/**
 * Linearly interpolates between two hex colours.
 * @param t - Mix factor 0 = colorA, 1 = colorB.
 */
export const lerpColor = (colorA: string, colorB: string, t: number): string => {
  const a = hexToRgb(colorA);
  const b = hexToRgb(colorB);
  return rgbToHex({
    r: a.r + (b.r - a.r) * t,
    g: a.g + (b.g - a.g) * t,
    b: a.b + (b.b - a.b) * t,
  });
};

/**
 * Applies an alpha value to a hex colour and returns a CSS rgba() string.
 */
export const withAlpha = (hex: string, alpha: number): string => {
  const { r, g, b } = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

// ---------------------------------------------------------------------------
// Gradient helpers
// ---------------------------------------------------------------------------

/**
 * Applies a linear gradient to a CanvasRenderingContext2D from top to bottom.
 * @param ctx - Canvas 2D context.
 * @param x - Left edge.
 * @param y - Top edge.
 * @param width - Width.
 * @param height - Height.
 * @param stops - Array of {stop: 0-1, color: hex/css string}.
 */
export const applyLinearGradient = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  stops: readonly { stop: number; color: string }[]
): void => {
  const gradient = ctx.createLinearGradient(x, y, x, y + height);
  for (const { stop, color } of stops) {
    gradient.addColorStop(stop, color);
  }
  ctx.fillStyle = gradient;
};

/**
 * Applies a radial gradient to a CanvasRenderingContext2D.
 */
export const applyRadialGradient = (
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  innerRadius: number,
  outerRadius: number,
  stops: readonly { stop: number; color: string }[]
): void => {
  const gradient = ctx.createRadialGradient(cx, cy, innerRadius, cx, cy, outerRadius);
  for (const { stop, color } of stops) {
    gradient.addColorStop(stop, color);
  }
  ctx.fillStyle = gradient;
};

// ---------------------------------------------------------------------------
// Candy colour palettes
// ---------------------------------------------------------------------------

/** The full ordered array of candy accent colours (Phaser hex numbers). */
export const CANDY_PALETTE: readonly number[] = [
  0xff6b9d, 0xa855f7, 0xffd700, 0x4ecdc4,
  0xff8c42, 0x45b7d1, 0x96ceb4, 0xc084fc,
];

/** Returns the candy colour at the given index (wraps around). */
export const candyColor = (index: number): number =>
  CANDY_PALETTE[index % CANDY_PALETTE.length];

/** Returns a CSS hex string from the candy palette. */
export const candyColorHex = (index: number): string =>
  phaserToHex(candyColor(index));

/**
 * Generates a harmonious set of colours by rotating hue from a base colour.
 */
export const generatePalette = (baseHex: string, count: number, hueStep = 30): string[] => {
  const hsl = rgbToHsl(hexToRgb(baseHex));
  return Array.from({ length: count }, (_, i) => {
    const h = (hsl.h + i * hueStep) % 360;
    return rgbToHex(hslToRgb(h, hsl.s, hsl.l));
  });
};
