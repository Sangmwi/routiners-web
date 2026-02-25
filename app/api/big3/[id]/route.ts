import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/utils/supabase/auth';
import {
  toBig3Record,
  type Big3UpdateData,
  type DbBig3Record,
} from '@/lib/types/big3';
import { badRequest, parseRequestBody, handleSupabaseError } from '@/lib/utils/apiResponse';

/**
 * GET /api/big3/[id]
 * 특정 Big3 기록 조회
 */
export const GET = withAuth<NextResponse, { id: string }>(
  async (_request: NextRequest, { supabase, params }) => {
    const { id } = await params;

    const { data, error } = await supabase
      .from('big3_records')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('[Big3 GET/:id] Error:', error);
      return handleSupabaseError(error);
    }

    const record = toBig3Record(data as DbBig3Record);
    return NextResponse.json(record);
  },
);

/**
 * PATCH /api/big3/[id]
 * Big3 기록 수정
 */
export const PATCH = withAuth<NextResponse, { id: string }>(
  async (request: NextRequest, { supabase, params }) => {
    const { id } = await params;

    const result = await parseRequestBody<Big3UpdateData>(request);
    if (!result.success) return result.response;
    const body = result.data;

    const updateData: Record<string, unknown> = {};
    if (body.recordedAt !== undefined) updateData.recorded_at = body.recordedAt;
    if (body.liftType !== undefined) updateData.lift_type = body.liftType;
    if (body.weight !== undefined) updateData.weight = body.weight;
    if (body.reps !== undefined) updateData.reps = body.reps;
    if (body.rpe !== undefined) updateData.rpe = body.rpe;
    if (body.notes !== undefined) updateData.notes = body.notes;

    if (Object.keys(updateData).length === 0) {
      return badRequest('수정할 데이터가 없습니다');
    }

    const { data, error } = await supabase
      .from('big3_records')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('[Big3 PATCH/:id] Error:', error);
      return handleSupabaseError(error);
    }

    const record = toBig3Record(data as DbBig3Record);
    return NextResponse.json(record);
  },
);

/**
 * DELETE /api/big3/[id]
 * Big3 기록 삭제
 */
export const DELETE = withAuth<NextResponse, { id: string }>(
  async (_request: NextRequest, { supabase, params }) => {
    const { id } = await params;

    const { error } = await supabase
      .from('big3_records')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('[Big3 DELETE/:id] Error:', error);
      return handleSupabaseError(error);
    }

    return NextResponse.json({ success: true });
  },
);
