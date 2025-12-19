import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/utils/supabase/auth';
import { User } from '@/lib/types';

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
  const limit = Math.min(Number(searchParams.get('limit')) || 20, 50);

  // Get current user's profile
  const { data: currentUser, error: currentUserError } = await supabase
    .from('users')
    .select('*')
    .eq('provider_id', authUser.id)
    .single();

  if (currentUserError || !currentUser) {
    return NextResponse.json(
      { error: 'Current user profile not found' },
      { status: 404 }
    );
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

    if (fallbackError) throw fallbackError;
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

    const topUsers = scoredCandidates;

    // Continue with mapping below...
    const recommendations: User[] = topUsers.map(({ user: userData }) => ({
      id: userData.id,
      providerId: userData.provider_id,
      email: userData.email,
      realName: userData.real_name,
      phoneNumber: userData.phone_number,
      birthDate: userData.birth_date,
      gender: userData.gender,
      nickname: userData.nickname,
      enlistmentMonth: userData.enlistment_month,
      rank: userData.rank,
      unitId: userData.unit_id,
      unitName: userData.unit_name,
      specialty: userData.specialty,
      profileImages: userData.profile_images || [],
      bio: userData.bio,
      height: userData.height_cm,
      weight: userData.weight_kg,
      muscleMass: userData.show_body_metrics ? userData.skeletal_muscle_mass_kg : undefined,
      bodyFatPercentage: userData.show_body_metrics ? userData.body_fat_percentage : undefined,
      interestedLocations: userData.interested_exercise_locations,
      interestedExercises: userData.interested_exercise_types,
      isSmoker: userData.is_smoker,
      showInbodyPublic: userData.show_body_metrics,
      createdAt: userData.created_at,
      updatedAt: userData.updated_at,
    }));
    return NextResponse.json(recommendations);
  }

  if (!scoredUsers || scoredUsers.length === 0) {
    return NextResponse.json([]);
  }

  const topUsers = scoredUsers;

  // Map to User type (scoredUsers already has the correct structure from RPC)
  const recommendations: User[] = topUsers.map((userData: any) => ({
    id: userData.id,
    providerId: userData.provider_id,
    email: userData.email,
    realName: userData.real_name,
    phoneNumber: userData.phone_number,
    birthDate: userData.birth_date,
    gender: userData.gender,
    nickname: userData.nickname,
    enlistmentMonth: userData.enlistment_month,
    rank: userData.rank,
    unitId: userData.unit_id,
    unitName: userData.unit_name,
    specialty: userData.specialty,
    profileImages: userData.profile_images || [],
    bio: userData.bio,
    height: userData.height_cm,
    weight: userData.weight_kg,
    muscleMass: userData.show_body_metrics ? userData.skeletal_muscle_mass_kg : undefined,
    bodyFatPercentage: userData.show_body_metrics ? userData.body_fat_percentage : undefined,
    interestedLocations: userData.interested_exercise_locations,
    interestedExercises: userData.interested_exercise_types,
    isSmoker: userData.is_smoker,
    showInbodyPublic: userData.show_body_metrics,
    createdAt: userData.created_at,
    updatedAt: userData.updated_at,
  }));

  return NextResponse.json(recommendations);
});
