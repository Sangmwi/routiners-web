/**
 * 앱 초기화 페이지
 *
 * WebView 앱에서 세션 동기화 전 표시되는 스플래시 페이지입니다.
 * 미들웨어 인증 체크를 우회하여 로그인 화면 깜빡임을 방지합니다.
 *
 * 흐름:
 * 1. 앱이 세션과 함께 이 페이지 로드
 * 2. 앱이 SET_SESSION 메시지 전송
 * 3. useWebViewCommands가 세션 설정 후 홈으로 이동
 */

import Image from "next/image";
import logoImage from "@/assets/images/splash-image-md.png";

export default function AppInitPage() {
  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center overflow-hidden bg-background">
      {/* Background decoration - 로그인 페이지와 동일 */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-primary/20 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-primary/15 blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-96 w-96 rounded-full bg-primary/10 blur-3xl" />
      </div>

      {/* Logo */}
      <div className="relative z-10">
        <Image
          src={logoImage}
          alt="루티너스"
          width={200}
          height={200}
          className="object-contain"
          priority
        />
      </div>
    </div>
  );
}
