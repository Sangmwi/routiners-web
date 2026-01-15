import { NextResponse } from 'next/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { withAuth } from '@/utils/supabase/auth';

/**
 * DELETE /api/user/withdraw
 *
 * 회원 탈퇴 처리:
 * 1. DB users 테이블에서 사용자 삭제 (Hard Delete)
 * 2. Storage에서 사용자 프로필 이미지 삭제
 * 3. Supabase Auth에서 사용자 삭제 (service role key 필요)
 */
export const DELETE = withAuth(async (_request, { userId, supabase, authUser }) => {
  try {
    // 1. Storage에서 사용자 프로필 이미지 삭제
    const { data: files } = await supabase.storage
      .from('profile-images')
      .list(userId);

    if (files && files.length > 0) {
      const filePaths = files.map((file) => `${userId}/${file.name}`);
      await supabase.storage.from('profile-images').remove(filePaths);
    }

    // 2. DB에서 사용자 삭제 (RLS 정책에 따라 자신의 데이터만 삭제 가능)
    const { error: deleteError } = await supabase
      .from('users')
      .delete()
      .eq('id', userId);

    if (deleteError) {
      console.error('[Withdraw] DB delete error:', deleteError);
      return NextResponse.json(
        { error: '탈퇴 처리에 실패했습니다.' },
        { status: 500 }
      );
    }

    // 3. Supabase Auth에서 사용자 삭제 (service role key가 있는 경우에만)
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (serviceRoleKey) {
      try {
        const supabaseAdmin = createSupabaseClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          serviceRoleKey
        );

        const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(
          authUser.id
        );

        if (authError) {
          // Auth 삭제 실패해도 DB 삭제는 완료됐으므로 성공으로 처리
          console.error('[Withdraw] Auth delete error:', authError);
        }
      } catch (authDeleteError) {
        console.error('[Withdraw] Auth delete exception:', authDeleteError);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Withdraw] Unexpected error:', error);
    return NextResponse.json(
      { error: '탈퇴 처리 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
});
