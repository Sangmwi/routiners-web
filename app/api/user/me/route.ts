import { NextResponse } from 'next/server';
import { withAuth } from '@/utils/supabase/auth';

/**
 * GET /api/user/me
 * Get current authenticated user's profile
 */
export const GET = withAuth(async (_request, { userId, supabase }) => {
  // Fetch user profile from database (userId already verified by withAuth)
  const { data: user, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    throw error;
  }

  // Transform database columns to camelCase
  const transformedUser = {
    id: user.id,
    providerId: user.provider_id,
    email: user.email,
    realName: user.real_name,
    phoneNumber: user.phone_number,
    birthDate: user.birth_date,
    gender: user.gender,
    nickname: user.nickname,
    enlistmentMonth: user.enlistment_month,
    rank: user.rank,
    unitId: user.unit_id,
    unitName: user.unit_name,
    specialty: user.specialty,
    profileImages: user.profile_images || [],
    bio: user.bio,
    height: user.height_cm,
    weight: user.weight_kg,
    muscleMass: user.skeletal_muscle_mass_kg,
    bodyFatPercentage: user.body_fat_percentage,
    interestedLocations: user.interested_exercise_locations,
    interestedExercises: user.interested_exercise_types,
    isSmoker: user.is_smoker,
    showInbodyPublic: user.show_body_metrics,
    createdAt: user.created_at,
    updatedAt: user.updated_at,
  };

  return NextResponse.json(transformedUser);
});
