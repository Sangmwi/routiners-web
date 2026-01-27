import { NextRequest, NextResponse } from 'next/server';
import { withOptionalAuth } from '@/utils/supabase/auth';
import { toPublicUsers, DbUser } from '@/lib/types/user';
import { badRequest, handleSupabaseError } from '@/lib/utils/apiResponse';
import { z } from 'zod';

// Query parameter validation schema
const SameUnitQuerySchema = z.object({
  unitId: z.string().min(1, 'unitId는 필수입니다'),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

/**
 * GET /api/user/same-unit
 *
 * 같은 부대 사용자 목록 조회
 *
 * 시간 복잡도: O(log n) - idx_users_unit_id 활용
 *
 * Query Parameters:
 * - unitId: unit ID (required)
 * - limit: number of users (default 20, max 50)
 */
export const GET = withOptionalAuth(async (request: NextRequest, auth) => {
  const searchParams = request.nextUrl.searchParams;

  // Validate query parameters
  const validation = SameUnitQuerySchema.safeParse({
    unitId: searchParams.get('unitId'),
    limit: searchParams.get('limit') ?? 20,
  });

  if (!validation.success) {
    const firstError = validation.error.errors[0];
    return badRequest(firstError?.message || '잘못된 요청 파라미터입니다');
  }

  const { unitId, limit } = validation.data;

  // Use the supabase client from auth context if available, or create new one
  const supabase = auth?.supabase;
  if (!supabase) {
    // If no auth context, we need to create a client manually for this public endpoint
    const { createClient } = await import('@/utils/supabase/server');
    const publicSupabase = await createClient();

    const { data: usersData, error: queryError } = await publicSupabase
      .from('users')
      .select('*')
      .eq('unit_id', unitId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (queryError) {
      return handleSupabaseError(queryError);
    }

    // Use centralized transformer with privacy settings
    const users = toPublicUsers((usersData || []) as DbUser[]);
    return NextResponse.json(users);
  }

  // Query same unit users - O(log n) with idx_users_unit_id
  // Note: 자기 자신 제외는 클라이언트에서 처리 (RLS 아키텍처)
  const { data: usersData, error: queryError } = await supabase
    .from('users')
    .select('*')
    .eq('unit_id', unitId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (queryError) {
    return handleSupabaseError(queryError);
  }

  // Use centralized transformer with privacy settings
  const users = toPublicUsers((usersData || []) as DbUser[]);

  return NextResponse.json(users);
});
