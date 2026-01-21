import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/utils/supabase/auth';
import { DbAISession, transformDbSessionToSession } from '@/lib/types/routine';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/ai/sessions/[id]/complete
 * 세션 완료 처리
 */
export const POST = withAuth(async (request: NextRequest, { supabase }) => {
  const { id } = await (request as unknown as RouteParams).params;

  // RLS가 user_id 필터링
  const { data, error } = await supabase
    .from('ai_sessions')
    .update({
      status: 'completed',
      completed_at: new Date().toISOString(),
    })
    .eq('id', id)
    .eq('status', 'active')
    .select()
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return NextResponse.json(
        { error: '완료할 수 있는 세션을 찾을 수 없습니다.', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }
    console.error('[AI Session Complete] Error:', error);
    return NextResponse.json(
      { error: '세션 완료 처리에 실패했습니다.', code: 'DATABASE_ERROR' },
      { status: 500 }
    );
  }

  const session = transformDbSessionToSession(data as DbAISession);
  return NextResponse.json(session);
});
