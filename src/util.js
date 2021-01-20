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

/**
 * Returns a neighborhood around date that is between startDate and endDate.
 * Default duration is the same as endDate - startDate.
 *
 * @param {Date} date
 * @param {Date} startDate
 * @param {Date} endDate
 * @param {number|null} duration of neighborhood, in milliseconds
 */
export function computeNeighborhood(date, startDate, endDate, duration) {
  if (duration == null) {
    duration = endDate - startDate;
  }
  const neighborhood = { start: date - duration / 2, end: date.getTime() + duration / 2 };

  // Shift the neighborhood to be within the start and end dates.
  let offset = startDate - neighborhood.start;
  if (offset <= 0) {
    // neighborhood starts after startDate, so then check endDate
    offset = endDate - neighborhood.end;
    if (offset >= 0) {
      // neighborhood ends before endDate, so no offset
      offset = 0;
    }
  }
  // Apply the offset.
  neighborhood.start = neighborhood.start + offset;
  neighborhood.end = neighborhood.end + offset;
  // console.info('neighborhood', new Date(neighborhood.start), new Date(neighborhood.end));
  return neighborhood;
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
