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
  /** 이어붙이기 모드: 기존 스케줄 유지, 마지막 이후부터 새 루틴 시작 */
  appendMode?: boolean;
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
    const { conversationId, previewId, forceOverwrite = false, weekCount, appendMode = false } = body;

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

    // 3. 재적용 여부 확인 (이전에 적용한 적이 있으면 재적용 모드)
    const isReapply = !!conversation.ai_result_applied;

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

    // 5. 메시지 상태 확인 (취소됨만 차단, applied는 재적용 허용)
    const msgMetadata = previewMessage.metadata as { status?: string } | null;
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

    // 8. appendMode: 마지막 scheduled 이벤트 날짜 조회 (이어붙이기)
    let startAfterDate: string | undefined;

    if (appendMode) {
      const { data: lastEvent } = await supabase
        .from('routine_events')
        .select('date')
        .eq('type', 'workout')
        .eq('status', 'scheduled')
        .order('date', { ascending: false })
        .limit(1)
        .single();

      if (lastEvent) {
        startAfterDate = lastEvent.date;
      }
      // 이어붙이기 모드에서는 기존 이벤트 삭제를 건너뜀
    }

    // 9. 기존 scheduled 이벤트 삭제 (대체 모드에서만)
    //    - 이어붙이기 모드(appendMode)에서는 건너뜀
    //    - 새 루틴 날짜와 겹치는 scheduled 이벤트만 삭제 (세션 무관)
    //    - completed/skipped 이벤트는 항상 보존
    let eventsPreserved = 0;

    if (!appendMode && (isReapply || forceOverwrite) && previewData.weeks && previewData.weeks.length > 0) {
      const weeksToApply = weekCount
        ? previewData.weeks.slice(0, weekCount)
        : previewData.weeks;

      if (weeksToApply.length > 0) {
        const targetDays = weeksToApply[0].days.map(d => d.dayOfWeek);
        const routineStartDate = getRoutineStartDate(targetDays);
        const baseMonday = getMondayOfWeek(routineStartDate);

        const datesToDelete: string[] = [];
        weeksToApply.forEach((week, weekIndex) => {
          for (const day of week.days) {
            const dayOffset = (day.dayOfWeek - 1) + (weekIndex * 7);
            const targetDate = new Date(baseMonday);
            targetDate.setDate(baseMonday.getDate() + dayOffset);

            if (targetDate >= routineStartDate) {
              datesToDelete.push(formatDate(targetDate));
            }
          }
        });

        if (datesToDelete.length > 0) {
          // 보존될 이벤트 수 조회 (completed/skipped)
          const { data: preservedEvents } = await supabase
            .from('routine_events')
            .select('id')
            .eq('type', 'workout')
            .in('status', ['completed', 'skipped'])
            .in('date', datesToDelete);

          eventsPreserved = preservedEvents?.length ?? 0;

          // scheduled 이벤트만 삭제 (RLS가 user_id 필터링)
          const { error: deleteError } = await supabase
            .from('routine_events')
            .delete()
            .eq('type', 'workout')
            .eq('status', 'scheduled')
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

    // 10. 루틴 적용 실행
    const toolCtx: ToolExecutorContext = {
      userId: conversation.created_by,
      supabase,
      conversationId,
    };

    // 이어붙이기: 충돌 무시(overwrite) + startAfterDate 전달
    // 대체: 재적용/forceOverwrite면 overwrite, 아니면 error
    const conflictStrategy = appendMode || isReapply || forceOverwrite ? 'overwrite' : 'error';
    const applyResult = await executeApplyRoutine(
      toolCtx, previewData, weekCount, conflictStrategy, startAfterDate
    );

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

    // 11. 대화 상태 업데이트 (재적용 시에도 항상 최신 정보로 갱신)
    const existingMetadata = (conversation.metadata ?? {}) as Record<string, unknown>;
    const applyHistory = Array.isArray(existingMetadata.apply_history)
      ? existingMetadata.apply_history
      : [];

    await supabase
      .from('conversations')
      .update({
        ai_result_applied: true,
        ai_result_applied_at: appliedAt,
        metadata: {
          ...existingMetadata,
          activePurpose: null, // 루틴 적용 완료 → 프로세스 종료
          applied_routine: {
            previewId,
            messageId: previewMessage.id,
            eventsCreated: applyResult.data?.eventsCreated,
            eventsPreserved,
            startDate: applyResult.data?.startDate,
            appliedAt,
          },
          apply_history: [
            ...applyHistory,
            {
              previewId,
              eventsCreated: applyResult.data?.eventsCreated,
              eventsPreserved,
              appliedAt,
            },
          ],
        },
      })
      .eq('id', conversationId);

    // 12. 성공 응답
    return NextResponse.json({
      success: true,
      data: {
        previewId,
        eventsCreated: applyResult.data?.eventsCreated,
        eventsPreserved,
        startDate: applyResult.data?.startDate,
        isReapply,
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
