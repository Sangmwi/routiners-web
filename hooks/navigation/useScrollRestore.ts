'use client';

import { RefObject, useLayoutEffect } from 'react';
import { ROUTE_STATE_CONFIG } from '@/lib/route-state/keys';
import { saveRouteScroll } from '@/lib/route-state/scroll';
import { getRouteState } from '@/lib/route-state/store';

type ScrollTarget = Window | HTMLElement;

interface UseScrollRestoreOptions {
  key: string;
  containerRef?: RefObject<HTMLElement | null>;
  enabled?: boolean;
  throttleMs?: number;
}

function getTarget(containerRef?: RefObject<HTMLElement | null>): ScrollTarget | null {
  if (typeof window === 'undefined') return null;
  return containerRef?.current ?? window;
}

function getScrollY(target: ScrollTarget): number {
  if (target instanceof Window) {
    return target.scrollY;
  }
  return target.scrollTop;
}

function setScrollY(target: ScrollTarget, y: number) {
  if (target instanceof Window) {
    target.scrollTo(0, y);
    return;
  }
  target.scrollTop = y;
}

function canRestore(target: ScrollTarget, y: number): boolean {
  if (target instanceof Window) {
    const maxScrollable =
      Math.max(
        document.documentElement.scrollHeight,
        document.body?.scrollHeight ?? 0,
      ) - window.innerHeight;
    return maxScrollable >= y - 4;
  }

  const maxScrollable = target.scrollHeight - target.clientHeight;
  return maxScrollable >= y - 4;
}

export function useScrollRestore({
  key,
  containerRef,
  enabled = true,
  throttleMs = ROUTE_STATE_CONFIG.defaultThrottleMs,
}: UseScrollRestoreOptions) {
  useLayoutEffect(() => {
    if (!enabled) return;

    const target = getTarget(containerRef);
    if (!target) return;

    const snapshot = getRouteState<Record<string, unknown>>(key);
    const restoreY = snapshot?.scrollY;
    const timers: number[] = [];

    if (typeof restoreY === 'number') {
      // 콘텐츠 높이가 늦게 커지는 페이지(Suspense/데이터 fetch)를 위해
      // 일정 시간 동안 복원을 반복 적용한다.
      const startAt = Date.now();
      const maxDurationMs = 2000;
      const retryIntervalMs = 80;

      const applyRestore = () => {
        setScrollY(target, restoreY);
      };

      const restoreLoop = () => {
        applyRestore();

        const elapsed = Date.now() - startAt;
        if (elapsed >= maxDurationMs) {
          return;
        }

        // 아직 스크롤 가능 높이가 부족하면 계속 기다렸다가 재적용
        if (!canRestore(target, restoreY)) {
          timers.push(window.setTimeout(restoreLoop, retryIntervalMs));
          return;
        }

        // 높이가 충분해져도 Next의 후행 스크롤 처리에 덮일 수 있어
        // 짧게 몇 번 더 재적용한다.
        timers.push(window.setTimeout(applyRestore, 0));
        timers.push(window.setTimeout(applyRestore, 120));
        timers.push(window.setTimeout(applyRestore, 280));
        timers.push(window.setTimeout(applyRestore, 520));
      };

      requestAnimationFrame(restoreLoop);
    }

    let ticking = false;
    let lastSavedAt = 0;

    const onScroll = () => {
      const now = Date.now();
      if (ticking || now - lastSavedAt < throttleMs) {
        return;
      }

      ticking = true;
      requestAnimationFrame(() => {
        const nextY = getScrollY(target);
        saveRouteScroll(key, nextY);

        lastSavedAt = Date.now();
        ticking = false;
      });
    };

    const eventTarget = target instanceof Window ? window : target;
    eventTarget.addEventListener('scroll', onScroll, { passive: true });

    return () => {
      timers.forEach((id) => window.clearTimeout(id));
      eventTarget.removeEventListener('scroll', onScroll);
      const currentY = getScrollY(target);
      saveRouteScroll(key, currentY);
    };
  }, [containerRef, enabled, key, throttleMs]);
}

