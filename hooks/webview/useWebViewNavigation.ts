'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { isTabRoute } from '@/lib/routes';
import { DEFAULT_ROUTE_INFO, LOGIN_ROUTE_INFO } from '@/lib/webview/constants';
import type { RouteInfo } from '@/lib/webview/types';
import { useWebViewCore } from './useWebViewCore';

function buildRouteInfo(pathname: string): RouteInfo {
  if (pathname === '/') return DEFAULT_ROUTE_INFO;
  if (pathname === '/login') return LOGIN_ROUTE_INFO;
  return {
    path: pathname,
    isTabRoute: isTabRoute(pathname),
    isHome: false,
    canGoBack: !isTabRoute(pathname),
  };
}

export const useWebViewNavigation = () => {
  const { isInWebView, sendMessage } = useWebViewCore();
  const pathname = usePathname();
  const hasRenderedRef = useRef(false);

  const sendRouteInfo = () => {
    return sendMessage({
      type: 'ROUTE_INFO',
      payload: buildRouteInfo(pathname),
    });
  };

  const sendPageRendered = () => {
    return sendMessage({ type: 'PAGE_RENDERED' });
  };

  useEffect(() => {
    if (!isInWebView) return;
    sendMessage({
      type: 'ROUTE_INFO',
      payload: buildRouteInfo(pathname),
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
