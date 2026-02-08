import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { handleError } from '@/lib/utils/apiResponse';
import { z } from 'zod';

// Validation schema for nickname
const NicknameQuerySchema = z.object({
  nickname: z
    .string()
    .min(2, '닉네임은 2자 이상이어야 합니다')
    .max(20, '닉네임은 20자 이하여야 합니다'),
});

/**
 * GET /api/user/check-nickname?nickname=...
 * Check if nickname is available
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const nickname = searchParams.get('nickname');

    // Validate input
    const validation = NicknameQuerySchema.safeParse({ nickname });
    if (!validation.success) {
      const firstError = validation.error.errors[0];
      return NextResponse.json({
        available: false,
        reason: firstError?.message || '올바르지 않은 닉네임입니다',
      });
    }

    const supabase = await createClient();

    // Check if nickname exists (본인 제외)
    let query = supabase
      .from('users')
      .select('id')
      .eq('nickname', validation.data.nickname);

    const excludeUserId = searchParams.get('excludeUserId');
    if (excludeUserId) {
      query = query.neq('id', excludeUserId);
    }

    const { data, error } = await query.maybeSingle();

    if (error) {
      throw error;
    }

    return NextResponse.json({
      available: !data,
    });
  } catch (error) {
    console.error('[GET /api/user/check-nickname]', error);
    return handleError(error, '/api/user/check-nickname');
  }
}
