const ROUTE_STATE_PREFIX = 'routiners:route-state:v1:';

export function normalizeSearch(search: string): string {
  if (!search) return '';

  const query = search.startsWith('?') ? search.slice(1) : search;
  const params = new URLSearchParams(query);
  const sorted = Array.from(params.entries()).sort(([a], [b]) => a.localeCompare(b));
  const normalized = new URLSearchParams(sorted).toString();
  return normalized ? `?${normalized}` : '';
}

export function createRouteStateKey(pathname: string, search = ''): string {
  return `${pathname}${normalizeSearch(search)}`;
}

export function toStorageKey(routeKey: string): string {
  return `${ROUTE_STATE_PREFIX}${routeKey}`;
}

export function parseRouteKey(routeKey: string): { pathname: string; search: string } {
  const [pathname, ...searchParts] = routeKey.split('?');
  return {
    pathname,
    search: searchParts.length > 0 ? `?${searchParts.join('?')}` : '',
  };
}

export const ROUTE_STATE_CONFIG = {
  prefix: ROUTE_STATE_PREFIX,
  ttlMs: 30 * 60 * 1000,
  maxEntries: 40,
  defaultThrottleMs: 1000,
  navigationTopResetWindowMs: 1000,
} as const;

