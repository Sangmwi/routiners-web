/**
 * useEventListener Hook
 *
 * 이벤트 리스너 등록/해제를 자동으로 관리하는 훅
 * cleanup을 자동으로 처리하여 메모리 누수 방지
 */

import { useEffect, useRef } from 'react';

type EventTarget = Window | Document | HTMLElement | null;

/**
 * Document 이벤트 리스너 훅
 *
 * @example
 * ```ts
 * useDocumentEventListener('visibilitychange', () => {
 *   console.log('visibility changed:', document.visibilityState);
 * });
 * ```
 */
export function useDocumentEventListener<K extends keyof DocumentEventMap>(
  eventName: K,
  handler: (event: DocumentEventMap[K]) => void,
  options?: AddEventListenerOptions
) {
  const savedHandler = useRef(handler);

  // handler 변경 시 ref 업데이트 (재등록 없이)
  useEffect(() => {
    savedHandler.current = handler;
  }, [handler]);

  useEffect(() => {
    const eventListener = (event: DocumentEventMap[K]) => savedHandler.current(event);

    document.addEventListener(eventName, eventListener, options);
    return () => document.removeEventListener(eventName, eventListener, options);
  }, [eventName, options]);
}

/**
 * Window 이벤트 리스너 훅
 *
 * @example
 * ```ts
 * useWindowEventListener('resize', () => {
 *   console.log('window resized:', window.innerWidth);
 * });
 * ```
 */
export function useWindowEventListener<K extends keyof WindowEventMap>(
  eventName: K,
  handler: (event: WindowEventMap[K]) => void,
  options?: AddEventListenerOptions
) {
  const savedHandler = useRef(handler);

  useEffect(() => {
    savedHandler.current = handler;
  }, [handler]);

  useEffect(() => {
    const eventListener = (event: WindowEventMap[K]) => savedHandler.current(event);

    window.addEventListener(eventName, eventListener, options);
    return () => window.removeEventListener(eventName, eventListener, options);
  }, [eventName, options]);
}

/**
 * 커스텀 이벤트 리스너 훅 (CustomEvent 타입)
 *
 * @example
 * ```ts
 * useCustomEventListener('app-command', (event) => {
 *   console.log('command:', event.detail);
 * });
 * ```
 */
export function useCustomEventListener<T = unknown>(
  eventName: string,
  handler: (event: CustomEvent<T>) => void,
  target: EventTarget = typeof window !== 'undefined' ? window : null,
  options?: AddEventListenerOptions
) {
  const savedHandler = useRef(handler);

  useEffect(() => {
    savedHandler.current = handler;
  }, [handler]);

  useEffect(() => {
    if (!target) return;

    const eventListener = (event: Event) => savedHandler.current(event as CustomEvent<T>);

    target.addEventListener(eventName, eventListener, options);
    return () => target.removeEventListener(eventName, eventListener, options);
  }, [eventName, target, options]);
}
