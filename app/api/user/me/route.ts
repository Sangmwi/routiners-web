import { NextResponse } from 'next/server';
import { withAuth } from '@/utils/supabase/auth';
import { transformDbUserToUser, DbUser } from '@/lib/types/user';
import { notFound, handleSupabaseError } from '@/lib/utils/apiResponse';

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
      return notFound('사용자를 찾을 수 없습니다');
    }
    return handleSupabaseError(error);
  }

  // Use centralized transformer
  const transformedUser = transformDbUserToUser(user as DbUser);

  return NextResponse.json(transformedUser);
});
