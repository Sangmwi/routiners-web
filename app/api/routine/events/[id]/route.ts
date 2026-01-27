import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/utils/supabase/auth';
import { DbRoutineEvent, toRoutineEvent } from '@/lib/types/routine';
import { RoutineEventUpdateSchema } from '@/lib/schemas/routine.schema';
import {
  notFound,
  badRequest,
  validationError,
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

    let body;
    try {
      body = await request.json();
    } catch {
      return badRequest('잘못된 요청 형식입니다');
    }

    // 유효성 검사
    const validation = RoutineEventUpdateSchema.safeParse(body);
    if (!validation.success) {
      return validationError(validation.error);
    }

    const updateData: Record<string, unknown> = {};
    if (validation.data.title !== undefined) updateData.title = validation.data.title;
    if (validation.data.data !== undefined) updateData.data = validation.data.data;
    if (validation.data.status !== undefined) updateData.status = validation.data.status;

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
