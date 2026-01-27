import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/utils/supabase/auth';
import { DbRoutineEvent, toRoutineEvent } from '@/lib/types/routine';
import { notFound, handleSupabaseError } from '@/lib/utils/apiResponse';

/**
 * POST /api/routine/events/[id]/complete
 * 이벤트 완료 처리
 */
export const POST = withAuth<NextResponse, { id: string }>(
  async (_request: NextRequest, { supabase, params }) => {
    const { id } = await params;

    const { data, error } = await supabase
      .from('routine_events')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('status', 'scheduled')
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return notFound('완료할 수 있는 이벤트를 찾을 수 없습니다');
      }
      console.error('[Routine Event Complete] Error:', error);
      return handleSupabaseError(error);
    }

    const event = toRoutineEvent(data as DbRoutineEvent);
    return NextResponse.json(event);
  }
);
