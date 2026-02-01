/**
 * 루틴 적용 API
 *
 * AI 의존성 없이 직접 루틴을 DB에 저장
 * Phase 9: chat_messages 테이블에서 routine_preview 메시지로 데이터 가져와서 적용
 * Phase 11: weekCount 파라미터 추가 - 사용자가 선택한 주차 수만큼 적용
 */

import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/utils/supabase/auth';
import { executeApplyRoutine, type ToolExecutorContext } from '@/lib/ai/executors';
import { formatDate, getRoutineStartDate, getMondayOfWeek } from '@/lib/ai/tool-utils';
import type { RoutinePreviewData } from '@/lib/types/fitness';
import {
  checkRateLimit,
  APPLY_RATE_LIMIT,
  rateLimitExceeded,
} from '@/lib/utils/rateLimiter';

interface ApplyRoutineRequest {
  conversationId: string;
  previewId: string;
  /** 충돌 시 기존 루틴 덮어쓰기 */
  forceOverwrite?: boolean;
  /** Phase 11: 적용할 주차 수 */
  weekCount?: number;
}

export const POST = withAuth(async (request: NextRequest, { supabase, authUser }) => {
  // Rate Limiting (분당 10회)
  const rateLimitResult = checkRateLimit(`routine-apply:${authUser.id}`, APPLY_RATE_LIMIT);
  if (!rateLimitResult.allowed) {
    return NextResponse.json(rateLimitExceeded(rateLimitResult), { status: 429 });
  }

  try {
    // 1. 요청 파싱
    const body: ApplyRoutineRequest = await request.json();
    const { conversationId, previewId, forceOverwrite = false, weekCount } = body;

    if (!conversationId || !previewId) {
      return NextResponse.json(
        { success: false, error: 'conversationId와 previewId가 필요합니다.' },
        { status: 400 }
      );
    }

    // 2. conversation 조회 (RLS가 자동으로 권한 필터링)
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

    // 3. 이미 적용된 경우 체크
    if (conversation.ai_result_applied) {
      return NextResponse.json(
        { success: false, error: '이미 루틴이 적용되었습니다.' },
        { status: 400 }
      );
    }

    // 4. Phase 9: chat_messages에서 routine_preview 메시지 조회
    const { data: previewMessage, error: msgError } = await supabase
      .from('chat_messages')
      .select('id, content, metadata')
      .eq('conversation_id', conversationId)
      .eq('content_type', 'routine_preview')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (msgError || !previewMessage) {
      return NextResponse.json(
        { success: false, error: '미리보기 데이터를 찾을 수 없습니다. 다시 루틴을 생성해주세요.' },
        { status: 400 }
      );
    }

    // 5. 메시지 상태 확인 (이미 적용됨/취소됨 체크)
    const msgMetadata = previewMessage.metadata as { status?: string } | null;
    if (msgMetadata?.status === 'applied') {
      return NextResponse.json(
        { success: false, error: '이미 적용된 루틴입니다.' },
        { status: 400 }
      );
    }
    if (msgMetadata?.status === 'cancelled') {
      return NextResponse.json(
        { success: false, error: '취소된 루틴입니다. 다시 루틴을 생성해주세요.' },
        { status: 400 }
      );
    }

    // 6. content에서 preview 데이터 파싱
    let previewData: RoutinePreviewData;
    try {
      previewData = JSON.parse(previewMessage.content) as RoutinePreviewData;
    } catch {
      return NextResponse.json(
        { success: false, error: '미리보기 데이터 파싱에 실패했습니다.' },
        { status: 500 }
      );
    }

    // 7. previewId 일치 확인 (보안 검증)
    if (previewData.id !== previewId) {
      return NextResponse.json(
        { success: false, error: '미리보기 ID가 일치하지 않습니다.' },
        { status: 400 }
      );
    }

    // 8. forceOverwrite 시 기존 루틴 삭제
    // Phase 11: weekCount 반영 + 새 시작일 로직
    if (forceOverwrite && previewData.weeks && previewData.weeks.length > 0) {
      // 적용할 주차만큼만 처리
      const weeksToApply = weekCount
        ? previewData.weeks.slice(0, weekCount)
        : previewData.weeks;

      if (weeksToApply.length > 0) {
        // 루틴에 포함된 요일들 추출 (첫 주 기준)
        const targetDays = weeksToApply[0].days.map(d => d.dayOfWeek);

        // Phase 11: 오늘부터 첫 매칭 요일 찾기
        const routineStartDate = getRoutineStartDate(targetDays);
        const baseMonday = getMondayOfWeek(routineStartDate);

        const datesToDelete: string[] = [];
        weeksToApply.forEach((week, weekIndex) => {
          for (const day of week.days) {
            // 요일 오프셋 계산
            const dayOffset = (day.dayOfWeek - 1) + (weekIndex * 7);
            const targetDate = new Date(baseMonday);
            targetDate.setDate(baseMonday.getDate() + dayOffset);

            // 오늘 이전 날짜는 건너뛰기
            if (targetDate >= routineStartDate) {
              datesToDelete.push(formatDate(targetDate));
            }
          }
        });

        if (datesToDelete.length > 0) {
          // 해당 날짜의 기존 workout 이벤트 삭제 (RLS가 자동으로 권한 필터링)
          const { error: deleteError } = await supabase
            .from('routine_events')
            .delete()
            .eq('type', 'workout')
            .in('date', datesToDelete);

          if (deleteError) {
            console.error('[Apply Routine API] Delete existing events error:', deleteError);
            return NextResponse.json(
              { success: false, error: '기존 루틴 삭제에 실패했습니다.' },
              { status: 500 }
            );
          }
        }
      }
    }

    // 9. 루틴 적용 실행 (Phase 11: weekCount 전달)
    const toolCtx: ToolExecutorContext = {
      userId: conversation.created_by, // RLS 통과한 대화의 소유자 ID 사용
      supabase,
      conversationId,
    };

    const applyResult = await executeApplyRoutine(toolCtx, previewData, weekCount);

    if (!applyResult.success) {
      return NextResponse.json(
        { success: false, error: applyResult.error || '루틴 적용에 실패했습니다.' },
        { status: 500 }
      );
    }

    // 10. Phase 9: 메시지 상태를 'applied'로 업데이트
    const appliedAt = new Date().toISOString();
    await supabase
      .from('chat_messages')
      .update({
        metadata: {
          status: 'applied',
          appliedAt,
        },
      })
      .eq('id', previewMessage.id);

    // 11. 대화 상태 업데이트 (대화는 active 유지 → 계속 대화 가능)
    await supabase
      .from('conversations')
      .update({
        ai_result_applied: true,
        ai_result_applied_at: appliedAt,
        metadata: {
          applied_routine: {
            previewId,
            messageId: previewMessage.id,
            eventsCreated: applyResult.data?.eventsCreated,
            startDate: applyResult.data?.startDate,
            appliedAt,
          },
        },
      })
      .eq('id', conversationId);

    // 12. 성공 응답
    return NextResponse.json({
      success: true,
      data: {
        previewId,
        eventsCreated: applyResult.data?.eventsCreated,
        startDate: applyResult.data?.startDate,
      },
    });
  } catch (error) {
    console.error('[Apply Routine API] Error:', error);
    return NextResponse.json(
      { success: false, error: '루틴 적용 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
});
