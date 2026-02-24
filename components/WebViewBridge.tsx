"use client";

import { useWebViewBridge, useSessionRefresh, useTheme } from "@/hooks";
import { useKeyboardHeight } from "@/hooks/ui";

// WebView 환경에서 필요한 클라이언트 로직을 활성화하는 컴포넌트
export default function WebViewBridge() {
  useWebViewBridge();
  useSessionRefresh(); // 백그라운드 복귀 시 세션 자동 갱신
  useTheme(); // 모든 페이지에서 테마 적용
  useKeyboardHeight(); // 일반 모바일 브라우저에서 키보드 높이 감지 (폴백)
  return null;
}

