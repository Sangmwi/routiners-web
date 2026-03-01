/**
 * Counselor Conversation Single API
 *
 * GET    /api/counselor/conversations/[id] - 단일 대화 조회
 * DELETE /api/counselor/conversations/[id] - 대화 삭제
 */

import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/utils/supabase/auth';
import {
  DbCounselorConversation,
  transformDbCounselorConversation,
} from '@/lib/types/counselor';
import { notFound, internalError } from '@/lib/utils/apiResponse';

// ============================================================================
// GET /api/counselor/conversations/[id]
// ============================================================================

export const GET = withAuth(
  async (request: NextRequest, { supabase, params }) => {
    const { id } = await params;

    // Phase 18: ai_purpose 필터 제거
    const { data: conversation, error } = await supabase
      .from('conversations')
      .select('*')
      .eq('id', id)
      .eq('type', 'ai')
      .is('deleted_at', null)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return notFound('대화를 찾을 수 없습니다.');
      }
      console.error('[Counselor Conversation GET] Error:', error);
      return internalError('대화를 불러오는데 실패했습니다.');
    }

    return NextResponse.json(
      transformDbCounselorConversation(conversation as DbCounselorConversation)
    );
  }
);

// ============================================================================
// DELETE /api/counselor/conversations/[id]
// ============================================================================

export const DELETE = withAuth(
  async (request: NextRequest, { supabase, params }) => {
    const { id } = await params;

    // Phase 18: ai_purpose 필터 제거
    const { error } = await supabase
      .from('conversations')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id)
      .eq('type', 'ai');

    if (error) {
      console.error('[Counselor Conversation DELETE] Error:', error);
      return internalError('삭제에 실패했습니다.');
    }

    return NextResponse.json({ success: true });
  }
);
