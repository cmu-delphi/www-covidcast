import { rgb } from 'd3-color';
import ResizeObserver from 'resize-observer-polyfill';

export function useWhiteTextColor(bgColor: string): boolean {
  const color = rgb(bgColor);

  function normalizeChannel(channel: number) {
    const v = channel / 255;
    if (v < 0.03928) {
      return v / 12.92;
    }
    return Math.pow((v + 0.055) / 1.055, 2.4);
  }
  const r = normalizeChannel(color.r);
  const g = normalizeChannel(color.g);
  const b = normalizeChannel(color.b);
  const relLuminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;

  const blackContrast = (relLuminance + 0.05) / (0.0 + 0.05);
  const whiteContrast = (1.0 + 0.05) / (relLuminance + 0.05);
  return blackContrast < whiteContrast;
}

const observerListeners = new WeakMap<
  HTMLElement,
  (size: { width: number; height: number }, entry: ResizeObserverEntry) => void
>();
const observer = new ResizeObserver((entries: ResizeObserverEntry[]) => {
  for (const entry of entries) {
    const listener = observerListeners.get(entry.target as HTMLElement);
    if (listener) {
      listener(entry.contentRect, entry);
    }
  }
});

export function observeResize(
  element: HTMLElement,
  listener: (size: { width: number; height: number }, entry: ResizeObserverEntry) => void,
): void {
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
  function scrollImpl(remainingTries: number) {
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
