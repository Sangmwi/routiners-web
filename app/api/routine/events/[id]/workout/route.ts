import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/utils/supabase/auth';
import { DbRoutineEvent, toRoutineEvent } from '@/lib/types/routine';
import { WorkoutDataSchema } from '@/lib/schemas/routine.schema';
import {
  notFound,
  badRequest,
  validationError,
  handleSupabaseError,
} from '@/lib/utils/apiResponse';

/**
 * PATCH /api/routine/events/[id]/workout
 * 워크아웃 데이터 업데이트 (실제 수행 기록)
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

    // data 필드 검증
    if (!body.data) {
      return badRequest('data 필드가 필요합니다');
    }

    const validation = WorkoutDataSchema.safeParse(body.data);
    if (!validation.success) {
      return validationError(validation.error);
    }

    const { data, error } = await supabase
      .from('routine_events')
      .update({ data: validation.data })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return notFound('이벤트를 찾을 수 없습니다');
      }
      console.error('[Routine Event Workout PATCH] Error:', error);
      return handleSupabaseError(error);
    }

    const event = toRoutineEvent(data as DbRoutineEvent);
    return NextResponse.json(event);
  }
);
