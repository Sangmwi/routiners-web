import { createClient } from '@supabase/supabase-js';

/**
 * Service role 클라이언트 생성 (RLS 우회)
 *
 * ⚠️ 서버 전용 — API route에서만 사용. 클라이언트 번들에 포함되면 안 됨.
 * 용도: 타인 프로필 조회 등 cross-user 데이터 접근이 필요한 경우
 */
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!
  );
}
