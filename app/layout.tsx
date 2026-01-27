import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";
import BottomNav from "@/components/common/BottomNav";
import WebViewBridge from "@/components/WebViewBridge";
import QueryProvider from "@/lib/providers/QueryProvider";
import ErrorBoundary from "@/components/common/ErrorBoundary";
import { ModalProvider } from "@/components/modals";
import GlobalErrorToast from "@/components/ui/GlobalErrorToast";

const pretendardVariable = localFont({
  src: '../assets/fonts/PretendardVariable.woff2',
  display: 'swap',
  weight: '100 900',
  variable: '--font-pretendard-variable',
})

export const metadata: Metadata = {
  title: "루티너스 - 매일의 루틴이 만드는 Evolution",
  description: "당신의 AI 헬스 파트너, 루티너스와 함께하세요.",
  icons: {
    icon: '/favicon.ico',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  interactiveWidget: 'resizes-content',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body
        className={`${pretendardVariable.variable} antialiased bg-background`}
      >
        <QueryProvider>
          <ErrorBoundary>
            <WebViewBridge />
            <GlobalErrorToast />
            <div className="mx-auto flex min-h-dvh max-w-md flex-col bg-background shadow-2xl">
              <main className="flex-1">
                {children}
              </main>
              <BottomNav />
            </div>
            <ModalProvider />
          </ErrorBoundary>
        </QueryProvider>
      </body>
    </html>
  );
}
