import type { RouteStateSnapshot } from './types';
import { ROUTE_STATE_CONFIG, toStorageKey } from './keys';

function isBrowser() {
  return typeof window !== 'undefined' && typeof window.sessionStorage !== 'undefined';
}

export function readSessionSnapshot<T>(routeKey: string): RouteStateSnapshot<T> | null {
  if (!isBrowser()) return null;

  try {
    const raw = window.sessionStorage.getItem(toStorageKey(routeKey));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as RouteStateSnapshot<T>;
    return parsed;
  } catch {
    return null;
  }
}

export function writeSessionSnapshot<T>(routeKey: string, snapshot: RouteStateSnapshot<T>) {
  if (!isBrowser()) return;

  try {
    window.sessionStorage.setItem(toStorageKey(routeKey), JSON.stringify(snapshot));
  } catch {
    // no-op
  }
}

export function removeSessionSnapshot(routeKey: string) {
  if (!isBrowser()) return;

  try {
    window.sessionStorage.removeItem(toStorageKey(routeKey));
  } catch {
    // no-op
  }
}

export function listSessionStorageKeys(): string[] {
  if (!isBrowser()) return [];

  const keys: string[] = [];
  try {
    for (let i = 0; i < window.sessionStorage.length; i += 1) {
      const key = window.sessionStorage.key(i);
      if (key && key.startsWith(ROUTE_STATE_CONFIG.prefix)) {
        keys.push(key);
      }
    }
  } catch {
    return [];
  }

  return keys;
}

