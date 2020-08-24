import { rgb, hsl } from 'd3-color';
import ResizeObserver from 'resize-observer-polyfill';

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

/**
 * @type {WeakMap<Element, (size: {width: number, height: number}) => void>}
 */
const observerListeners = new WeakMap();
const observer = new ResizeObserver((entries) => {
  for (const entry of entries) {
    const listener = observerListeners.get(entry.target);
    if (listener) {
      listener(entry.contentRect, entry);
    }
  }
});
/**
 *
 * @param {HTMLElement} element
 * @param {(size: {width: number, height: number}) => void} listener
 */
export function observeResize(element, listener) {
  observerListeners.set(element, listener);
  observer.observe(element);
}

/**
 *
 * @param {HTMLElement} element
 */
export function unobserveResize(element) {
  observerListeners.delete(element);
  observer.unobserve(element);
}
