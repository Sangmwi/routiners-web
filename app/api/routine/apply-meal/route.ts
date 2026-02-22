/**
 * Apply Meal Plan API
 *
 * Applies a generated meal preview to routine events without AI loop.
 */

import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/utils/supabase/auth';
import {
  executeApplyMealPlan,
  findMealPreviewMessageById,
  getMealPreviewStatus,
  buildAppliedMealConversationMetadata,
  type ToolExecutorContext,
} from '@/lib/ai/executors';
import {
  checkRateLimit,
  APPLY_RATE_LIMIT,
  rateLimitExceeded,
} from '@/lib/utils/rateLimiter';

interface ApplyMealPlanRequest {
  conversationId: string;
  previewId: string;
}

export const POST = withAuth(async (request: NextRequest, { supabase, authUser }) => {
  const rateLimitResult = checkRateLimit(`meal-apply:${authUser.id}`, APPLY_RATE_LIMIT);
  if (!rateLimitResult.allowed) {
    return NextResponse.json(rateLimitExceeded(rateLimitResult), { status: 429 });
  }

  try {
    const body: ApplyMealPlanRequest = await request.json();
    const { conversationId, previewId } = body;

    if (!conversationId || !previewId) {
      return NextResponse.json(
        { success: false, error: 'conversationId와 previewId가 필요합니다.' },
        { status: 400 },
      );
    }

    const { data: conversation, error: convError } = await supabase
      .from('conversations')
      .select('id, created_by, metadata')
      .eq('id', conversationId)
      .single();

    if (convError || !conversation) {
      return NextResponse.json(
        { success: false, error: '대화를 찾을 수 없습니다.' },
        { status: 404 },
      );
    }

    const previewLookup = await findMealPreviewMessageById(supabase, conversationId, previewId);
    if (!previewLookup.success || !previewLookup.data) {
      return NextResponse.json(
        { success: false, error: previewLookup.error ?? '식단 미리보기를 찾을 수 없습니다.' },
        { status: 400 },
      );
    }

    const { messageId, metadata, previewData } = previewLookup.data;
    const status = getMealPreviewStatus(metadata);

    if (status === 'cancelled') {
      return NextResponse.json(
        { success: false, error: '취소된 식단입니다. 다시 식단을 생성해 주세요.' },
        { status: 400 },
      );
    }

    if (status === 'applied') {
      return NextResponse.json(
        { success: false, error: '이미 적용된 식단입니다.' },
        { status: 400 },
      );
    }

    const toolCtx: ToolExecutorContext = {
      userId: conversation.created_by,
      supabase,
      conversationId,
    };
    const applyResult = await executeApplyMealPlan(toolCtx, previewData);

    if (!applyResult.success) {
      return NextResponse.json(
        { success: false, error: applyResult.error || '식단 적용에 실패했습니다.' },
        { status: 500 },
      );
    }

    const appliedAt = new Date().toISOString();

    await supabase
      .from('chat_messages')
      .update({
        metadata: {
          status: 'applied',
          appliedAt,
        },
      })
      .eq('id', messageId);

    const existingMetadata = (conversation.metadata ?? {}) as Record<string, unknown>;

    await supabase
      .from('conversations')
      .update({
        ai_result_applied: true,
        ai_result_applied_at: appliedAt,
        metadata: buildAppliedMealConversationMetadata(existingMetadata, {
          previewId,
          messageId,
          eventsCreated: applyResult.data?.eventsCreated,
          startDate: applyResult.data?.startDate,
          appliedAt,
        }),
      })
      .eq('id', conversationId);

    return NextResponse.json({
      success: true,
      data: {
        previewId,
        eventsCreated: applyResult.data?.eventsCreated,
        startDate: applyResult.data?.startDate,
      },
    });
  } catch (error) {
    console.error('[Apply Meal Plan API] Error:', error);
    return NextResponse.json(
      { success: false, error: '식단 적용 중 오류가 발생했습니다.' },
      { status: 500 },
    );
  }
});

