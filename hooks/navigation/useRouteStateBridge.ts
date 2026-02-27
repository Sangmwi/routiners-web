'use client';

import { useCallback } from 'react';

interface UseRouteStateBridgeOptions {
  saveNow: () => void;
}

export function useRouteStateBridge({ saveNow }: UseRouteStateBridgeOptions) {
  const beforeNavigate = useCallback(() => {
    saveNow();
  }, [saveNow]);

  return {
    beforeNavigate,
  };
}

