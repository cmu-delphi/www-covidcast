import { hsl } from 'd3-color';
import ResizeObserver from 'resize-observer-polyfill';

export function getTextColorBasedOnBackground(bgColor) {
  const color = hsl(bgColor);
  return color.l > 0.32 ? '#000' : '#fff';
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

export function downloadUrl(url, name) {
  const a = document.createElement('a');
  a.download = name;
  a.href = url;
  a.style.position = 'absolute';
  a.style.left = '-10000px';
  a.style.top = '-10000px';
  document.body.appendChild(a);
  a.click();
  a.remove();
}
