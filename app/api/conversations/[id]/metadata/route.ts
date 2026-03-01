import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/utils/supabase/auth';
import { badRequest, internalError, notFound } from '@/lib/utils/apiResponse';

/**
 * PATCH /api/conversations/[id]/metadata
 * 대화 메타데이터 부분 업데이트 (특정 필드만 수정/삭제)
 */
export const PATCH = withAuth(
  async (
    request: NextRequest,
    { supabase, params }
  ) => {
    const conversationId = (await params).id;

    let body: Record<string, boolean> = {};
    try {
      body = await request.json();
    } catch {
      return badRequest('잘못된 요청 형식입니다.');
    }
    const { clearProfileConfirmation, clearPendingPreview, clearPendingMealPreview } = body;

    // RLS가 권한 필터링을 처리
    const { data: conversation, error: convError } = await supabase
      .from('conversations')
      .select('id, metadata')
      .eq('id', conversationId)
      .single();

    if (convError || !conversation) {
      return notFound('대화를 찾을 수 없습니다.');
    }

    // 기존 메타데이터 복사
    const currentMetadata = (conversation.metadata as Record<string, unknown>) ?? {};
    const updatedMetadata = { ...currentMetadata };

    // 요청에 따라 특정 필드 삭제
    if (clearProfileConfirmation) {
      delete updatedMetadata.pending_profile_confirmation;
    }
    if (clearPendingPreview) {
      delete updatedMetadata.pending_preview;
    }
    if (clearPendingMealPreview) {
      delete updatedMetadata.pending_meal_preview;
    }

    // 메타데이터 업데이트
    const { error: updateError } = await supabase
      .from('conversations')
      .update({ metadata: updatedMetadata })
      .eq('id', conversationId);

    if (updateError) {
      console.error('[Metadata PATCH] Update error:', updateError);
      return internalError('메타데이터 업데이트에 실패했습니다.');
    }

    return NextResponse.json({ success: true, metadata: updatedMetadata });
  }
);
