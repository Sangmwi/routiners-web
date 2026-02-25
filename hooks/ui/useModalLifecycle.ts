'use client';

import { useEffect, useRef, useState } from 'react';
import type { WebToAppMessage } from '@/lib/webview/types';

// ============================================================================
// Module-level overlay stack
// ============================================================================

type OverlayEntry = {
  close: () => void;
  preventClose: boolean;
};

/** 열린 오버레이를 LIFO 순서로 추적 */
const overlayStack: Map<string, OverlayEntry> = new Map();

/** UI에서 닫혀서 history.back() 호출한 횟수 — 해당 popstate를 무시하기 위함 */
let skipPopstateCount = 0;

let listenerAttached = false;

function handlePopState(e: PopStateEvent) {
  // skip 이벤트: UI 닫힘으로 인한 history.back() — Next.js에도 전파 차단
  if (skipPopstateCount > 0) {
    skipPopstateCount--;
    e.stopImmediatePropagation();
    return;
  }

  if (overlayStack.size === 0) return;

  // 오버레이가 열려있으면 Next.js에 전파 차단 (페이지 이동 방지)
  e.stopImmediatePropagation();

  // LIFO: 마지막에 추가된 오버레이를 닫기
  const entries = Array.from(overlayStack.entries());
  const [id, entry] = entries[entries.length - 1];

  if (entry.preventClose) {
    // 닫기 방지 상태 — 히스토리 엔트리 복원
    history.pushState({ ...history.state, __overlay: id }, '');
    return;
  }

  overlayStack.delete(id);
  broadcastOverlayState();
  entry.close(); // → requestClose('popstate') 호출
}

function ensureListener() {
  if (listenerAttached || typeof window === 'undefined') return;
  // capture phase로 등록하여 Next.js보다 먼저 실행
  window.addEventListener('popstate', handlePopState, true);
  listenerAttached = true;
}

/**
 * 모든 오버레이를 즉시 정리 (페이지 이동 시 ModalProvider에서 호출)
 *
 * history.back()은 호출하지 않음 — 비동기 popstate가 Next.js 라우팅을 방해할 수 있고,
 * 같은 URL의 pushState 엔트리이므로 사용자에게 영향 없음.
 */
export function clearOverlayStack() {
  if (overlayStack.size === 0) return;
  overlayStack.clear();
  broadcastOverlayState();
}

/** WebView 환경이면 오버레이 상태를 앱에 전송 */
function broadcastOverlayState() {
  if (typeof window === 'undefined' || !window.ReactNativeWebView) return;
  const message: WebToAppMessage = {
    type: 'OVERLAY_STATE',
    payload: { hasOverlay: overlayStack.size > 0 },
  };
  window.ReactNativeWebView.postMessage(JSON.stringify(message));
}

// ============================================================================
// Constants
// ============================================================================

export const ANIMATION_DURATION = 200;
export const OPEN_ANIMATION_DURATION = 300;

// ============================================================================
// Types
// ============================================================================

interface UseModalLifecycleOptions {
  /** true이면 뒤로가기로 닫히지 않음 (로딩 중 등) */
  preventClose?: boolean;
  /** 닫기 애니메이션 완료 후 호출 (DOM에서 제거 등) */
  onExited?: () => void;
}

interface UseModalLifecycleReturn {
  isVisible: boolean;
  isAnimating: boolean;
  hasOpened: boolean;
  /** 드래그 등 상호작용 시 오픈 애니메이션 재실행 방지 */
  markOpened: () => void;
  /** 모든 닫기 트리거의 단일 진입점 — overlay 정리 + 애니메이션 + onClose */
  executeClose: () => void;
}

// ============================================================================
// Hook
// ============================================================================

/**
 * 모달 가시성/애니메이션/히스토리를 통합 관리하는 훅.
 *
 * useModalState + useOverlayHistory를 하나로 통합하여:
 * - executeClose()가 overlay를 즉시 동기 정리 → 타이밍 갭 제거
 * - popstate/UI 닫기를 source 매개변수로 구분 → closedByPopstateRef 불필요
 * - 별도 dismiss() 불필요 → dismissRef 패턴 제거
 */
export function useModalLifecycle(
  isOpen: boolean,
  onClose: () => void,
  options?: UseModalLifecycleOptions,
): UseModalLifecycleReturn {
  const [isVisible, setIsVisible] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [hasOpened, setHasOpened] = useState(false);

  const idRef = useRef('');
  const isRegisteredRef = useRef(false);
  const isClosingRef = useRef(false);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  const onExitedRef = useRef(options?.onExited);
  onExitedRef.current = options?.onExited;

  // 리스너 등록 (최초 1회)
  useEffect(() => {
    ensureListener();
  }, []);

  // preventClose 옵션 실시간 반영
  useEffect(() => {
    if (!isRegisteredRef.current) return;
    const entry = overlayStack.get(idRef.current);
    if (entry) {
      entry.preventClose = options?.preventClose ?? false;
    }
  }, [options?.preventClose]);

  // ── 통합 닫기 함수 ──────────────────────────────────────────────
  const requestClose = (source: 'ui' | 'popstate') => {
    if (isClosingRef.current) return;
    isClosingRef.current = true;

    // 1. overlay 즉시 동기 정리
    if (isRegisteredRef.current) {
      if (overlayStack.has(idRef.current)) {
        overlayStack.delete(idRef.current);
        broadcastOverlayState();
        if (source === 'ui') {
          skipPopstateCount++;
          history.back();
        }
      }
      isRegisteredRef.current = false;
    }

    // 2. 닫기 애니메이션
    setIsAnimating(true);
    setTimeout(() => {
      setIsAnimating(false);
      setIsVisible(false);
      setHasOpened(false);
      isClosingRef.current = false;
      onCloseRef.current();
      onExitedRef.current?.();
    }, ANIMATION_DURATION);
  };

  // ── 열림/닫힘 처리 ─────────────────────────────────────────────
  useEffect(() => {
    if (isOpen && !isRegisteredRef.current && !isClosingRef.current) {
      // 최초 열림일 때만 visibility 설정 (Strict Mode 재마운트 시에는 skip)
      if (!isVisible) {
        setIsVisible(true);
        setIsAnimating(false);
        setHasOpened(false);
      }

      // overlay 등록 (Strict Mode 재마운트 시에도 실행)
      const id = `overlay_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
      idRef.current = id;
      isRegisteredRef.current = true;

      overlayStack.set(id, {
        close: () => requestClose('popstate'),
        preventClose: options?.preventClose ?? false,
      });

      history.pushState({ ...history.state, __overlay: id }, '');
      broadcastOverlayState();

      if (!isVisible) {
        const timer = setTimeout(() => setHasOpened(true), OPEN_ANIMATION_DURATION);
        return () => clearTimeout(timer);
      }
    }

    // isOpen이 false로 변한 경우 (controlled 패턴)
    if (!isOpen && isVisible && !isClosingRef.current) {
      requestClose('ui');
    }
  }, [isOpen, isVisible]);

  // ── 언마운트 정리 ──────────────────────────────────────────────
  useEffect(() => {
    return () => {
      if (isRegisteredRef.current) {
        if (overlayStack.has(idRef.current)) {
          overlayStack.delete(idRef.current);
          broadcastOverlayState();
          // history.back()은 호출하지 않음 — 언마운트 후 비동기 popstate는
          // Next.js 페이지 이동을 유발할 수 있음. overlay용 history 엔트리가
          // 남지만 같은 URL이므로 사용자에게 영향 없음.
        }
        isRegisteredRef.current = false;
      }
    };
  }, []);

  const markOpened = () => setHasOpened(true);

  return {
    isVisible,
    isAnimating,
    hasOpened,
    markOpened,
    executeClose: () => requestClose('ui'),
  };
}
