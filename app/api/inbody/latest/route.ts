import { NextResponse } from 'next/server';
import { withAuth } from '@/utils/supabase/auth';
import { transformDbInBodyToInBody, DbInBodyRecord } from '@/lib/types/inbody';

/**
 * GET /api/inbody/latest
 * 최신 InBody 기록 조회
 */
export const GET = withAuth(async (_request, { userId, supabase }) => {
  const { data, error } = await supabase
    .from('inbody_records')
    .select('*')
    .eq('user_id', userId)
    .order('measured_at', { ascending: false })
    .limit(1)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return NextResponse.json(null, { status: 404 });
    }
    console.error('[InBody Latest] Error:', error);
    return NextResponse.json(
      { error: '기록을 불러오는데 실패했습니다.', code: 'DATABASE_ERROR' },
      { status: 500 }
    );
  }

  const record = transformDbInBodyToInBody(data as DbInBodyRecord);
  return NextResponse.json(record);
});
