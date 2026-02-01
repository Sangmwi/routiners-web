/**
 * Message Status Update API
 *
 * PATCH /api/coach/conversations/[id]/messages/[messageId]/status
 * - 트랜지언트 UI 메시지의 상태 업데이트
 * - 프로필 확인: pending → confirmed | edited
 * - 루틴 미리보기: pending → applied | cancelled
 * - 입력 요청: pending → submitted | cancelled
 */

import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/utils/supabase/auth';
import { z } from 'zod';
import type {
  ProfileConfirmationStatus,
  RoutinePreviewStatus,
  InputRequestStatus,
} from '@/lib/types/chat';

const StatusUpdateSchema = z.object({
  status: z.enum([
    // ProfileConfirmationStatus
    'pending',
    'confirmed',
    'edited',
    // RoutinePreviewStatus
    'applied',
    'cancelled',
    // InputRequestStatus
    'submitted',
  ]),
  submittedValue: z.string().optional(), // input_request의 경우 제출된 값
});

export const PATCH = withAuth(
  async (request: NextRequest, { supabase, params }) => {
    const { id: conversationId, messageId } = await params;

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

    const validation = StatusUpdateSchema.safeParse(body);
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

    const { status, submittedValue } = validation.data;

    // 대화 존재 여부 확인 (RLS가 권한 필터링)
    const { data: conversation, error: convError } = await supabase
      .from('conversations')
      .select('id')
      .eq('id', conversationId)
      .eq('type', 'ai')
      .eq('ai_purpose', 'coach')
      .is('deleted_at', null)
      .single();

    if (convError || !conversation) {
      return NextResponse.json(
        { error: '대화를 찾을 수 없습니다.', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    // 메시지 존재 여부 및 타입 확인
    const { data: message, error: msgError } = await supabase
      .from('chat_messages')
      .select('id, content_type, metadata')
      .eq('id', messageId)
      .eq('conversation_id', conversationId)
      .single();

    if (msgError || !message) {
      return NextResponse.json(
        { error: '메시지를 찾을 수 없습니다.', code: 'MESSAGE_NOT_FOUND' },
        { status: 404 }
      );
    }

    // 트랜지언트 UI 메시지인지 확인
    const validContentTypes = ['profile_confirmation', 'routine_preview', 'input_request'];
    if (!validContentTypes.includes(message.content_type)) {
      return NextResponse.json(
        { error: '상태를 업데이트할 수 없는 메시지입니다.', code: 'INVALID_MESSAGE_TYPE' },
        { status: 400 }
      );
    }

    // 메타데이터 업데이트
    const currentMetadata = (message.metadata as Record<string, unknown>) || {};
    const newMetadata = {
      ...currentMetadata,
      status,
      updatedAt: new Date().toISOString(),
      ...(submittedValue !== undefined && { submittedValue }),
    };

    const { data: updatedMessage, error: updateError } = await supabase
      .from('chat_messages')
      .update({ metadata: newMetadata })
      .eq('id', messageId)
      .eq('conversation_id', conversationId)
      .select('id, metadata')
      .single();

    if (updateError) {
      console.error('[Message Status API] Update Error:', {
        error: updateError,
        code: updateError.code,
        message: updateError.message,
        details: updateError.details,
        hint: updateError.hint,
        messageId,
        conversationId,
        newMetadata,
      });
      return NextResponse.json(
        { 
          error: '상태 업데이트에 실패했습니다.', 
          code: 'DATABASE_ERROR',
          details: updateError.message,
        },
        { status: 500 }
      );
    }

    // DB 업데이트 확인 로그
    console.log('[Message Status API] DB 업데이트 완료:', {
      messageId,
      status,
      updatedMetadata: updatedMessage?.metadata,
    });

    return NextResponse.json({ success: true, status, messageId });
  }
);
