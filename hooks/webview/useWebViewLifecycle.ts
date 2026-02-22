"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { useWebViewCore } from "./useWebViewCore";
import { createClient } from "@/utils/supabase/client";

const isSessionExpired = (expiresAt: number): boolean => {
  const now = Math.floor(Date.now() / 1000);
  const buffer = 10 * 60;
  return expiresAt - now < buffer;
};

export const useWebViewLifecycle = () => {
  const { isInWebView, sendMessage } = useWebViewCore();
  const pathname = usePathname();
  const isSessionCheckDoneRef = useRef(false);

  const sendWebReady = (): boolean => sendMessage({ type: "WEB_READY" });

  const requestSessionRefresh = (): boolean =>
    sendMessage({ type: "REQUEST_SESSION_REFRESH" });

  const resetSessionCheck = () => {
    isSessionCheckDoneRef.current = false;
  };

  useEffect(() => {
    if (!isInWebView || isSessionCheckDoneRef.current || pathname === "/login") return;
    isSessionCheckDoneRef.current = true;

    const checkSessionAndNotify = async () => {
      try {
        const supabase = createClient();
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (session?.expires_at && !isSessionExpired(session.expires_at)) {
          console.log("[WebView] Cookie session valid, sending WEB_READY");
          sendMessage({ type: "WEB_READY" });
        } else {
          console.log("[WebView] Cookie session invalid/expired, requesting refresh");
          sendMessage({ type: "REQUEST_SESSION_REFRESH" });
        }
      } catch (error) {
        console.error("[WebView] Session check failed:", error);
        sendMessage({ type: "REQUEST_SESSION_REFRESH" });
      }
    };

    queueMicrotask(checkSessionAndNotify);
  }, [isInWebView, pathname, sendMessage]);

  return {
    sendWebReady,
    requestSessionRefresh,
    resetSessionCheck,
  };
};
