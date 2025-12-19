import { NextResponse } from 'next/server';
import { withAuth } from '@/utils/supabase/auth';

/**
 * PATCH /api/user/profile
 * Update user profile
 *
 * Body: {
 *   nickname?: string;
 *   profileImages?: string[];
 *   bio?: string;
 *   height?: number;
 *   weight?: number;
 *   muscleMass?: number;
 *   bodyFatPercentage?: number;
 *   interestedLocations?: string[];
 *   interestedExercises?: string[];
 *   isSmoker?: boolean;
 *   showInbodyPublic?: boolean;
 * }
 */
export const PATCH = withAuth(async (request, { authUser, supabase }) => {
  const body = await request.json();

  // If nickname is being updated, check availability
  if (body.nickname) {
    const { data: nicknameCheck } = await supabase
      .from('users')
      .select('id')
      .eq('nickname', body.nickname)
      .neq('provider_id', authUser.id)
      .maybeSingle();

    if (nicknameCheck) {
      return NextResponse.json({ error: 'Nickname already taken' }, { status: 409 });
    }
  }

  // Build update object (transform camelCase to snake_case)
  const updateData: Record<string, unknown> = {};

  if (body.nickname !== undefined) updateData.nickname = body.nickname;
  if (body.profileImages !== undefined) updateData.profile_images = body.profileImages;
  if (body.bio !== undefined) updateData.bio = body.bio;
  if (body.height !== undefined) updateData.height_cm = body.height;
  if (body.weight !== undefined) updateData.weight_kg = body.weight;
  if (body.muscleMass !== undefined) updateData.skeletal_muscle_mass_kg = body.muscleMass;
  if (body.bodyFatPercentage !== undefined) updateData.body_fat_percentage = body.bodyFatPercentage;
  if (body.interestedLocations !== undefined) updateData.interested_exercise_locations = body.interestedLocations;
  if (body.interestedExercises !== undefined) updateData.interested_exercise_types = body.interestedExercises;
  if (body.isSmoker !== undefined) updateData.is_smoker = body.isSmoker;
  if (body.showInbodyPublic !== undefined) updateData.show_body_metrics = body.showInbodyPublic;

  updateData.updated_at = new Date().toISOString();

  // Update user
  const { data: updatedUser, error: updateError } = await supabase
    .from('users')
    .update(updateData)
    .eq('provider_id', authUser.id)
    .select()
    .single();

  if (updateError) {
    throw updateError;
  }

  // Transform response to camelCase
  const transformedUser = {
    id: updatedUser.id,
    providerId: updatedUser.provider_id,
    email: updatedUser.email,
    realName: updatedUser.real_name,
    phoneNumber: updatedUser.phone_number,
    birthDate: updatedUser.birth_date,
    gender: updatedUser.gender,
    nickname: updatedUser.nickname,
    enlistmentMonth: updatedUser.enlistment_month,
    rank: updatedUser.rank,
    unitId: updatedUser.unit_id,
    unitName: updatedUser.unit_name,
    specialty: updatedUser.specialty,
    profileImages: updatedUser.profile_images || [],
    bio: updatedUser.bio,
    height: updatedUser.height_cm,
    weight: updatedUser.weight_kg,
    muscleMass: updatedUser.skeletal_muscle_mass_kg,
    bodyFatPercentage: updatedUser.body_fat_percentage,
    interestedLocations: updatedUser.interested_exercise_locations,
    interestedExercises: updatedUser.interested_exercise_types,
    isSmoker: updatedUser.is_smoker,
    showInbodyPublic: updatedUser.show_body_metrics,
    createdAt: updatedUser.created_at,
    updatedAt: updatedUser.updated_at,
  };

  return NextResponse.json(transformedUser);
});
