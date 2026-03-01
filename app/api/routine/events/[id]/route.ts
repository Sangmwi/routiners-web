import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/utils/supabase/auth';
import { DbRoutineEvent, toRoutineEvent } from '@/lib/types/routine';
import { RoutineEventUpdateSchema } from '@/lib/schemas/routine.schema';
import {
  notFound,
  validateRequest,
  handleSupabaseError,
} from '@/lib/utils/apiResponse';

/**
 * GET /api/routine/events/[id]
 * 특정 이벤트 상세 조회
 */
export const GET = withAuth<NextResponse, { id: string }>(
  async (_request: NextRequest, { supabase, params }) => {
    const { id } = await params;

    const { data, error } = await supabase
      .from('routine_events')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return notFound('이벤트를 찾을 수 없습니다');
      }
      console.error('[Routine Event GET] Error:', error);
      return handleSupabaseError(error);
    }

    const event = toRoutineEvent(data as DbRoutineEvent);
    return NextResponse.json(event);
  }
);

/**
 * PATCH /api/routine/events/[id]
 * 이벤트 수정
 */
export const PATCH = withAuth<NextResponse, { id: string }>(
  async (request: NextRequest, { supabase, params }) => {
    const { id } = await params;

    const result = await validateRequest(request, RoutineEventUpdateSchema);
    if (!result.success) return result.response;

    const updateData: Record<string, unknown> = {};
    if (result.data.title !== undefined) updateData.title = result.data.title;
    if (result.data.data !== undefined) updateData.data = result.data.data;
    if (result.data.status !== undefined) updateData.status = result.data.status;

    const { data, error } = await supabase
      .from('routine_events')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return notFound('이벤트를 찾을 수 없습니다');
      }
      console.error('[Routine Event PATCH] Error:', error);
      return handleSupabaseError(error);
    }

    // 되돌리기(scheduled) 시 자동 캡처된 Big3 기록 삭제
    if (result.data.status === 'scheduled') {
      await supabase
        .from('big3_records')
        .delete()
        .eq('routine_event_id', id)
        .eq('source', 'auto')
        .then(({ error: big3Error }) => {
          if (big3Error) {
            console.error('[Big3 Auto-cleanup] Revert error:', big3Error);
          }
        });
    }

    const event = toRoutineEvent(data as DbRoutineEvent);
    return NextResponse.json(event);
  }
);

/**
 * DELETE /api/routine/events/[id]
 * 이벤트 삭제
 */
export const DELETE = withAuth<NextResponse, { id: string }>(
  async (_request: NextRequest, { supabase, params }) => {
    const { id } = await params;

    // 삭제 전 자동 캡처된 Big3 기록 삭제 (FK가 CASCADE 아님)
    await supabase
      .from('big3_records')
      .delete()
      .eq('routine_event_id', id)
      .eq('source', 'auto')
      .then(({ error: big3Error }) => {
        if (big3Error) {
          console.error('[Big3 Auto-cleanup] Delete error:', big3Error);
        }
      });

    const { error } = await supabase
      .from('routine_events')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('[Routine Event DELETE] Error:', error);
      return handleSupabaseError(error);
    }

    return NextResponse.json({ success: true });
  }
);
