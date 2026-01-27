/**
 * Coach Conversation Single API
 *
 * GET    /api/coach/conversations/[id] - 단일 대화 조회
 * DELETE /api/coach/conversations/[id] - 대화 삭제
 */

import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/utils/supabase/auth';
import {
  DbCoachConversation,
  transformDbCoachConversation,
} from '@/lib/types/coach';

// ============================================================================
// GET /api/coach/conversations/[id]
// ============================================================================

export const GET = withAuth(
  async (request: NextRequest, { supabase, params }) => {
    const { id } = await params;

    const { data: conversation, error } = await supabase
      .from('conversations')
      .select('*')
      .eq('id', id)
      .eq('type', 'ai')
      .eq('ai_purpose', 'coach')
      .is('deleted_at', null)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: '대화를 찾을 수 없습니다.', code: 'NOT_FOUND' },
          { status: 404 }
        );
      }
      console.error('[Coach Conversation GET] Error:', error);
      return NextResponse.json(
        { error: '대화를 불러오는데 실패했습니다.', code: 'DATABASE_ERROR' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      transformDbCoachConversation(conversation as DbCoachConversation)
    );
  }
);

// ============================================================================
// DELETE /api/coach/conversations/[id]
// ============================================================================

export const DELETE = withAuth(
  async (request: NextRequest, { supabase, params }) => {
    const { id } = await params;

    const { error } = await supabase
      .from('conversations')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id)
      .eq('type', 'ai')
      .eq('ai_purpose', 'coach');

    if (error) {
      console.error('[Coach Conversation DELETE] Error:', error);
      return NextResponse.json(
        { error: '삭제에 실패했습니다.', code: 'DATABASE_ERROR' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  }
);
