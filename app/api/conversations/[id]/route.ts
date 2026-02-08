import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/utils/supabase/auth';
import { DbConversation, transformDbConversation } from '@/lib/types/chat';
import { z } from 'zod';

/**
 * Phase 18: aiStatus 제거 (범용 대화로 완료 개념 없음)
 */
const ConversationUpdateSchema = z.object({
  title: z.string().optional(),
  aiResultApplied: z.boolean().optional(),
});

/**
 * GET /api/conversations/[id]
 * 특정 대화 상세 조회
 */
export const GET = withAuth(
  async (
    request: NextRequest,
    { supabase, params }
  ) => {
    const { id } = await params;

    // RLS가 권한 필터링을 처리
    const { data: conversation, error: convError } = await supabase
      .from('conversations')
      .select('*')
      .eq('id', id)
      .is('deleted_at', null)
      .single();

    if (convError) {
      if (convError.code === 'PGRST116') {
        return NextResponse.json(
          { error: '대화를 찾을 수 없어요.', code: 'NOT_FOUND' },
          { status: 404 }
        );
      }
      console.error('[Conversation GET] Error:', convError);
      return NextResponse.json(
        { error: '대화를 불러오는데 실패했어요.', code: 'DATABASE_ERROR' },
        { status: 500 }
      );
    }

    const conv = conversation as DbConversation;

    // Phase 18: toAISessionCompat 제거 - 모든 대화는 Conversation 타입으로 반환
    // AI 대화 메시지는 별도 /messages 엔드포인트 사용
    return NextResponse.json(transformDbConversation(conv));
  }
);

/**
 * PATCH /api/conversations/[id]
 * 대화 업데이트
 */
export const PATCH = withAuth(
  async (
    request: NextRequest,
    { supabase, params }
  ) => {
    const { id } = await params;

    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: '잘못된 요청 형식이에요.', code: 'BAD_REQUEST' },
        { status: 400 }
      );
    }

    const validation = ConversationUpdateSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        {
          error: '입력값이 유효하지 않아요.',
          code: 'VALIDATION_ERROR',
          details: validation.error.flatten(),
        },
        { status: 400 }
      );
    }

    const { title, aiResultApplied } = validation.data;

    // Phase 18: aiStatus 업데이트 로직 제거
    const updateData: Record<string, unknown> = {};
    if (title !== undefined) updateData.title = title;
    if (aiResultApplied !== undefined) {
      updateData.ai_result_applied = aiResultApplied;
      if (aiResultApplied) {
        updateData.ai_result_applied_at = new Date().toISOString();
      }
    }

    const { data, error } = await supabase
      .from('conversations')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('[Conversation PATCH] Error:', error);
      return NextResponse.json(
        { error: '업데이트에 실패했어요.', code: 'DATABASE_ERROR' },
        { status: 500 }
      );
    }

    return NextResponse.json(transformDbConversation(data as DbConversation));
  }
);

/**
 * DELETE /api/conversations/[id]
 * 대화 삭제 (소프트 삭제)
 */
export const DELETE = withAuth(
  async (
    request: NextRequest,
    { supabase, params }
  ) => {
    const { id } = await params;

    // RLS가 권한 필터링을 처리
    const { error } = await supabase
      .from('conversations')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id);

    if (error) {
      console.error('[Conversation DELETE] Error:', error);
      return NextResponse.json(
        { error: '삭제에 실패했어요.', code: 'DATABASE_ERROR' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  }
);
