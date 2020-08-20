import { rgb, hsl } from 'd3-color';

export function getTextColorBasedOnBackground(bgColor) {
  const color = hsl(bgColor);
  return color.l > 0.32 ? '#000' : '#fff';
}

export function zip(a1, a2) {
  return a1.map((value, index) => [value, a2[index]]);
}

export function transparent(colors, opacity) {
  if (!Array.isArray(colors)) {
    return transparent([colors], opacity)[0];
  }

  return colors.map((c) => {
    const rgba = rgb(c);
    rgba.opacity = opacity;
    return rgba.toString();
  });
}

export function pairAdjacent(arr) {
  return new Array(arr.length - 1).fill(0).map((x, i) => [arr[i], arr[i + 1]]);
}
