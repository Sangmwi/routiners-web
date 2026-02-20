/**
 * Counselor System Message API
 *
 * POST /api/counselor/conversations/[id]/messages/system
 * - 시스템 메시지 삽입 (대화 히스토리에만 기록, AI 응답 없음)
 * - 루틴 적용/프로필 확인 완료 시 요약 메시지용
 */

import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/utils/supabase/auth';
import { z } from 'zod';

const SystemMessageSchema = z.object({
  content: z.string().min(1, '메시지 내용이 필요합니다.'),
  metadata: z.record(z.unknown()).optional(),
});

export const POST = withAuth(
  async (request: NextRequest, { supabase, params }) => {
    const { id: conversationId } = await params;

    // 요청 파싱
    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: '잘못된 요청 형식입니다.', code: 'BAD_REQUEST' },
        { status: 400 }
      );
    }

    const validation = SystemMessageSchema.safeParse(body);
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

    const { content, metadata } = validation.data;

    // 대화 존재 여부 확인 (RLS가 권한 필터링)
    // Phase 18: ai_purpose 필터 제거
    const { data: conversation, error: convError } = await supabase
      .from('conversations')
      .select('id')
      .eq('id', conversationId)
      .eq('type', 'ai')
      .is('deleted_at', null)
      .single();

    if (convError || !conversation) {
      return NextResponse.json(
        { error: '대화를 찾을 수 없습니다.', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    // 시스템 메시지 삽입
    const { error: insertError } = await supabase
      .from('chat_messages')
      .insert({
        conversation_id: conversationId,
        role: 'assistant', // 화면에서 AI 버블 위치에 표시
        content,
        content_type: 'system_log', // AI 생성이 아닌 시스템 기록
        metadata: metadata || null,
      });

    if (insertError) {
      console.error('[System Message API] Insert Error:', insertError);
      return NextResponse.json(
        { error: '메시지 추가에 실패했습니다.', code: 'DATABASE_ERROR' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  }
);
