import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { User } from '@/lib/types';

/**
 * GET /api/user/[userId]
 *
 * 특정 사용자 프로필 조회 (공개 정보만)
 *
 * 시간 복잡도: O(1) - Primary key lookup
 *
 * @param userId - URL parameter
 * @returns User object (public fields only)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const supabase = await createClient();
    const { userId } = await params;

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(userId)) {
      return NextResponse.json(
        { error: 'Invalid user ID format' },
        { status: 400 }
      );
    }

    // Query user by ID (O(1) with primary key)
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (userError) {
      if (userError.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        );
      }
      throw userError;
    }

    // Map database fields to User type
    const user: User = {
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
      muscleMass: userData.skeletal_muscle_mass_kg,
      bodyFatPercentage: userData.body_fat_percentage,
      interestedLocations: userData.interested_exercise_locations,
      interestedExercises: userData.interested_exercise_types,
      isSmoker: userData.is_smoker,
      showInbodyPublic: userData.show_body_metrics,
      createdAt: userData.created_at,
      updatedAt: userData.updated_at,
    };

    // Hide sensitive information based on privacy settings
    if (!user.showInbodyPublic) {
      user.muscleMass = undefined;
      user.bodyFatPercentage = undefined;
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error('[GET /api/user/[userId]]', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
