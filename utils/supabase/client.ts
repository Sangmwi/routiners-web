import { createBrowserClient } from '@supabase/ssr'

/**
 * 브라우저용 Supabase 클라이언트
 *
 * 매번 새 인스턴스를 반환하지만, @supabase/ssr이 내부적으로
 * 쿠키 기반 세션을 관리하므로 세션은 공유됨.
 *
 * ⚠️ Singleton 패턴 제거 이유:
 * - 세션 갱신 후에도 이전 인스턴스가 stale 토큰을 사용하는 문제 발생
 * - @supabase/ssr은 쿠키 기반이므로 인스턴스 재생성해도 세션 유지
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
  )
}
