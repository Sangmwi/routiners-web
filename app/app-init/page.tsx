/**
 * 앱 초기화 페이지 (Fallback)
 *
 * 이 페이지는 더 이상 사용되지 않습니다.
 * 앱은 이제 / (홈)으로 바로 이동하고, 웹에서 쿠키 세션을 확인합니다.
 *
 * 직접 접근 시 홈으로 리다이렉트합니다.
 */

import { redirect } from "next/navigation";

export default function AppInitPage() {
  redirect("/");
}
