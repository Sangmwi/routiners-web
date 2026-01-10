import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/utils/supabase/auth';

/**
 * PATCH /api/conversations/[id]/metadata
 * 대화 메타데이터 부분 업데이트 (특정 필드만 수정/삭제)
 */
export const PATCH = withAuth(
  async (
    request: NextRequest,
    { userId, supabase, params }
  ) => {
    const conversationId = (await params).id;

    const body = await request.json();
    const { clearProfileConfirmation, clearPendingPreview, clearPendingMealPreview } = body;

    // 대화 소유권 확인
    const { data: conversation, error: convError } = await supabase
      .from('conversations')
      .select('id, created_by, metadata')
      .eq('id', conversationId)
      .single();

    if (convError || !conversation) {
      return NextResponse.json(
        { error: '대화를 찾을 수 없습니다.', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    if (conversation.created_by !== userId) {
      return NextResponse.json(
        { error: '권한이 없습니다.', code: 'FORBIDDEN' },
        { status: 403 }
      );
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
      return NextResponse.json(
        { error: '메타데이터 업데이트에 실패했습니다.', code: 'DATABASE_ERROR' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, metadata: updatedMetadata });
  }
);
