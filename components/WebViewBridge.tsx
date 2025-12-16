"use client";

import { useWebViewBridge } from "@/hooks/use-webview-bridge";

// 이 컴포넌트는 WebView 브릿지를 활성화하는 역할만 합니다
export default function WebViewBridge() {
  useWebViewBridge();
  return null;
}

