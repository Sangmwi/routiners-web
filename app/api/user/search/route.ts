import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { User } from '@/lib/types';

/**
 * GET /api/user/search
 *
 * 프로필 검색 with 복합 필터링
 *
 * 시간 복잡도: O(log n + m)
 * - log n: B-tree index lookup (unit_id, rank, specialty)
 * - m: filtered result set size
 *
 * Query Parameters:
 * - ranks: comma-separated ranks
 * - unitIds: comma-separated unit IDs
 * - specialties: comma-separated specialties
 * - interestedExercises: comma-separated exercise types
 * - interestedLocations: comma-separated locations
 * - minHeight, maxHeight: height range
 * - minWeight, maxWeight: weight range
 * - isSmoker: boolean
 * - page: page number (default 1)
 * - limit: items per page (default 20)
 * - sortBy: 'recent' | 'similarity' (default 'recent')
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const searchParams = request.nextUrl.searchParams;

    // Parse query parameters
    const ranks = searchParams.get('ranks')?.split(',').filter(Boolean);
    const unitIds = searchParams.get('unitIds')?.split(',').filter(Boolean);
    const specialties = searchParams.get('specialties')?.split(',').filter(Boolean);
    const interestedExercises = searchParams.get('interestedExercises')?.split(',').filter(Boolean);
    const interestedLocations = searchParams.get('interestedLocations')?.split(',').filter(Boolean);

    const minHeight = searchParams.get('minHeight') ? Number(searchParams.get('minHeight')) : undefined;
    const maxHeight = searchParams.get('maxHeight') ? Number(searchParams.get('maxHeight')) : undefined;
    const minWeight = searchParams.get('minWeight') ? Number(searchParams.get('minWeight')) : undefined;
    const maxWeight = searchParams.get('maxWeight') ? Number(searchParams.get('maxWeight')) : undefined;

    const isSmokerParam = searchParams.get('isSmoker');
    const isSmoker = isSmokerParam !== null ? isSmokerParam === 'true' : undefined;

    const page = Number(searchParams.get('page')) || 1;
    const limit = Math.min(Number(searchParams.get('limit')) || 20, 100); // Max 100 per page
    const sortBy = searchParams.get('sortBy') || 'recent';

    // Build query with indexes
    let query = supabase.from('users').select('*', { count: 'exact' });

    // Apply filters (using indexed columns first for performance)
    if (unitIds && unitIds.length > 0) {
      query = query.in('unit_id', unitIds); // Uses idx_users_unit_id
    }

    if (ranks && ranks.length > 0) {
      query = query.in('rank', ranks); // Uses idx_users_rank
    }

    if (specialties && specialties.length > 0) {
      query = query.in('specialty', specialties); // Uses idx_users_specialty
    }

    if (isSmoker !== undefined) {
      query = query.eq('is_smoker', isSmoker); // Uses idx_users_is_smoker
    }

    // Range filters
    if (minHeight !== undefined) {
      query = query.gte('height_cm', minHeight); // Uses idx_users_height
    }
    if (maxHeight !== undefined) {
      query = query.lte('height_cm', maxHeight);
    }

    if (minWeight !== undefined) {
      query = query.gte('weight_kg', minWeight); // Uses idx_users_weight
    }
    if (maxWeight !== undefined) {
      query = query.lte('weight_kg', maxWeight);
    }

    // Array contains filters (GIN index)
    if (interestedExercises && interestedExercises.length > 0) {
      // Uses idx_users_interested_exercises (GIN)
      query = query.overlaps('interested_exercise_types', interestedExercises);
    }

    if (interestedLocations && interestedLocations.length > 0) {
      // Uses idx_users_interested_locations (GIN)
      query = query.overlaps('interested_exercise_locations', interestedLocations);
    }

    // Sorting
    if (sortBy === 'recent') {
      query = query.order('created_at', { ascending: false }); // Uses idx_users_created_at
    }

    // Pagination
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);

    const { data: usersData, error: queryError, count } = await query;

    if (queryError) {
      throw queryError;
    }

    // Map to User type
    const users: User[] = (usersData || []).map((userData) => ({
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

    return NextResponse.json({
      users,
      total: count || 0,
      page,
      totalPages: Math.ceil((count || 0) / limit),
    });
  } catch (error) {
    console.error('[GET /api/user/search]', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
