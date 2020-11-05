import { rgb, hsl } from 'd3-color';
import ResizeObserver from 'resize-observer-polyfill';
import debounce from 'lodash-es/debounce';

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

/**
 * Returns a function that dispatches a resize event
 * but debounced so that it will only be sent if there
 * is no previous call within the debounce time, 100ms.
 */
export const debouncedResize = debounce(
  () => {
    window.dispatchEvent(new Event('resize'));
  },
  100,
  { leading: false, trailing: true },
);
