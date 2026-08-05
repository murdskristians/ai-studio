import { useEffect, useState } from 'react';

/** Keep in sync with the `max-width: 768px` breakpoints in the component CSS. */
export const MOBILE_QUERY = '(max-width: 768px)';

export function isMobileViewport(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia(MOBILE_QUERY).matches
  );
}

/**
 * CSS handles the layout itself. This exists for the decisions CSS can't make:
 * whether the side panels start open, and whether a backdrop is rendered.
 */
export function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = useState(isMobileViewport);

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return;
    }

    // useState already read the current value during render, so this only has
    // to subscribe — no eager resync, which would be a setState in an effect.
    const mql = window.matchMedia(MOBILE_QUERY);
    const onChange = (event: MediaQueryListEvent) => setIsMobile(event.matches);

    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, []);

  return isMobile;
}
