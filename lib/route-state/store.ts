import { ROUTE_STATE_CONFIG, parseRouteKey } from './keys';
import {
  listSessionStorageKeys,
  readSessionSnapshot,
  removeSessionSnapshot,
  writeSessionSnapshot,
} from './session-adapter';
import type { RouteStateSnapshot } from './types';

const cache = new Map<string, RouteStateSnapshot>();

function isExpired(snapshot: RouteStateSnapshot): boolean {
  return Date.now() - snapshot.updatedAt > ROUTE_STATE_CONFIG.ttlMs;
}

function sortByUpdatedAtAsc(entries: Array<[string, RouteStateSnapshot]>) {
  return [...entries].sort((a, b) => a[1].updatedAt - b[1].updatedAt);
}

function evictOverflow() {
  if (cache.size <= ROUTE_STATE_CONFIG.maxEntries) return;

  const overflow = cache.size - ROUTE_STATE_CONFIG.maxEntries;
  const sorted = sortByUpdatedAtAsc(Array.from(cache.entries()));

  for (let i = 0; i < overflow; i += 1) {
    const [key] = sorted[i];
    cache.delete(key);
    removeSessionSnapshot(key);
  }
}

function cleanupExpired() {
  const now = Date.now();

  for (const [key, snapshot] of cache.entries()) {
    if (now - snapshot.updatedAt > ROUTE_STATE_CONFIG.ttlMs) {
      cache.delete(key);
      removeSessionSnapshot(key);
    }
  }

  const storageKeys = listSessionStorageKeys();
  for (const storageKey of storageKeys) {
    const routeKey = storageKey.replace(ROUTE_STATE_CONFIG.prefix, '');
    const snapshot = readSessionSnapshot(routeKey);
    if (!snapshot || isExpired(snapshot)) {
      removeSessionSnapshot(routeKey);
    }
  }
}

export function saveRouteState<T>(
  key: string,
  ui: T,
  options?: { scrollY?: number; updatedAt?: number },
): RouteStateSnapshot<T> {
  const now = options?.updatedAt ?? Date.now();
  const existing = cache.get(key) as RouteStateSnapshot<T> | undefined;
  const { pathname, search } = parseRouteKey(key);

  const snapshot: RouteStateSnapshot<T> = {
    key,
    pathname,
    search,
    ui,
    scrollY: options?.scrollY ?? existing?.scrollY,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
    version: 1,
  };

  cache.set(key, snapshot as RouteStateSnapshot);
  writeSessionSnapshot(key, snapshot);

  cleanupExpired();
  evictOverflow();

  return snapshot;
}

export function getRouteState<T>(key: string): RouteStateSnapshot<T> | null {
  const inMemory = cache.get(key) as RouteStateSnapshot<T> | undefined;
  if (inMemory) {
    if (isExpired(inMemory)) {
      cache.delete(key);
      removeSessionSnapshot(key);
      return null;
    }
    return inMemory;
  }

  const persisted = readSessionSnapshot<T>(key);
  if (!persisted || isExpired(persisted)) {
    removeSessionSnapshot(key);
    return null;
  }

  cache.set(key, persisted as RouteStateSnapshot);
  return persisted;
}

export function clearRouteState(key: string) {
  cache.delete(key);
  removeSessionSnapshot(key);
}

export function cleanupRouteStateStore() {
  cleanupExpired();
  evictOverflow();
}

