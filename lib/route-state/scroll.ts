import { ROUTE_STATE_CONFIG, createRouteStateKey } from './keys';
import { getRouteState, saveRouteState } from './store';

function isLikelyNavigationTopReset(
  scrollY: number,
  previousScrollY: number | undefined,
  previousUpdatedAt: number | undefined,
) {
  if (scrollY !== 0) return false;
  if (typeof previousScrollY !== 'number' || previousScrollY <= 0) return false;
  if (typeof previousUpdatedAt !== 'number') return false;

  return Date.now() - previousUpdatedAt < ROUTE_STATE_CONFIG.navigationTopResetWindowMs;
}

export function saveRouteScroll(key: string, scrollY: number) {
  const existing = getRouteState<Record<string, unknown>>(key);
  if (isLikelyNavigationTopReset(scrollY, existing?.scrollY, existing?.updatedAt)) {
    return existing;
  }

  return saveRouteState(key, existing?.ui ?? {}, { scrollY });
}

export function saveCurrentRouteWindowScroll() {
  if (typeof window === 'undefined') return null;
  const key = createRouteStateKey(window.location.pathname, window.location.search);
  return saveRouteScroll(key, window.scrollY);
}
