import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/utils/supabase/auth';
import { DbAISession, transformDbSessionToSession } from '@/lib/types/routine';

/**
 * GET /api/ai/sessions/active
 * 현재 활성 세션 조회 (purpose별로 1개만 존재)
 */
export const GET = withAuth(async (request: NextRequest, { supabase }) => {
  const { searchParams } = new URL(request.url);
  const purpose = searchParams.get('purpose');

  if (!purpose || !['workout', 'meal'].includes(purpose)) {
    return NextResponse.json(
      { error: 'purpose 파라미터가 필요합니다. (workout | meal)', code: 'BAD_REQUEST' },
      { status: 400 }
    );
  }

  // RLS가 user_id 필터링
  const { data, error } = await supabase
    .from('ai_sessions')
    .select('*')
    .eq('purpose', purpose)
    .eq('status', 'active')
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      // No rows returned
      return NextResponse.json(null, { status: 404 });
    }
    console.error('[AI Sessions Active GET] Error:', error);
    return NextResponse.json(
      { error: '세션을 불러오는데 실패했습니다.', code: 'DATABASE_ERROR' },
      { status: 500 }
    );
  }

  const session = transformDbSessionToSession(data as DbAISession);
  return NextResponse.json(session);
});
