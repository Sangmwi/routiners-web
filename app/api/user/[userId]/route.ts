import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { toPublicUser, DbUser } from '@/lib/types/user';
import { badRequest, notFound, handleError } from '@/lib/utils/apiResponse';
import { z } from 'zod';

// UUID validation schema
const UuidSchema = z.string().uuid('잘못된 사용자 ID 형식입니다');

/**
 * GET /api/user/[userId]
 *
 * 특정 사용자 프로필 조회 (공개 정보만)
 *
 * 시간 복잡도: O(1) - Primary key lookup
 *
 * @param userId - URL parameter
 * @returns User object (public fields only, privacy settings applied)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const supabase = await createClient();
    const { userId } = await params;

    // Validate UUID format using Zod
    const validation = UuidSchema.safeParse(userId);
    if (!validation.success) {
      return badRequest('잘못된 사용자 ID 형식입니다');
    }

    // Query user by ID (O(1) with primary key)
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (userError) {
      if (userError.code === 'PGRST116') {
        return notFound('사용자를 찾을 수 없습니다');
      }
      throw userError;
    }

    // Use centralized transformer with privacy settings applied
    const user = toPublicUser(userData as DbUser);

    return NextResponse.json(user);
  } catch (error) {
    console.error('[GET /api/user/[userId]]', error);
    return handleError(error, '/api/user/[userId]');
  }
}
