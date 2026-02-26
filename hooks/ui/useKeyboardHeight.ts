'use client';

import { useEffect } from 'react';
import { registerCommandHandler } from '@/hooks/webview/useWebViewCommands';
import type { AppToWebMessage } from '@/lib/webview';

/**
 * 가용 화면 높이 감지 (키보드 대응)
 *
 * 1. visualViewport 기반 --app-height (일반 브라우저 폴백)
 * 2. 네이티브 키보드 브릿지 (WebView 환경)
 *    - adjustNothing 모드에서는 visualViewport가 변하지 않으므로
 *      네이티브 Keyboard API가 보내주는 높이에 의존
 *    - KEYBOARD_SHOW → --keyboard-height: Npx
 *    - KEYBOARD_HIDE → --keyboard-height: 0px
 */
export function useKeyboardHeight() {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // 1. visualViewport 기반 --app-height (일반 브라우저 폴백)
    const viewport = window.visualViewport;

    const updateHeight = () => {
      if (viewport) {
        document.documentElement.style.setProperty(
          '--app-height',
          `${viewport.height}px`
        );
      }
    };

    if (viewport) {
      updateHeight();
      viewport.addEventListener('resize', updateHeight);
    }

    // 2. 네이티브 키보드 브릿지 (WebView 환경)
    const cleanups: (() => void)[] = [];

    if (window.ReactNativeWebView) {
      type KeyboardShowMessage = Extract<AppToWebMessage, { type: 'KEYBOARD_SHOW' }>;

      cleanups.push(
        registerCommandHandler<KeyboardShowMessage>('KEYBOARD_SHOW', (cmd) => {
          document.documentElement.style.setProperty(
            '--keyboard-height',
            `${cmd.height}px`
          );
        })
      );
      cleanups.push(
        registerCommandHandler('KEYBOARD_HIDE', () => {
          document.documentElement.style.setProperty(
            '--keyboard-height',
            '0px'
          );
        })
      );
    }

    return () => {
      viewport?.removeEventListener('resize', updateHeight);
      cleanups.forEach((c) => c());
    };
  }, []);
}
