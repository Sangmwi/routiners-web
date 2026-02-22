'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { isTabRoute } from '@/lib/routes';
import { useWebViewCore } from './useWebViewCore';

export const useWebViewNavigation = () => {
  const { isInWebView, sendMessage } = useWebViewCore();
  const pathname = usePathname();
  const hasRenderedRef = useRef(false);

  const sendRouteInfo = () => {
    return sendMessage({
      type: 'ROUTE_INFO',
      payload: {
        path: pathname,
        isTabRoute: isTabRoute(pathname),
        isHome: pathname === '/',
        canGoBack: !isTabRoute(pathname),
      },
    });
  };

  const sendPageRendered = () => {
    return sendMessage({ type: 'PAGE_RENDERED' });
  };

  useEffect(() => {
    if (!isInWebView) return;
    sendMessage({
      type: 'ROUTE_INFO',
      payload: {
        path: pathname,
        isTabRoute: isTabRoute(pathname),
        isHome: pathname === '/',
        canGoBack: !isTabRoute(pathname),
      },
    });
  }, [isInWebView, pathname, sendMessage]);

  useEffect(() => {
    if (!isInWebView || hasRenderedRef.current || pathname === '/login') return;

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        hasRenderedRef.current = true;
        sendMessage({ type: 'PAGE_RENDERED' });
      });
    });
  }, [isInWebView, pathname, sendMessage]);

  return {
    pathname,
    sendRouteInfo,
    sendPageRendered,
  };
};
