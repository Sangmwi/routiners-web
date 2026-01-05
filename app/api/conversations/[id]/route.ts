import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/utils/supabase/auth';
import {
  DbConversation,
  DbChatMessage,
  transformDbConversation,
  transformDbMessage,
  toAISessionCompat,
} from '@/lib/types/chat';
import { z } from 'zod';

const ConversationUpdateSchema = z.object({
  title: z.string().optional(),
  aiStatus: z.enum(['active', 'completed', 'abandoned']).optional(),
  aiResultApplied: z.boolean().optional(),
});

/**
 * GET /api/conversations/[id]
 * 특정 대화 상세 조회
 */
export const GET = withAuth(
  async (
    request: NextRequest,
    { userId, supabase, params }
  ) => {
    const { id } = await params;

    const { data: conversation, error: convError } = await supabase
      .from('conversations')
      .select('*')
      .eq('id', id)
      .is('deleted_at', null)
      .single();

    if (convError) {
      if (convError.code === 'PGRST116') {
        return NextResponse.json(
          { error: '대화를 찾을 수 없습니다.', code: 'NOT_FOUND' },
          { status: 404 }
        );
      }
      console.error('[Conversation GET] Error:', convError);
      return NextResponse.json(
        { error: '대화를 불러오는데 실패했습니다.', code: 'DATABASE_ERROR' },
        { status: 500 }
      );
    }

    const conv = conversation as DbConversation;

    // 권한 확인 (AI 대화는 생성자만, 그 외는 참여자)
    if (conv.type === 'ai') {
      if (conv.created_by !== userId) {
        return NextResponse.json(
          { error: '접근 권한이 없습니다.', code: 'FORBIDDEN' },
          { status: 403 }
        );
      }
    } else {
      const { data: participant } = await supabase
        .from('conversation_participants')
        .select('id')
        .eq('conversation_id', id)
        .eq('user_id', userId)
        .is('left_at', null)
        .single();

      if (!participant) {
        return NextResponse.json(
          { error: '접근 권한이 없습니다.', code: 'FORBIDDEN' },
          { status: 403 }
        );
      }
    }

    // AI 대화인 경우 메시지도 함께 조회
    if (conv.type === 'ai') {
      const { data: messages } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('conversation_id', id)
        .is('deleted_at', null)
        .order('created_at', { ascending: true });

      const chatMessages = (messages as DbChatMessage[] || []).map(transformDbMessage);
      return NextResponse.json(toAISessionCompat(transformDbConversation(conv), chatMessages));
    }

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
    { userId, supabase, params }
  ) => {
    const { id } = await params;

    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: '잘못된 요청 형식입니다.', code: 'BAD_REQUEST' },
        { status: 400 }
      );
    }

    const validation = ConversationUpdateSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        {
          error: '입력값이 유효하지 않습니다.',
          code: 'VALIDATION_ERROR',
          details: validation.error.flatten(),
        },
        { status: 400 }
      );
    }

    const { title, aiStatus, aiResultApplied } = validation.data;

    // 권한 확인
    const { data: existing } = await supabase
      .from('conversations')
      .select('created_by, type')
      .eq('id', id)
      .single();

    if (!existing || existing.created_by !== userId) {
      return NextResponse.json(
        { error: '접근 권한이 없습니다.', code: 'FORBIDDEN' },
        { status: 403 }
      );
    }

    const updateData: Record<string, unknown> = {};
    if (title !== undefined) updateData.title = title;
    if (aiStatus !== undefined) updateData.ai_status = aiStatus;
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
        { error: '업데이트에 실패했습니다.', code: 'DATABASE_ERROR' },
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
    { userId, supabase, params }
  ) => {
    const { id } = await params;

    // 권한 확인
    const { data: existing } = await supabase
      .from('conversations')
      .select('created_by')
      .eq('id', id)
      .single();

    if (!existing || existing.created_by !== userId) {
      return NextResponse.json(
        { error: '접근 권한이 없습니다.', code: 'FORBIDDEN' },
        { status: 403 }
      );
    }

    const { error } = await supabase
      .from('conversations')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id);

    if (error) {
      console.error('[Conversation DELETE] Error:', error);
      return NextResponse.json(
        { error: '삭제에 실패했습니다.', code: 'DATABASE_ERROR' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  }
);
