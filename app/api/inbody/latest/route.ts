import { NextResponse } from 'next/server';
import { withAuth } from '@/utils/supabase/auth';
import { transformDbInBodyToInBody, DbInBodyRecord } from '@/lib/types/inbody';
import { handleSupabaseError } from '@/lib/utils/apiResponse';

/**
 * GET /api/inbody/latest
 * 최신 InBody 기록 조회
 */
export const GET = withAuth(async (_request, { supabase }) => {
  const { data, error } = await supabase
    .from('inbody_records')
    .select('*')
    .order('measured_at', { ascending: false })
    .limit(1)
    .single();

  if (error) {
    // PGRST116: 기록이 없는 경우 null 반환 (정상)
    if (error.code === 'PGRST116') {
      return NextResponse.json(null);
    }
    console.error('[InBody Latest] Error:', error);
    return handleSupabaseError(error);
  }

  const record = transformDbInBodyToInBody(data as DbInBodyRecord);
  return NextResponse.json(record);
});
