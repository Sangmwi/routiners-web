/**
 * 식단 적용 API
 *
 * AI 의존성 없이 직접 식단을 DB에 저장
 * conversation.metadata.pending_meal_preview에서 데이터 가져와서 적용
 */

import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/utils/supabase/auth';
import { executeApplyMealPlan, MealToolExecutorContext } from '@/lib/ai/meal-tool-executor';
import { formatDate } from '@/lib/utils/dateHelpers';
import type { MealPlanPreviewData } from '@/lib/types/meal';
import {
  checkRateLimit,
  APPLY_RATE_LIMIT,
  rateLimitExceeded,
} from '@/lib/utils/rateLimiter';

interface ApplyMealPlanRequest {
  conversationId: string;
  previewId: string;
  /** 충돌 시 기존 식단 덮어쓰기 */
  forceOverwrite?: boolean;
}

export const POST = withAuth(async (request: NextRequest, { supabase, authUser }) => {
  // Rate Limiting (분당 10회)
  const rateLimitResult = checkRateLimit(`meal-apply:${authUser.id}`, APPLY_RATE_LIMIT);
  if (!rateLimitResult.allowed) {
    return NextResponse.json(rateLimitExceeded(rateLimitResult), { status: 429 });
  }

  try {
    // 1. 요청 파싱
    const body: ApplyMealPlanRequest = await request.json();
    const { conversationId, previewId, forceOverwrite = false } = body;

    if (!conversationId || !previewId) {
      return NextResponse.json(
        { success: false, error: 'conversationId와 previewId가 필요합니다.' },
        { status: 400 }
      );
    }

    // 2. conversation 조회 (RLS가 권한 검증)
    const { data: conversation, error: convError } = await supabase
      .from('conversations')
      .select('id, created_by, metadata, ai_result_applied')
      .eq('id', conversationId)
      .single();

    if (convError || !conversation) {
      return NextResponse.json(
        { success: false, error: '대화를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 4. 이미 적용된 경우 체크
    if (conversation.ai_result_applied) {
      return NextResponse.json(
        { success: false, error: '이미 식단이 적용되었습니다.' },
        { status: 400 }
      );
    }

    // 5. pending_meal_preview 데이터 확인
    const metadata = conversation.metadata as { pending_meal_preview?: MealPlanPreviewData } | null;
    const previewData = metadata?.pending_meal_preview;

    if (!previewData) {
      return NextResponse.json(
        { success: false, error: '미리보기 데이터를 찾을 수 없습니다. 다시 식단을 생성해주세요.' },
        { status: 400 }
      );
    }

    // 6. previewId 일치 확인 (보안 검증)
    if (previewData.id !== previewId) {
      return NextResponse.json(
        { success: false, error: '미리보기 ID가 일치하지 않습니다.' },
        { status: 400 }
      );
    }

    // 7. forceOverwrite 시 기존 식단 삭제
    if (forceOverwrite && previewData.weeks && previewData.weeks.length > 0) {
      // 식단이 적용될 날짜들 계산 (다음 월요일 기준)
      const today = new Date();
      const dayOfWeek = today.getDay(); // 0=일, 1=월, ..., 6=토
      const daysUntilMonday = dayOfWeek === 0 ? 1 : 8 - dayOfWeek;
      const nextMonday = new Date(today);
      nextMonday.setDate(today.getDate() + daysUntilMonday);
      nextMonday.setHours(0, 0, 0, 0);

      const datesToDelete: string[] = [];
      for (const week of previewData.weeks) {
        for (const day of week.days) {
          // 주차 오프셋 (1주차 → 0, 2주차 → 1)
          const weekOffset = week.weekNumber - 1;
          // 요일 오프셋 (월요일=1 → 0일 추가, 화요일=2 → 1일 추가, ...)
          const dayOffset = day.dayOfWeek - 1;

          const targetDate = new Date(nextMonday);
          targetDate.setDate(targetDate.getDate() + weekOffset * 7 + dayOffset);
          datesToDelete.push(formatDate(targetDate));
        }
      }

      if (datesToDelete.length > 0) {
        // 해당 날짜의 기존 meal 이벤트 삭제 (RLS가 user_id 필터링)
        const { error: deleteError } = await supabase
          .from('routine_events')
          .delete()
          .eq('type', 'meal')
          .in('date', datesToDelete);

        if (deleteError) {
          console.error('[Apply Meal Plan API] Delete existing events error:', deleteError);
          return NextResponse.json(
            { success: false, error: '기존 식단 삭제에 실패했습니다.' },
            { status: 500 }
          );
        }
      }
    }

    // 8. 식단 적용 실행
    const mealCtx: MealToolExecutorContext = {
      userId: conversation.created_by,
      supabase,
      conversationId,
    };

    const applyResult = await executeApplyMealPlan(mealCtx, previewData);

    if (!applyResult.success) {
      return NextResponse.json(
        { success: false, error: applyResult.error || '식단 적용에 실패했습니다.' },
        { status: 500 }
      );
    }

    // 9. 적용 완료 후 대화 상태 업데이트 (completed + metadata)
    const appliedAt = new Date().toISOString();
    await supabase
      .from('conversations')
      .update({
        ai_status: 'completed',
        ai_result_applied: true,
        ai_result_applied_at: appliedAt,
        metadata: {
          applied_meal_plan: {
            previewId,
            eventsCreated: applyResult.data?.eventsCreated,
            startDate: applyResult.data?.startDate,
            appliedAt,
          },
        },
      })
      .eq('id', conversationId);

    // 10. 성공 응답
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
      { status: 500 }
    );
  }
});
