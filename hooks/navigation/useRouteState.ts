'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ROUTE_STATE_CONFIG } from '@/lib/route-state/keys';
import { clearRouteState, getRouteState, saveRouteState } from '@/lib/route-state/store';
import type { RestoreMeta } from '@/lib/route-state/types';

interface UseRouteStateOptions<T> {
  key: string;
  initialState: T;
  version?: 1;
  throttleMs?: number;
}

function mergeState<T>(initialState: T, candidate: T): T {
  if (
    candidate &&
    typeof candidate === 'object' &&
    !Array.isArray(candidate) &&
    initialState &&
    typeof initialState === 'object' &&
    !Array.isArray(initialState)
  ) {
    return {
      ...(initialState as Record<string, unknown>),
      ...(candidate as Record<string, unknown>),
    } as T;
  }

  return candidate;
}

export function useRouteState<T>({
  key,
  initialState,
  version = 1,
  throttleMs = ROUTE_STATE_CONFIG.defaultThrottleMs,
}: UseRouteStateOptions<T>) {
  const initialStateRef = useRef(initialState);
  const restoredSnapshot = useMemo(() => getRouteState<T>(key), [key]);

  useEffect(() => {
    initialStateRef.current = initialState;
  }, [initialState]);

  const [state, setState] = useState<T>(() => {
    if (restoredSnapshot?.version === version) {
      return mergeState(initialStateRef.current, restoredSnapshot.ui);
    }
    return initialStateRef.current;
  });

  const [meta, setMeta] = useState<RestoreMeta>(() => ({
    isRestored: Boolean(restoredSnapshot?.version === version),
    restoredAt: restoredSnapshot?.version === version ? restoredSnapshot.updatedAt : null,
  }));

  useEffect(() => {
    if (restoredSnapshot?.version === version) {
      setState(mergeState(initialStateRef.current, restoredSnapshot.ui));
      setMeta({ isRestored: true, restoredAt: restoredSnapshot.updatedAt });
      return;
    }

    setState(initialStateRef.current);
    setMeta({ isRestored: false, restoredAt: null });
  }, [key, restoredSnapshot, version]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      saveRouteState<T>(key, state);
    }, throttleMs);

    return () => window.clearTimeout(timer);
  }, [key, state, throttleMs]);

  const saveNow = useCallback(
    (nextState?: T) => {
      const target = nextState ?? state;
      const scrollY =
        typeof window !== 'undefined' ? window.scrollY : undefined;
      const snapshot = saveRouteState<T>(key, target, { scrollY });
      setMeta({ isRestored: true, restoredAt: snapshot.updatedAt });
    },
    [key, state],
  );

  const clear = useCallback(() => {
    clearRouteState(key);
    setMeta({ isRestored: false, restoredAt: null });
  }, [key]);

  return {
    state,
    setState,
    saveNow,
    clear,
    restoredAt: meta.restoredAt,
    isRestored: meta.isRestored,
  };
}
