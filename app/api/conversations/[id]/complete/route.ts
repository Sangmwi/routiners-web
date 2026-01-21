import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/utils/supabase/auth';
import { DbConversation, transformDbConversation } from '@/lib/types/chat';

/**
 * POST /api/conversations/[id]/complete
 * AI 대화 완료 처리
 */
export const POST = withAuth(
  async (
    request: NextRequest,
    { supabase, params }
  ) => {
    const { id } = await params;

    // RLS가 권한 필터링을 처리
    const { data: existing, error: fetchError } = await supabase
      .from('conversations')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !existing) {
      return NextResponse.json(
        { error: '대화를 찾을 수 없습니다.', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    const conv = existing as DbConversation;

    if (conv.type !== 'ai') {
      return NextResponse.json(
        { error: 'AI 대화만 완료 처리할 수 있습니다.', code: 'BAD_REQUEST' },
        { status: 400 }
      );
    }

    if (conv.ai_status !== 'active') {
      return NextResponse.json(
        { error: '이미 종료된 대화입니다.', code: 'BAD_REQUEST' },
        { status: 400 }
      );
    }

    // 완료 처리
    const { data, error } = await supabase
      .from('conversations')
      .update({
        ai_status: 'completed',
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('[Conversation Complete] Error:', error);
      return NextResponse.json(
        { error: '완료 처리에 실패했습니다.', code: 'DATABASE_ERROR' },
        { status: 500 }
      );
    }

    return NextResponse.json(transformDbConversation(data as DbConversation));
  }
);
