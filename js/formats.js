// Colour code formats the game can show. Add HSL, RGBA, etc. here and they
// become selectable modes without touching the game logic.
import { rgbToHex, rgbToHsl } from './color.js';

export const FORMATS = {
  hex: {
    id: 'hex',
    label: 'HEX',
    format: (rgb) => rgbToHex(rgb),
  },
  // Ready for the roadmap — not yet exposed in the UI.
  rgb: {
    id: 'rgb',
    label: 'RGB',
    format: ({ r, g, b }) => `rgb(${r}, ${g}, ${b})`,
  },
  hsl: {
    id: 'hsl',
    label: 'HSL',
    format: (rgb) => {
      const { h, s, l } = rgbToHsl(rgb);
      return `hsl(${Math.round(h)}, ${Math.round(s)}%, ${Math.round(l)}%)`;
    },
  },
};

export const getFormat = (id) => FORMATS[id] ?? FORMATS.hex;
