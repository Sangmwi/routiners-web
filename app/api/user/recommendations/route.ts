import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/utils/supabase/auth';
import { toPublicUsers, DbUser } from '@/lib/types/user';
import { notFound, handleSupabaseError } from '@/lib/utils/apiResponse';
import { z } from 'zod';

// Query parameter validation schema
const RecommendationsQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

/**
 * GET /api/user/recommendations
 *
 * 현재 사용자 기반 추천 프로필
 *
 * 추천 알고리즘 가중치:
 * - 같은 부대 (unitId): 40%
 * - 관심 운동 종목 겹침: 30%
 * - 관심 장소 겹침: 20%
 * - 체격 유사도: 10%
 *
 * 시간 복잡도: O(n log n)
 * - n = 같은 부대 사용자 수 (unitId 인덱스로 필터링)
 *
 * Query Parameters:
 * - limit: number of recommendations (default 20, max 50)
 */
export const GET = withAuth(async (request: NextRequest, { authUser, supabase }) => {
  const searchParams = request.nextUrl.searchParams;

  // Validate query parameters
  const validation = RecommendationsQuerySchema.safeParse({
    limit: searchParams.get('limit') ?? 20,
  });

  const limit = validation.success ? validation.data.limit : 20;

  // Get current user's profile
  const { data: currentUser, error: currentUserError } = await supabase
    .from('users')
    .select('*')
    .eq('provider_id', authUser.id)
    .single();

  if (currentUserError || !currentUser) {
    return notFound('현재 사용자 프로필을 찾을 수 없습니다');
  }

  // Use PostgreSQL to calculate similarity scores directly in the database
  // This is much faster than fetching 200 rows and scoring in Node.js
  const { data: scoredUsers, error: candidatesError } = await supabase.rpc(
    'get_user_recommendations',
    {
      p_user_id: currentUser.id,
      p_unit_id: currentUser.unit_id,
      p_interested_exercises: currentUser.interested_exercise_types || [],
      p_interested_locations: currentUser.interested_exercise_locations || [],
      p_height: currentUser.height_cm || null,
      p_weight: currentUser.weight_kg || null,
      p_limit: limit,
    }
  );

  if (candidatesError) {
    // Fallback to old algorithm if RPC function doesn't exist
    console.warn('RPC function not found, using fallback algorithm');
    const { data: candidates, error: fallbackError } = await supabase
      .from('users')
      .select('*')
      .neq('id', currentUser.id)
      .limit(50); // Reduced from 200 for better performance

    if (fallbackError) {
      return handleSupabaseError(fallbackError);
    }

    if (!candidates || candidates.length === 0) {
      return NextResponse.json([]);
    }

    // Quick scoring (simplified)
    const scoredCandidates = candidates
      .map((candidate) => {
        let score = 0;
        if (candidate.unit_id === currentUser.unit_id) score += 40;
        return { user: candidate, score };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

    // Use centralized transformer with privacy settings
    const recommendations = toPublicUsers(
      scoredCandidates.map(({ user }) => user) as DbUser[]
    );
    return NextResponse.json(recommendations);
  }

  if (!scoredUsers || scoredUsers.length === 0) {
    return NextResponse.json([]);
  }

  // Use centralized transformer with privacy settings
  const recommendations = toPublicUsers(scoredUsers as DbUser[]);

  return NextResponse.json(recommendations);
});
