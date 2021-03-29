import { rgb, hsl } from 'd3-color';
import ResizeObserver from 'resize-observer-polyfill';

export function getTextColorBasedOnBackground(bgColor: string): string {
  const color = hsl(bgColor);
  return color.l > 0.32 ? '#000' : '#fff';
}

export function zip<T1, T2>(a1: readonly T1[], a2: readonly T2[]): [T1, T2][] {
  return a1.map((value, index) => [value, a2[index]]);
}

export function transparent(colors: string, opacity: number): string;
export function transparent(colors: readonly string[], opacity: number): string[];
export function transparent(colors: string | readonly string[], opacity: number): string | string[] {
  if (!Array.isArray(colors)) {
    return transparent([colors as string], opacity)[0];
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
 * @param duration of neighborhood, in milliseconds
 */
export function computeNeighborhood(date: Date, startDate: Date, endDate: Date, duration?: number): { start: number, end: number } {
  if (duration == null) {
    duration = endDate.valueOf() - startDate.valueOf();
  }
  const neighborhood = { start: date.valueOf() - duration / 2, end: date.getTime() + duration / 2 };

  // Shift the neighborhood to be within the start and end dates.
  let offset = startDate.valueOf() - neighborhood.start.valueOf();
  if (offset <= 0) {
    // neighborhood starts after startDate, so then check endDate
    offset = endDate.valueOf() - neighborhood.end.valueOf();
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

const observerListeners = new WeakMap<HTMLElement, (size: { width: number, height: number }, entry: ResizeObserverEntry) => void>();
const observer = new ResizeObserver((entries: ResizeObserverEntry[]) => {
  for (const entry of entries) {
    const listener = observerListeners.get(entry.target as HTMLElement);
    if (listener) {
      listener(entry.contentRect, entry);
    }
  }
});

export function observeResize(element: HTMLElement, listener: (size: { width: number, height: number }, entry: ResizeObserverEntry) => void): void {
  observerListeners.set(element, listener);
  observer.observe(element);
}

export function unobserveResize(element: HTMLElement): void {
  observerListeners.delete(element);
  observer.unobserve(element);
}

export function downloadUrl(url: string, name: string): void {
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

export function scrollToTop(): void {
  window.scrollTo({
    top: 0,
    behavior: 'auto',
  });
}

/**
 * looks for the given id and scrolls into view
 */
export function scrollIntoView(id: string, tries = 8, timeout = 500): void {
  if (!id) {
    return;
  }
  function scrollImpl(remainingTries) {
    const elem = document.querySelector(`#${id}`);
    if (elem && elem.getBoundingClientRect().y > 0) {
      elem.scrollIntoView();
      console.log('scroll');
    } else if (remainingTries > 0) {
      setTimeout(scrollImpl, timeout, remainingTries - 1);
    }
  }
  setTimeout(scrollImpl, timeout, tries);
}
