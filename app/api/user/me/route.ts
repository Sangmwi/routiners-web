import { NextResponse } from 'next/server';
import { withAuth } from '@/utils/supabase/auth';
import { toUser, DbUser } from '@/lib/types/user';
import { notFound, handleSupabaseError } from '@/lib/utils/apiResponse';

/**
 * GET /api/user/me
 * Get current authenticated user's profile
 *
 * ⚠️ users 테이블은 provider_id로 조회 (authUser.id = Supabase Auth UID)
 */
export const GET = withAuth(async (_request, { authUser, supabase }) => {
  // Fetch user profile by provider_id
  const { data: user, error } = await supabase
    .from('users')
    .select('*')
    .eq('provider_id', authUser.id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return notFound('사용자를 찾을 수 없습니다');
    }
    return handleSupabaseError(error);
  }

  // Use centralized transformer
  const transformedUser = toUser(user as DbUser);

  // 팔로워/팔로잉 수 조회
  const [{ count: followersCount }, { count: followingCount }] = await Promise.all([
    supabase
      .from('user_follows')
      .select('*', { count: 'exact', head: true })
      .eq('following_id', transformedUser.id),
    supabase
      .from('user_follows')
      .select('*', { count: 'exact', head: true })
      .eq('follower_id', transformedUser.id),
  ]);

  return NextResponse.json({
    ...transformedUser,
    followersCount: followersCount ?? 0,
    followingCount: followingCount ?? 0,
  });
});
