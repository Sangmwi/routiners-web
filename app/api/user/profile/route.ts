import { NextResponse } from 'next/server';
import { withAuth } from '@/utils/supabase/auth';
import { toUser, DbUser } from '@/lib/types/user';
import { ProfileUpdateSchema } from '@/lib/schemas/user.schema';
import {
  conflict,
  validateRequest,
  handleSupabaseError,
} from '@/lib/utils/apiResponse';

/**
 * PATCH /api/user/profile
 * Update user profile
 *
 * Body: ProfileUpdateSchema (see lib/schemas/user.schema.ts)
 */
export const PATCH = withAuth(async (request, { authUser, supabase }) => {
  const result = await validateRequest(request, ProfileUpdateSchema);
  if (!result.success) return result.response;
  const body = result.data;

  // If nickname is being updated, check availability
  if (body.nickname) {
    const { data: nicknameCheck } = await supabase
      .from('users')
      .select('id')
      .eq('nickname', body.nickname)
      .neq('provider_id', authUser.id)
      .maybeSingle();

    if (nicknameCheck) {
      return conflict('이미 사용 중인 닉네임입니다');
    }
  }

  // Build update object (transform camelCase to snake_case)
  const updateData: Record<string, unknown> = {};

  if (body.nickname !== undefined) updateData.nickname = body.nickname;
  if (body.profilePhotoUrl !== undefined) updateData.profile_photo_url = body.profilePhotoUrl;
  if (body.bio !== undefined) updateData.bio = body.bio;
  if (body.height !== undefined) updateData.height_cm = body.height;
  if (body.weight !== undefined) updateData.weight_kg = body.weight;
  if (body.muscleMass !== undefined) updateData.skeletal_muscle_mass_kg = body.muscleMass;
  if (body.bodyFatPercentage !== undefined) updateData.body_fat_percentage = body.bodyFatPercentage;
  if (body.interestedLocations !== undefined) updateData.interested_exercise_locations = body.interestedLocations;
  if (body.interestedExercises !== undefined) updateData.interested_exercise_types = body.interestedExercises;
  if (body.isSmoker !== undefined) updateData.is_smoker = body.isSmoker;
  if (body.showActivityPublic !== undefined) updateData.show_activity_public = body.showActivityPublic;
  if (body.showInfoPublic !== undefined) updateData.show_info_public = body.showInfoPublic;
  if (body.rank !== undefined) updateData.rank = body.rank;
  if (body.unitName !== undefined) updateData.unit_name = body.unitName;
  if (body.specialty !== undefined) updateData.specialty = body.specialty;

  updateData.updated_at = new Date().toISOString();

  // Update user
  const { data: updatedUser, error: updateError } = await supabase
    .from('users')
    .update(updateData)
    .eq('provider_id', authUser.id)
    .select()
    .single();

  if (updateError) {
    return handleSupabaseError(updateError);
  }

  // Use centralized transformer
  const transformedUser = toUser(updatedUser as DbUser);

  return NextResponse.json(transformedUser);
});
