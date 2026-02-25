'use client';

import { useEffect, useRef } from 'react';
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
  entry.close();
}

function ensureListener() {
  if (listenerAttached || typeof window === 'undefined') return;
  // capture phase로 등록하여 Next.js보다 먼저 실행
  window.addEventListener('popstate', handlePopState, true);
  listenerAttached = true;
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
// Hook
// ============================================================================

interface UseOverlayHistoryOptions {
  /** true이면 뒤로가기로 닫히지 않음 (로딩 중 등) */
  preventClose?: boolean;
}

/**
 * 오버레이가 열릴 때 브라우저 히스토리에 엔트리를 추가하여
 * 뒤로가기 시 오버레이가 닫히도록 하는 훅.
 *
 * - 오버레이 open → pushState
 * - 뒤로가기 (popstate) → closeHandler 호출
 * - UI에서 닫힘 → history.back()으로 엔트리 정리
 */
export function useOverlayHistory(
  isOpen: boolean,
  onClose: () => void,
  options?: UseOverlayHistoryOptions,
) {
  const idRef = useRef<string>('');
  const isRegisteredRef = useRef(false);
  const closedByPopstateRef = useRef(false);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

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

  // 오버레이 열림/닫힘 처리
  useEffect(() => {
    if (isOpen && !isRegisteredRef.current) {
      // 열림: 히스토리 엔트리 추가 + 스택 등록
      const id = `overlay_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
      idRef.current = id;
      isRegisteredRef.current = true;
      closedByPopstateRef.current = false;

      overlayStack.set(id, {
        close: () => {
          closedByPopstateRef.current = true;
          onCloseRef.current();
        },
        preventClose: options?.preventClose ?? false,
      });

      history.pushState({ ...history.state, __overlay: id }, '');
      broadcastOverlayState();
    } else if (!isOpen && isRegisteredRef.current) {
      // 닫힘: 스택에서 제거
      overlayStack.delete(idRef.current);
      isRegisteredRef.current = false;
      broadcastOverlayState();

      if (closedByPopstateRef.current) {
        // popstate로 닫힘 — 히스토리는 이미 back됨
        closedByPopstateRef.current = false;
      } else {
        // UI로 닫힘 (버튼, ESC, 스와이프 등) — 히스토리 엔트리 제거
        skipPopstateCount++;
        history.back();
      }
    }
  }, [isOpen, options?.preventClose]);

  // 언마운트 시 정리
  useEffect(() => {
    return () => {
      if (isRegisteredRef.current) {
        overlayStack.delete(idRef.current);
        isRegisteredRef.current = false;
        broadcastOverlayState();
        if (!closedByPopstateRef.current) {
          skipPopstateCount++;
          history.back();
        }
      }
    };
  }, []);

  /**
   * 오버레이 히스토리 엔트리를 즉시 제거 (onClose 호출 없이).
   *
   * onConfirm 내에서 router.back() 등 네비게이션이 발생할 수 있을 때,
   * dismiss() → onClose() → onConfirm() 순서로 호출한다.
   *
   * skipPopstateCount를 올리지 않아 Next.js가 popstate를 처리하게 하되,
   * 같은 페이지로의 back이므로 Next.js에서 no-op이 된다.
   */
  const dismiss = () => {
    if (!isRegisteredRef.current) return;
    // handlePopState가 이미 제거했으면 isRegistered만 해제
    if (!overlayStack.has(idRef.current)) {
      isRegisteredRef.current = false;
      return;
    }
    overlayStack.delete(idRef.current);
    isRegisteredRef.current = false;
    broadcastOverlayState();
    skipPopstateCount++;
    history.back();
  };

  return { dismiss };
}
