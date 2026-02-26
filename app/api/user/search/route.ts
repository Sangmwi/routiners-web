import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { toPublicUsers, DbUser } from '@/lib/types/user';
import { handleError } from '@/lib/utils/apiResponse';
import { z } from 'zod';

// Query parameter validation schema
const SearchQuerySchema = z.object({
  ranks: z.string().optional().transform(val => val?.split(',').filter(Boolean)),
  unitIds: z.string().optional().transform(val => val?.split(',').filter(Boolean)),
  specialties: z.string().optional().transform(val => val?.split(',').filter(Boolean)),
  interestedExercises: z.string().optional().transform(val => val?.split(',').filter(Boolean)),
  interestedLocations: z.string().optional().transform(val => val?.split(',').filter(Boolean)),
  isSmoker: z.enum(['true', 'false']).optional().transform(val => val === undefined ? undefined : val === 'true'),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sortBy: z.enum(['recent', 'similarity']).default('recent'),
});

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

    // Parse and validate query parameters
    const queryObj: Record<string, string | undefined> = {};
    ['ranks', 'unitIds', 'specialties', 'interestedExercises', 'interestedLocations',
     'isSmoker', 'page', 'limit', 'sortBy'
    ].forEach(key => {
      const val = searchParams.get(key);
      if (val !== null) queryObj[key] = val;
    });

    const validation = SearchQuerySchema.safeParse(queryObj);
    if (!validation.success) {
      return handleError(validation.error, '/api/user/search');
    }

    const {
      ranks, unitIds, specialties, interestedExercises, interestedLocations,
      isSmoker, page, limit, sortBy
    } = validation.data;

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

    // Use centralized transformer with privacy settings
    const users = toPublicUsers((usersData || []) as DbUser[]);

    return NextResponse.json({
      users,
      total: count || 0,
      page,
      totalPages: Math.ceil((count || 0) / limit),
    });
  } catch (error) {
    console.error('[GET /api/user/search]', error);
    return handleError(error, '/api/user/search');
  }
}
